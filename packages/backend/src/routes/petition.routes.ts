/**
 * E-Lanka Digital Democracy Platform
 * E-Petition Engine Routes (EL-SPEC-2026-V3 Section 3.2)
 *
 * Implements:
 * 1. Duplicate-submission prevention via HMAC-SHA256 blind indexing
 * 2. Field-Level Encryption (AES-256-GCM) on signer PII
 * 3. Real-time cached signature counter widget
 */

import { Router, Request, Response } from 'express';
import { DatabaseStore } from '../db/store';
import { isValidSriLankanNIC } from '../crypto/blind-index';
import { decodeAndValidateSriLankanNIC } from '../crypto/nic-validator';
import { PDPAService } from '../services/pdpa.service';

export const petitionRouter = Router();

/**
 * List all active public e-petitions
 */
petitionRouter.get('/', (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const petitions = store.getPetitions();
  res.json({
    data: petitions,
    total: petitions.length
  });
});

/**
 * Get petition details by ID
 */
petitionRouter.get('/:id', (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const petition = store.getPetitionById(req.params.id);

  if (!petition) {
    res.status(404).json({ error: 'Petition not found' });
    return;
  }

  res.json({ data: petition });
});

/**
 * Live Signature Counter Widget Endpoint (cached, lightweight for low-bandwidth polling)
 */
petitionRouter.get('/:id/counter', (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const petition = store.getPetitionById(req.params.id);

  if (!petition) {
    res.status(404).json({ error: 'Petition not found' });
    return;
  }

  const percentReached = Number(
    ((petition.currentSignatures / petition.requiredSignatures) * 100).toFixed(1)
  );

  res.json({
    petitionId: petition.id,
    currentSignatures: petition.currentSignatures,
    requiredSignatures: petition.requiredSignatures,
    percentReached: Math.min(100, percentReached),
    lastUpdated: petition.updatedAt
  });
});

/**
 * Verified "Sign Petition" workflow
 * Deduplicated via HMAC-SHA256 blind indexing without decrypting existing records
 */
petitionRouter.post('/:id/sign', (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const { nicNumber, fullName, email, district, agreeToDemands, consentDataProcessing } = req.body;

  if (!nicNumber || !fullName || !district) {
    res.status(400).json({ error: 'NIC number, full name, and district are mandatory.' });
    return;
  }

  if (!agreeToDemands) {
    res.status(400).json({ error: 'You must agree to the petition objective statements.' });
    return;
  }

  if (!consentDataProcessing) {
    res.status(400).json({
      error: 'Sri Lanka PDPA consent is required to verify your citizenship signature.'
    });
    return;
  }

  // Validate Sri Lankan NIC format and mathematical day-of-year checksum
  const nicValidation = decodeAndValidateSriLankanNIC(nicNumber);
  if (!nicValidation.isValid) {
    res.status(400).json({
      error: nicValidation.validationError || 'Invalid Sri Lankan National Identity Card (NIC) format or checksum.'
    });
    return;
  }

  try {
    const result = store.signPetition({
      petitionId: req.params.id,
      nicNumber,
      fullName,
      email: email || '',
      district
    });

    if (!result.success) {
      res.status(409).json({
        error: 'DUPLICATE_SIGNATURE',
        message: result.message,
        currentSignatures: result.currentSignatures
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: result.message,
      currentSignatures: result.currentSignatures
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Offline Batch Synchronization for Field Agents / Youth Champions
 * Atomically verifies and records queued offline signatures
 */
petitionRouter.post('/batch-sync', (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const { queue, collectorId } = req.body;

  if (!queue || !Array.isArray(queue)) {
    res.status(400).json({ error: 'Queue array required for batch synchronization' });
    return;
  }

  const batchResult = store.batchSignPetitions(
    queue.map((item: any) => ({
      petitionId: item.petitionId,
      nicNumber: item.nicNumber,
      signerBlindIndex: item.nicBlindIndex || item.signerBlindIndex,
      anonymizedAlias: item.anonymizedAlias,
      district: item.district || 'Colombo',
      collectorId: collectorId || item.collectorId || 'FIELD_CHAMPION_OFFLINE',
      signedAt: item.collectedAt || item.signedAt
    }))
  );

  PDPAService.logAudit({
    action: 'EPETITION_SIGNED',
    actorRole: 'FIELD_CHAMPION',
    actorId: collectorId || 'CSLK-YOUTH-CHAMPION-FIELD',
    resourceType: 'PETITION_SIGNATURE',
    resourceId: `BATCH-${Date.now()}`,
    purposeDescription: `Batch synchronized ${batchResult.syncedCount} offline citizen petition signatures from rural field collection (${batchResult.skippedCount} duplicates skipped).`,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'] as string
  });

  res.json({
    success: true,
    totalProcessed: batchResult.totalProcessed,
    syncedSignatures: batchResult.syncedCount,
    skippedDuplicates: batchResult.skippedCount,
    message: `Successfully synchronized ${batchResult.syncedCount} offline petition signatures.`
  });
});


