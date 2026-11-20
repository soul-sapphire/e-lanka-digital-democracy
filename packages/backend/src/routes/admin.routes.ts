/**
 * E-Lanka Digital Democracy Platform
 * Administrative & Moderation Panel Routes
 *
 * Implements:
 * 1. Strict Server-Side RBAC: Blocks CITIZEN and unauthenticated access
 * 2. Stage 1 Proposal Moderation Queue (PENDING -> APPROVED_PANEL)
 * 3. PDPA No. 9 of 2022 Statutory Audit Ledger Viewer (SYSTEM_AUDITOR)
 * 4. AI Opinion Mapping & Scrubbing Worker Triggers (POLICY_ADMIN / PANEL_MODERATOR)
 */

import { Router, Request, Response } from 'express';
import { PolicyLifecycleStage } from '@e-lanka/shared';
import { DatabaseStore } from '../db/store';
import { PDPAService } from '../services/pdpa.service';
import { AIWorkerService } from '../services/ai-worker.service';
import { authenticateToken, requireRoles, requireTOTP2FA } from '../middleware/auth.middleware';

export const adminRouter = Router();

// Enforce authentication & reject CITIZEN role across all /admin endpoints
adminRouter.use(authenticateToken);
adminRouter.use((req: Request, res: Response, next) => {
  if (!req.user || req.user.role === 'CITIZEN') {
    res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Access denied: Citizen role does not possess permissions for administrative moderation or audit resources.'
    });
    return;
  }
  next();
});

/**
 * Stage 1 Proposals Moderation Queue
 * Restricted to PANEL_MODERATOR and POLICY_ADMIN
 */
adminRouter.get(
  '/pending-queue',
  requireRoles(['PANEL_MODERATOR', 'POLICY_ADMIN']),
  (req: Request, res: Response): void => {
    const store = DatabaseStore.getInstance();
    const allPolicies = store.getPolicies(true);
    const pending = allPolicies.filter(p => p.stage === PolicyLifecycleStage.STAGE_1_PENDING_REVIEW);

    res.json({
      data: pending,
      totalPending: pending.length
    });
  }
);

/**
 * Immutable PDPA Audit Logs
 * Restricted to SYSTEM_AUDITOR (and PANEL_MODERATOR / POLICY_ADMIN)
 */
adminRouter.get(
  '/audit-logs',
  requireRoles(['SYSTEM_AUDITOR', 'PANEL_MODERATOR', 'POLICY_ADMIN']),
  (req: Request, res: Response): void => {
    const action = req.query.action as any;
    const limit = Number(req.query.limit) || 50;

    const logs = PDPAService.getAuditLogs({ action, limit });
    const chainStatus = PDPAService.verifyChainIntegrity();

    res.json({
      chainIntegrityVerified: chainStatus.isValid,
      totalBlocks: chainStatus.totalBlocksChecked,
      logs
    });
  }
);

/**
 * Trigger AI Opinion Mapping & Scrubbing Worker for a Policy
 * Restricted to POLICY_ADMIN and PANEL_MODERATOR with mandatory TOTP 2FA
 */
adminRouter.post(
  '/ai-sync/:policyId',
  requireRoles(['PANEL_MODERATOR', 'POLICY_ADMIN']),
  requireTOTP2FA,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const aggregate = await AIWorkerService.processAndSyncAggregates(req.params.policyId);
      res.json({
        success: true,
        message: 'AI Opinion Mapping and PII Scrubbing completed successfully.',
        aggregate
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Test PII Scrubbing Utility endpoint
 * Restricted to PANEL_MODERATOR and POLICY_ADMIN
 */
adminRouter.post(
  '/test-scrub',
  requireRoles(['PANEL_MODERATOR', 'POLICY_ADMIN']),
  (req: Request, res: Response): void => {
    const { sampleText } = req.body;
    if (!sampleText) {
      res.status(400).json({ error: 'sampleText is required' });
      return;
    }

    const result = AIWorkerService.scrubPII(sampleText);
    res.json({ result });
  }
);
