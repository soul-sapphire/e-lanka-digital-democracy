/**
 * E-Lanka Digital Democracy Platform
 * Multi-Tier Citizen Verification Types (EL-SPEC-2026-V3)
 *
 * Implements:
 * Tier 1: Algorithmic Sri Lankan NIC Mathematical Decoder & DOB Matcher
 * Tier 2: DRP (Department for Registration of Persons) e-KYC Gateway
 * Tier 3: TRCSL Mobile SIM OTP Verification
 */

export interface SriLankanNICDetails {
  nicNumber: string;
  format: 'OLD_9_DIGIT' | 'NEW_12_DIGIT';
  birthYear: number;
  dayOfYear: number;
  gender: 'MALE' | 'FEMALE';
  calculatedDOB: string; // YYYY-MM-DD
  isVoterEligible: boolean;
  isValid: boolean;
  validationError?: string;
}

export interface DRPVerificationResult {
  verified: boolean;
  drpTransactionId: string;
  citizenStatus: 'ACTIVE_LIVING' | 'DECEASED' | 'NOT_FOUND' | 'FLAGGED';
  electoralDistrict?: string;
  verifiedAt: string;
  gatewayAuthority: string;
}

export interface MobileOTPDispatchResult {
  success: boolean;
  mobileMasked: string;
  otpReference: string;
  expiresInSeconds: number;
  demoOtpCode?: string; // Provided in sandbox/demo environments for immediate testing
  message: string;
}

export interface MobileOTPVerifyResult {
  verified: boolean;
  mobileBlindHash: string;
  verifiedAt: string;
  message: string;
}

export interface SovereignVerificationSubmission {
  nicNumber: string;
  claimedDOB: string;
  claimedGender: 'MALE' | 'FEMALE';
  mobileNumber: string;
  otpCode: string;
  otpReference: string;
}

