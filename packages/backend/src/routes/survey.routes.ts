/**
 * E-Lanka Digital Democracy Platform
 * Dynamic Survey & Questionnaire Ingestion Routes
 *
 * Implements Field-Level Encryption (AES-256-GCM) on all open-ended responses,
 * Blind Indexing for non-retaliation participation tracking, and
 * offline submission batch synchronization for low-bandwidth environments.
 */

import { Router, Request, Response } from 'express';
import { DatabaseStore } from '../db/store';
import { authenticateToken } from '../middleware/auth.middleware';
import { computeBlindHash } from '../crypto/blind-index';

export const surveyRouter = Router();

/**
 * Get dynamic survey and questions for a specific policy
 */
surveyRouter.get('/policy/:policyId', (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const { survey, questions } = store.getSurveyByPolicyId(req.params.policyId);

  if (!survey) {
    res.status(404).json({ error: 'No active questionnaire formulated for this policy consultation yet' });
    return;
  }

  res.json({
    survey,
    questions: questions.sort((a, b) => a.orderIndex - b.orderIndex)
  });
});

/**
 * Submit survey response
 * Open-ended text is encrypted with AES-256-GCM before DB insertion
 */
surveyRouter.post('/submit', authenticateToken, (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const { surveyId, policyId, answers, citizenIdentifier, clientLanguage } = req.body;

  if (!surveyId || !policyId || !answers || !Array.isArray(answers)) {
    res.status(400).json({ error: 'Missing required survey submission fields' });
    return;
  }

  // Derive blind index from citizen's NIC, user session, or client anonymous identifier
  const rawId = citizenIdentifier || req.user?.nicBlindIndex || req.ip || crypto.randomUUID();
  const citizenBlindIndex = computeBlindHash(rawId, 'NIC');

  try {
    const result = store.ingestSurveyResponse({
      surveyId,
      policyId,
      citizenBlindIndex,
      answers,
      clientLanguage: clientLanguage || 'en'
    });

    res.status(201).json({
      success: true,
      message: 'Survey submission ingested with AES-256-GCM application encryption.',
      submissionCount: result.responseCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Low-Bandwidth Offline Sync:
 * Receives queued submissions stored client-side in PWA IndexedDB while offline
 */
surveyRouter.post('/batch-sync', authenticateToken, (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const { queue } = req.body;

  if (!queue || !Array.isArray(queue)) {
    res.status(400).json({ error: 'Queue array required for batch synchronization' });
    return;
  }

  let syncedCount = 0;
  for (const item of queue) {
    const rawId = item.citizenIdentifier || req.user?.nicBlindIndex || crypto.randomUUID();
    const citizenBlindIndex = computeBlindHash(rawId, 'NIC');

    store.ingestSurveyResponse({
      surveyId: item.surveyId,
      policyId: item.policyId,
      citizenBlindIndex,
      answers: item.answers,
      clientLanguage: item.clientLanguage || 'en'
    });
    syncedCount++;
  }

  res.json({
    success: true,
    syncedSubmissions: syncedCount,
    message: `Successfully synchronized ${syncedCount} offline questionnaire submissions.`
  });
});

