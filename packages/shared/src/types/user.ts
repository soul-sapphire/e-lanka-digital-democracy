/**
 * User Roles & RBAC (EL-SPEC-2026-V3)
 */

export type UserRole =
  | 'CITIZEN'            // Public verified citizen
  | 'PANEL_MODERATOR'   // Expert Panel Member (approves Stage 1 proposals)
  | 'POLICY_ADMIN'      // Formulates questionnaires & manages lifecycle
  | 'SYSTEM_AUDITOR';   // PDPA Compliance Officer & System Auditor

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

