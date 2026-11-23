/**
 * E-Lanka Digital Democracy Platform
 * Dual-Channel Verification Service: Sri Lankan Mobile SIM OTP & Direct Email OTP
 *
 * Implements:
 * Tier 3: Cryptographic One-Time Password (OTP) verification over:
 * 1. Sri Lankan Telco networks (Dialog, Mobitel, Airtel, Hutch)
 * 2. Instant Email Gateway (Zero-Cost quota division)
 *
 * Allows citizens to choose either Email or Mobile SMS to divide network requests,
 * save carrier SMS quotas, and maintain 100% free operation.
 */

import crypto from 'crypto';
import { MobileOTPDispatchResult, MobileOTPVerifyResult } from '@e-lanka/shared';
import { generateBlindIndex } from '../crypto/blind-index';

interface PendingOTP {
  reference: string;
  destination: string; // Normalized phone or email
  channel: 'MOBILE' | 'EMAIL';
  otpCode: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

// Sri Lankan Mobile Network Operators (TRCSL allocated prefixes: 070, 071, 072, 074, 075, 076, 077, 078)
const LK_MOBILE_REGEX = /^(?:\+94|0094|0)?(7[01245678]\d{7})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class OTPService {
  private activeOTPs: Map<string, PendingOTP> = new Map();
  private readonly OTP_TTL_MS = 120 * 1000; // 2 minutes
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Validate and normalize Sri Lankan Mobile Phone Number
   */
  public normalizeLKMobile(rawNumber: string): { isValid: boolean; normalized?: string; formatted?: string; error?: string } {
    if (!rawNumber) {
      return { isValid: false, error: 'Mobile phone number is required.' };
    }

    const clean = rawNumber.trim().replace(/[\s-()]/g, '');
    const match = clean.match(LK_MOBILE_REGEX);

    if (!match) {
      return {
        isValid: false,
        error: 'Invalid Sri Lankan mobile number. Must be a valid 9-digit subscriber number starting with 07X (e.g., 0771234567 or +94771234567).'
      };
    }

    const subscriber = match[1]; // e.g. 771234567
    const normalized = `+94${subscriber}`;
    const formatted = `+94 ${subscriber.slice(0, 2)} ${subscriber.slice(2, 5)} ${subscriber.slice(5)}`;

    return {
      isValid: true,
      normalized,
      formatted
    };
  }

  /**
   * Validate and normalize Email Address
   */
  public normalizeEmail(rawEmail: string): { isValid: boolean; normalized?: string; error?: string } {
    if (!rawEmail) {
      return { isValid: false, error: 'Email address is required.' };
    }

    const clean = rawEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(clean)) {
      return {
        isValid: false,
        error: 'Invalid email address format (e.g. citizen@example.com).'
      };
    }

    return {
      isValid: true,
      normalized: clean
    };
  }

  /**
   * Mask a mobile number for safe UI display (e.g., "+94 77 *** 4589")
   */
  public maskMobile(normalized: string): string {
    const clean = normalized.replace(/^\+94/, '');
    const prefix = clean.slice(0, 2);
    const suffix = clean.slice(-4);
    return `+94 ${prefix} *** ${suffix}`;
  }

  /**
   * Mask an email address for safe UI display (e.g., "ru***5@gmail.com")
   */
  public maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    const prefix = local.slice(0, 2);
    const suffix = local.slice(-1);
    return `${prefix}***${suffix}@${domain}`;
  }

  /**
   * Generate and dispatch an OTP to a verified Sri Lankan mobile number or Email address
   */
  public async dispatchOTP(
    destination: string,
    channel: 'MOBILE' | 'EMAIL' = 'MOBILE'
  ): Promise<MobileOTPDispatchResult> {
    this.cleanupExpired();

    const isEmail = channel === 'EMAIL' || destination.includes('@');
    const effectiveChannel: 'MOBILE' | 'EMAIL' = isEmail ? 'EMAIL' : 'MOBILE';

    let normalized = '';
    let masked = '';

    if (effectiveChannel === 'EMAIL') {
      const emailValidation = this.normalizeEmail(destination);
      if (!emailValidation.isValid || !emailValidation.normalized) {
        return {
          success: false,
          mobileMasked: destination,
          otpReference: '',
          expiresInSeconds: 0,
          message: emailValidation.error || 'Invalid email address format.'
        };
      }
      normalized = emailValidation.normalized;
      masked = this.maskEmail(normalized);
    } else {
      const mobileValidation = this.normalizeLKMobile(destination);
      if (!mobileValidation.isValid || !mobileValidation.normalized) {
        return {
          success: false,
          mobileMasked: destination,
          otpReference: '',
          expiresInSeconds: 0,
          message: mobileValidation.error || 'Invalid Sri Lankan mobile number format.'
        };
      }
      normalized = mobileValidation.normalized;
      masked = this.maskMobile(normalized);
    }

    const prefix = effectiveChannel === 'EMAIL' ? 'EML' : 'MOB';
    const reference = `OTP-${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + this.OTP_TTL_MS;

    this.activeOTPs.set(reference, {
      reference,
      destination: normalized,
      channel: effectiveChannel,
      otpCode,
      expiresAt,
      attempts: 0,
      verified: false
    });

    // Dispatch via external live gateway if configured
    if (effectiveChannel === 'EMAIL') {
      if (process.env.RESEND_API_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'E-Lanka Digital Democracy <onboarding@resend.dev>',
              to: [normalized],
              subject: `[E-Lanka] Your Verification Code is ${otpCode}`,
              html: `<p>Your E-Lanka one-time verification code is: <strong>${otpCode}</strong>. Valid for 2 minutes.</p>`
            })
          });
        } catch (err) {
          console.error('[Email OTP Service] Live dispatch error:', err);
        }
      } else {
        console.log(`[Email Sandbox] Generated OTP for ${normalized} (${reference}): ${otpCode}`);
      }
    } else {
      if (process.env.LK_SMS_GATEWAY_URL && process.env.LK_SMS_GATEWAY_KEY) {
        try {
          await fetch(process.env.LK_SMS_GATEWAY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.LK_SMS_GATEWAY_KEY}`
            },
            body: JSON.stringify({
              recipient: normalized,
              message: `[E-Lanka Digital Democracy] Your verification code is ${otpCode}. Valid for 2 minutes. Do not share this code.`
            })
          });
        } catch (err) {
          console.error('[SMS Service] Failed to send via live gateway:', err);
        }
      } else {
        console.log(`[SMS Sandbox] Generated OTP for ${normalized} (${reference}): ${otpCode}`);
      }
    }

    return {
      success: true,
      mobileMasked: masked,
      otpReference: reference,
      expiresInSeconds: Math.floor(this.OTP_TTL_MS / 1000),
      demoOtpCode: process.env.NODE_ENV === 'production' && (process.env.LK_SMS_GATEWAY_URL || process.env.RESEND_API_KEY) ? undefined : otpCode,
      message: `OTP dispatched to ${masked}. Please enter the 6-digit code.`
    };
  }

  /**
   * Verify an entered OTP against reference and destination
   */
  public verifyOTP(
    reference: string,
    rawDestination: string,
    submittedCode: string,
    channel?: 'MOBILE' | 'EMAIL'
  ): MobileOTPVerifyResult {
    this.cleanupExpired();

    const record = this.activeOTPs.get(reference);
    if (!record) {
      return {
        verified: false,
        mobileBlindHash: '',
        verifiedAt: new Date().toISOString(),
        message: 'OTP session expired or invalid. Please request a new code.'
      };
    }

    if (Date.now() > record.expiresAt) {
      this.activeOTPs.delete(reference);
      return {
        verified: false,
        mobileBlindHash: '',
        verifiedAt: new Date().toISOString(),
        message: 'Verification code has expired. Please request a new one.'
      };
    }

    // Normalize comparison destination
    let normalizedDestination = '';
    if (record.channel === 'EMAIL') {
      const emailValidation = this.normalizeEmail(rawDestination);
      normalizedDestination = emailValidation.normalized || rawDestination.trim().toLowerCase();
    } else {
      const mobileValidation = this.normalizeLKMobile(rawDestination);
      normalizedDestination = mobileValidation.normalized || rawDestination.trim();
    }

    if (normalizedDestination !== record.destination) {
      return {
        verified: false,
        mobileBlindHash: '',
        verifiedAt: new Date().toISOString(),
        message: `${record.channel === 'EMAIL' ? 'Email address' : 'Mobile number'} does not match the active verification session.`
      };
    }

    record.attempts += 1;
    if (record.attempts > this.MAX_ATTEMPTS) {
      this.activeOTPs.delete(reference);
      return {
        verified: false,
        mobileBlindHash: '',
        verifiedAt: new Date().toISOString(),
        message: 'Maximum verification attempts exceeded. Session invalidated.'
      };
    }

    if (record.otpCode !== submittedCode.trim()) {
      return {
        verified: false,
        mobileBlindHash: '',
        verifiedAt: new Date().toISOString(),
        message: `Invalid 6-digit OTP code. (${this.MAX_ATTEMPTS - record.attempts} attempts remaining)`
      };
    }

    record.verified = true;
    const blindHash = generateBlindIndex(
      record.destination,
      record.channel === 'EMAIL' ? 'EMAIL' : 'MOBILE'
    ).hash;

    // Consume the OTP
    this.activeOTPs.delete(reference);

    return {
      verified: true,
      mobileBlindHash: blindHash,
      verifiedAt: new Date().toISOString(),
      message: `${record.channel === 'EMAIL' ? 'Email' : 'Mobile SIM'} successfully verified via cryptographic gateway.`
    };
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, value] of this.activeOTPs.entries()) {
      if (now > value.expiresAt) {
        this.activeOTPs.delete(key);
      }
    }
  }
}

export const mobileOTPService = new OTPService();
export const otpService = mobileOTPService;
