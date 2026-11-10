/**
 * E-Petition Engine Types (EL-SPEC-2026-V3)
 */

import { LocalizedString } from './policy';
import { EncryptedPayload } from './crypto';

export type PetitionStatus = 'DRAFT' | 'ACTIVE' | 'SUBMITTED_TO_AUTHORITY' | 'ACCEPTED' | 'CLOSED';

export interface EPetition {
  id: string;
  code: string; // e.g. "PET-2026-089"
  title: LocalizedString;
  objectiveStatement: LocalizedString;
  targetAuthority: string; // e.g. "Ministry of Digital Infrastructure & Technology"
  backgroundDocumentationUrl?: string;
  category: string;
  requiredSignatures: number;
  currentSignatures: number;
  status: PetitionStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface PetitionSignatureSubmission {
  petitionId: string;
  /** National Identity Card (NIC) number provided by citizen (old 9+V or new 12 digit) */
  nicNumber: string;
  fullName: string;
  email: string;
  district: string;
  agreeToDemands: boolean;
  /** Sri Lanka PDPA consent acknowledgement */
  consentDataProcessing: boolean;
}

export interface VerifiedSignatureRecord {
  id: string;
  petitionId: string;
  /** HMAC-SHA256 blind index preventing duplicate signing by same citizen */
  signerBlindIndex: string;
  /** AES-256-GCM encrypted PII containing name and district */
  encryptedSignerData: EncryptedPayload;
  signedAt: string;
  isErased: boolean;
}

export interface LiveCounterUpdate {
  petitionId: string;
  currentSignatures: number;
  requiredSignatures: number;
  percentReached: number;
  lastUpdated: string;
}

