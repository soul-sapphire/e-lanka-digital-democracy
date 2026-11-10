/**
 * E-Lanka Digital Democracy Platform
 * Policy Consultation Lifecycle Routes (EL-SPEC-2026-V3)
 *
 * Implements the 5-Stage Policy Lifecycle Gate:
 * Stage 1: PENDING_REVIEW (Moderation Queue)
 * Stage 2: APPROVED_PANEL (Panel Gate explicitly checked)
 * Stage 3: ACTIVE_CONSULTATION (Surveys & WhatsApp/Email live)
 * Stage 4: AI_ANALYSIS_SYNC (PII scrubbing & sentiment clusters)
 * Stage 5: CONCLUDED_ARCHIVED (Final policy dataset & outcomes)
 */

import { Router, Request, Response } from 'express';
import { PolicyLifecycleStage } from '@e-lanka/shared';
import { DatabaseStore } from '../db/store';
import { authenticateToken, requireRoles, requireTOTP2FA } from '../middleware/auth.middleware';
import { InvitationService } from '../services/invitation.service';

export const policyRouter = Router();

/**
 * Public policy feed
 */
policyRouter.get('/', authenticateToken, (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const isAdmin = req.user && ['PANEL_MODERATOR', 'POLICY_ADMIN', 'SYSTEM_AUDITOR'].includes(req.user.role);
  const policies = store.getPolicies(Boolean(isAdmin));

  res.json({
    data: policies,
    total: policies.length
  });
});

/**
 * Policy detail by ID
 */
policyRouter.get('/:id', (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const policy = store.getPolicyById(req.params.id);

  if (!policy) {
    res.status(404).json({ error: 'Policy consultation not found' });
    return;
  }

  // Generate shareable WhatsApp deep link
  const whatsappUrl = InvitationService.buildWhatsAppShareUrl({
    policyId: policy.id,
    policyCode: policy.code,
    policyTitle: policy.title.en
  });

  res.json({
    data: policy,
    whatsappShareUrl: whatsappUrl
  });
});

/**
 * Stage 1: Citizen / Proposer submits new draft policy proposal
 * Enters restricted Stage 1 Moderation Queue
 */
policyRouter.post('/', authenticateToken, (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const { title, summary, fullDescription, category, targetMinistry, authorAgency } = req.body;

  if (!title || !summary || !category) {
    res.status(400).json({ error: 'Title, summary, and category are required' });
    return;
  }

  const newPolicy = store.createPolicy({
    title,
    summary,
    fullDescription: fullDescription || summary,
    category,
    targetMinistry: targetMinistry || 'Ministry of Public Administration',
    authorAgency: authorAgency || req.user?.anonymizedAlias || 'Citizen Working Group'
  });

  res.status(201).json({
    message: 'Policy proposal successfully submitted and queued for Expert Panel review.',
    data: newPolicy
  });
});

/**
 * Stage 1 -> Stage 2 Moderation Gate (PENDING -> APPROVED_PANEL)
 * Strictly requires PANEL_MODERATOR role and TOTP 2FA verification
 */
policyRouter.post(
  '/:id/moderate',
  authenticateToken,
  requireRoles(['PANEL_MODERATOR', 'POLICY_ADMIN']),
  requireTOTP2FA,
  (req: Request, res: Response): void => {
    const store = DatabaseStore.getInstance();
    const { approved, panelNotes } = req.body;
    const policyId = req.params.id;

    if (approved === undefined) {
      res.status(400).json({ error: 'Moderation decision (approved: boolean) is required' });
      return;
    }

    try {
      const targetStage = approved
        ? PolicyLifecycleStage.STAGE_2_APPROVED_PANEL
        : PolicyLifecycleStage.STAGE_1_PENDING_REVIEW;

      const updated = store.updatePolicyStage(
        policyId,
        targetStage,
        panelNotes || 'Reviewed by statutory Expert Moderation Panel',
        req.user?.id || 'moderator_system'
      );

      res.json({
        message: approved
          ? 'Policy proposal APPROVED by Panel Gate. Ready for survey questionnaire formulation.'
          : 'Policy proposal held in PENDING status.',
        data: updated
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

/**
 * Lifecycle transitions (Stage 2 -> Stage 3 -> Stage 4 -> Stage 5)
 */
policyRouter.post(
  '/:id/transition',
  authenticateToken,
  requireRoles(['POLICY_ADMIN', 'PANEL_MODERATOR']),
  requireTOTP2FA,
  (req: Request, res: Response): void => {
    const store = DatabaseStore.getInstance();
    const { targetStage, panelNotes } = req.body;

    if (!targetStage) {
      res.status(400).json({ error: 'targetStage is required' });
      return;
    }

    try {
      const updated = store.updatePolicyStage(
        req.params.id,
        targetStage,
        panelNotes || `Transitioned to ${targetStage}`,
        req.user?.id || 'admin_system'
      );

      res.json({
        message: `Policy successfully transitioned to ${targetStage}`,
        data: updated
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

