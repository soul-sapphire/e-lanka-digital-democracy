/**
 * Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022 Compliance Types
 */

export type PDPAActionType =
  | 'CONSENT_GRANTED'
  | 'CONSENT_WITHDRAWN'
  | 'DATA_INGESTION'
  | 'FIELD_ENCRYPTION_ACCESS'
  | 'ERASURE_REQUEST'
  | 'ERASURE_COMPLETED'
  | 'DATA_ERASURE_EXECUTED'
  | 'DATA_EXPORT_SUBJECT'
  | 'ADMIN_PANEL_ACCESS'
  | 'AI_SCRUBBING_RUN'
  | 'AI_PII_SCRUBBING_TRIGGERED'
  | 'FAILED_2FA_ATTEMPT'
  | 'EPETITION_SIGNED'
  | 'POLICY_PUBLISHED';

export type PDPAResourceType =
  | 'POLICY'
  | 'SURVEY_RESPONSE'
  | 'PETITION_SIGNATURE'
  | 'USER_PROFILE'
  | 'SYSTEM'
  | 'SECURITY'
  | 'AUTHENTICATION';

export interface PDPAAuditLogRecord {
  id: string;
  action: PDPAActionType;
  actorRole: string;
  actorIdHash: string; // Salted hash, never raw actor identity
  resourceType: PDPAResourceType;
  resourceId: string;
  purposeDescription: string;
  ipAddressHash: string;
  userAgentHash: string;
  timestamp: string; // ISO 8601 string
  immutableSignature: string; // HMAC cryptographic chain seal
}

export interface RightToErasureRequest {
  citizenBlindIndex: string;
  erasureScope: 'ALL_PII' | 'SURVEY_RESPONSES' | 'PETITION_SIGNATURES';
  reason?: string;
  acknowledgedImmutableRetention: boolean; // Aggregate statistics preserved
}

export interface ErasureResult {
  success: boolean;
  citizenBlindIndex: string;
  anonymizedSurveyResponses: number;
  anonymizedSignatures: number;
  preservedAggregateCount: number;
  timestamp: string;
  pdpaAuditId: string;
}
