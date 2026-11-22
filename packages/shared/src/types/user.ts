/**
 * User Roles & RBAC (EL-SPEC-2026-V3)
 */

export type UserRole =
  | 'CITIZEN'            // Public verified citizen
  | 'FIELD_CHAMPION'     // CSLK Youth Champion / Field Enumerator for rural offline collection
  | 'PANEL_MODERATOR'   // Expert Panel Member (approves Stage 1 proposals)
  | 'POLICY_ADMIN'      // Formulates questionnaires & manages lifecycle
  | 'SYSTEM_AUDITOR';   // PDPA Compliance Officer & System Auditor

export interface QueuedOfflineSignature {
  id: string;
  type: 'PETITION_SIGNATURE';
  petitionId: string;
  nicBlindIndex: string;
  anonymizedAlias: string;
  district: string;
  collectorId: string;
  claimedDOB?: string;
  claimedGender?: string;
  collectedAt: string;
  synced: boolean;
}

export interface QueuedOfflineSurvey {
  id: string;
  type: 'SURVEY';
  surveyId: string;
  policyId: string;
  citizenBlindIndex: string;
  district: string;
  answers: any[];
  collectorId: string;
  clientLanguage: string;
  collectedAt: string;
  synced: boolean;
}

export interface FieldCollectorStats {
  collectorId: string;
  collectorName: string;
  district: string;
  offlineSignaturesCount: number;
  offlineSurveysCount: number;
  totalCollected: number;
  lastSyncedAt?: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  /** Blind indexed NIC for single identity per citizen */
  nicBlindIndex?: string;
  emailBlindIndex?: string;
  /** Display alias or masked identifier for privacy preservation */
  anonymizedAlias: string;
  district?: string;
  isVerifiedCitizen: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  totpEnabled: boolean;
  totpSecret?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    role: UserRole;
    anonymizedAlias: string;
    totpEnabled: boolean;
    requires2FA?: boolean;
  };
}

export interface TOTPSetupResponse {
  secret: string;
  qrCodeUrl: string;
  otpauthUri: string;
}

