/**
 * E-Lanka Digital Democracy Platform
 * Administrative & Moderation Panel Routes
 *
 * Implements:
 * 1. Stage 1 Proposal Moderation Queue (PENDING -> APPROVED_PANEL)
 * 2. PDPA No. 9 of 2022 Statutory Audit Ledger Viewer
 * 3. AI Opinion Mapping & Scrubbing Worker Triggers
 */

import { Router, Request, Response } from 'express';
import { PolicyLifecycleStage } from '@e-lanka/shared';
import { DatabaseStore } from '../db/store';
import { PDPAService } from '../services/pdpa.service';
import { AIWorkerService } from '../services/ai-worker.service';
import { authenticateToken, requireRoles, requireTOTP2FA } from '../middleware/auth.middleware';

export const adminRouter = Router();

/**
 * Stage 1 Proposals Moderation Queue
 */
adminRouter.get(
  '/pending-queue',
  authenticateToken,
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
 * Immutable PDPA Audit Logs (Restricted to SYSTEM_AUDITOR and PANEL_MODERATOR)
 */
adminRouter.get(
  '/audit-logs',
  authenticateToken,
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
 */
adminRouter.post(
  '/ai-sync/:policyId',
  authenticateToken,
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
 * Test PII Scrubbing Utility endpoint (useful for demo and verification)
 */
adminRouter.post('/test-scrub', (req: Request, res: Response): void => {
  const { sampleText } = req.body;
  if (!sampleText) {
    res.status(400).json({ error: 'sampleText is required' });
    return;
  }

  const result = AIWorkerService.scrubPII(sampleText);
  res.json({ result });
});

