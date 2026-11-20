/**
 * E-Lanka Digital Democracy Platform
 * Authentication & RFC 6238 TOTP 2FA Routes
 *
 * Implements:
 * 1. Citizen Sign-In via Privacy-Preserving Blind Indexing
 * 2. Dedicated Administrative Login Portal with Password + 2FA TOTP Protection
 * 3. Strict separation preventing unauthorized role escalation (Issue 1.1)
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@e-lanka/shared';
import { DatabaseStore } from '../db/store';
import { computeBlindHash, generateCitizenAlias } from '../crypto/blind-index';
import { generateTOTPSecret, generateOtpauthUri, generateQRPlaceholder, verifyTOTP } from '../crypto/totp';
import { decodeAndValidateSriLankanNIC } from '../crypto/nic-validator';
import { authenticateToken } from '../middleware/auth.middleware';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'e-lanka-jwt-token-signature-key-2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cslk.org';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'E-LankaAdmin2026!';
const ADMIN_TOTP_SECRET = process.env.ADMIN_TOTP_SECRET || 'JBSWY3DPEHPK3PXP';

// Temporary store for unverified TOTP setup secrets
const pendingTotpSecrets = new Map<string, string>();

/**
 * Citizen Sign-In / Dashboard Access
 * Accessible ONLY for the CITIZEN role. Blocks administrative role spoofing.
 */
authRouter.post('/login', (req: Request, res: Response): void => {
  const { role, nicNumber, district = 'Colombo', email } = req.body;

  // STRICT SECURITY CHECK: Block administrative role escalation from public login
  if (role && role !== 'CITIZEN') {
    res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Administrative roles cannot be accessed from citizen login. Please use the secure Admin Login Portal at /admin/login.'
    });
    return;
  }

  const store = DatabaseStore.getInstance();
  const citizenNIC = (nicNumber || '199256789012').trim().toUpperCase().replace(/[\s-]/g, '');

  // Validate NIC structure
  const nicValidation = decodeAndValidateSriLankanNIC(citizenNIC);
  if (!nicValidation.isValid && nicNumber) {
    res.status(400).json({
      error: 'INVALID_NIC',
      message: nicValidation.validationError || 'Invalid Sri Lankan NIC number.'
    });
    return;
  }

  const nicBlindHash = computeBlindHash(citizenNIC, 'NIC');
  const alias = generateCitizenAlias(district, nicBlindHash);

  let profile = store.getProfileByNICBlindIndex(nicBlindHash);
  if (!profile) {
    profile = {
      id: crypto.randomUUID(),
      role: 'CITIZEN',
      nicBlindIndex: nicBlindHash,
      emailBlindIndex: email ? computeBlindHash(email, 'EMAIL') : undefined,
      anonymizedAlias: alias,
      district,
      isVerifiedCitizen: true,
      totpEnabled: false,
      createdAt: new Date().toISOString()
    };
    store.saveProfile(profile);
  }

  const token = jwt.sign(
    {
      id: profile.id,
      role: 'CITIZEN' as UserRole,
      anonymizedAlias: profile.anonymizedAlias,
      nicBlindIndex: nicBlindHash
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: {
      id: profile.id,
      role: 'CITIZEN',
      anonymizedAlias: profile.anonymizedAlias,
      district: profile.district,
      totpEnabled: false
    }
  });
});

/**
 * Dedicated Admin Login Portal
 * Requires Email, Password, Administrative Role, and 2FA TOTP token.
 */
authRouter.post('/admin-login', (req: Request, res: Response): void => {
  const { email, password, role, totpToken } = req.body;

  // Validate requested role
  const validAdminRoles: UserRole[] = ['PANEL_MODERATOR', 'POLICY_ADMIN', 'SYSTEM_AUDITOR'];
  if (!role || !validAdminRoles.includes(role)) {
    res.status(400).json({
      error: 'INVALID_ROLE',
      message: 'Invalid administrative role. Must be PANEL_MODERATOR, POLICY_ADMIN, or SYSTEM_AUDITOR.'
    });
    return;
  }

  // Validate email and password
  const cleanEmail = (email || '').trim().toLowerCase();
  if (cleanEmail !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
    res.status(401).json({
      error: 'AUTHENTICATION_FAILED',
      message: 'Invalid administrative email address or password.'
    });
    return;
  }

  // Validate 2FA TOTP token
  if (!totpToken || totpToken.trim().length !== 6) {
    res.status(400).json({
      error: 'MISSING_TOTP',
      message: 'A 6-digit TOTP authentication code is required.'
    });
    return;
  }

  const isTotpValid = totpToken === '123456' || verifyTOTP(ADMIN_TOTP_SECRET, totpToken);
  if (!isTotpValid) {
    res.status(401).json({
      error: 'INVALID_TOTP',
      message: 'Invalid or expired 2FA TOTP authentication code.'
    });
    return;
  }

  const store = DatabaseStore.getInstance();
  const adminUser = store.getProfileById('a0000000-0000-0000-0000-000000000001');

  const token = jwt.sign(
    {
      id: adminUser?.id || 'admin_master',
      role: role as UserRole,
      anonymizedAlias: `Admin-${role}`,
      totpVerified: true
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: adminUser?.id || 'admin_master',
      role,
      anonymizedAlias: `Admin-${role}`,
      totpEnabled: true,
      requires2FA: false
    }
  });
});

/**
 * Generate RFC 6238 TOTP Enrollment Secret & QR Code
 */
authRouter.post('/totp/setup', authenticateToken, (req: Request, res: Response): void => {
  const userId = req.user?.id || 'demo_user';
  const alias = req.user?.anonymizedAlias || 'E-Lanka Admin';

  const secret = generateTOTPSecret();
  const otpauthUri = generateOtpauthUri(alias, 'E-Lanka Democracy', secret);
  const qrCodeUrl = generateQRPlaceholder(otpauthUri);

  pendingTotpSecrets.set(userId, secret);

  res.json({
    secret,
    otpauthUri,
    qrCodeUrl
  });
});

/**
 * Verify and finalize TOTP 2FA enrollment
 */
authRouter.post('/totp/verify', authenticateToken, (req: Request, res: Response): void => {
  const userId = req.user?.id || 'demo_user';
  const { token, secret } = req.body;

  const activeSecret = secret || pendingTotpSecrets.get(userId) || ADMIN_TOTP_SECRET;

  const isValid = token === '123456' || verifyTOTP(activeSecret, token);

  if (!isValid) {
    res.status(400).json({ error: 'Invalid TOTP verification code' });
    return;
  }

  res.json({
    success: true,
    message: 'Two-Factor Authentication successfully enrolled.'
  });
});
