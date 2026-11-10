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

  // Validate Sri Lankan NIC format (9 digits + V/X or 12 digits)
  if (!isValidSriLankanNIC(nicNumber)) {
    res.status(400).json({
      error: 'Invalid Sri Lankan National Identity Card (NIC) format. Expected 9 digits + V/X (e.g. 851234567V) or 12 digits (e.g. 198512345678).'
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

