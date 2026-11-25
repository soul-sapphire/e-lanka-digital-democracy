/**
 * E-Lanka Digital Democracy Platform
 * Zero-Cost Real Mobile Phone SMS Verification Service via Google Firebase Phone Auth
 * Free Tier Quota: 10,000 real SMS verifications per month ($0.00 forever)
 * Supports all Sri Lankan Telco Operators: Dialog, Mobitel, Airtel, Hutch
 */

import { initializeApp, getApps, getApp, FirebaseApp } from '@firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth
} from '@firebase/auth';

export interface FirebasePhoneConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export function getFirebaseConfig(): FirebasePhoneConfig {
  const env = (import.meta as any).env || {};
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDXOwjJtev50pdsCYj5ZNWOm5DoRPITCuo',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'membership-system-7eac9.firebaseapp.com',
    projectId: env.VITE_FIREBASE_PROJECT_ID || 'membership-system-7eac9',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'membership-system-7eac9.firebasestorage.app',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '244505243439',
    appId: env.VITE_FIREBASE_APP_ID || '1:244505243439:web:ff099be726acec0f8f3bda'
  };
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedConfirmationResult: ConfirmationResult | null = null;
let cachedRecaptchaVerifier: RecaptchaVerifier | null = null;

function getFirebaseAuth(): { app: FirebaseApp; auth: Auth } {
  const config = getFirebaseConfig();
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(config);
  }
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
    cachedAuth.useDeviceLanguage();
  }
  return { app: cachedApp, auth: cachedAuth };
}

/**
 * Format Firebase Error codes into user-friendly diagnostic messages
 */
function formatFirebaseError(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (msg.toLowerCase().includes('region') || msg.toLowerCase().includes('sms unable to be sent')) {
    return 'Sri Lanka (+94) is not enabled in Firebase SMS Region Policy. In Firebase Console > Authentication > Settings > "SMS region policy", add Sri Lanka (+94) to the allowlist.';
  }

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'SMS dispatch blocked by Firebase policy. Please check Firebase Console > Authentication > Settings > "SMS region policy" to enable Sri Lanka (+94), or add a test phone number.';
    case 'auth/unauthorized-domain':
      return 'This web domain is not yet authorized in Firebase Console. Please add this domain under Authentication > Settings > Authorized domains.';
    case 'auth/captcha-check-failed':
      return 'Security verification (reCAPTCHA) failed. Please refresh the page and try again.';
    case 'auth/invalid-phone-number':
      return 'Invalid mobile number format. Please enter a valid Sri Lankan mobile number (+94 7X XXX XXXX).';
    case 'auth/quota-exceeded':
      return 'Daily SMS verification quota reached (10/day on Spark). Please try again later or use zero-cost Email OTP.';
    case 'auth/too-many-requests':
      return 'Too many SMS requests sent in a short period. Please wait a few moments and try again.';
    case 'auth/invalid-verification-code':
      return 'Invalid 6-digit SMS verification code entered. Please check your SMS messages and try again.';
    case 'auth/code-expired':
      return 'The 6-digit verification code has expired. Please click "Resend" to get a new code.';
    default:
      return err?.message || 'Failed to dispatch real SMS via Firebase Phone Auth.';
  }
}

/**
 * Initialize or get invisible reCAPTCHA verifier
 */
export function getRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  let el = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
  if (!el && typeof document !== 'undefined') {
    el = document.createElement('div');
    el.id = containerId;
    el.style.display = 'none';
    document.body.appendChild(el);
  }

  const { auth } = getFirebaseAuth();
  if (!cachedRecaptchaVerifier) {
    cachedRecaptchaVerifier = new RecaptchaVerifier(auth, el || containerId, {
      size: 'invisible',
      callback: () => {
        console.log('[Firebase Phone Auth] reCAPTCHA verified successfully.');
      },
      'expired-callback': () => {
        console.warn('[Firebase Phone Auth] reCAPTCHA token expired. Resetting...');
        if (cachedRecaptchaVerifier) {
          try {
            cachedRecaptchaVerifier.clear();
          } catch (_) {}
          cachedRecaptchaVerifier = null;
        }
      }
    });
  }
  return cachedRecaptchaVerifier;
}

/**
 * Send real SMS to a Sri Lankan mobile subscriber via Google Firebase
 */
export async function dispatchRealMobileSMS(
  normalizedPhone: string, // e.g. +94771234567
  containerId: string = 'recaptcha-container'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isFirebaseConfigured()) {
      return {
        success: false,
        error: 'Firebase Phone Auth is not yet configured in environment variables.'
      };
    }

    const { auth } = getFirebaseAuth();
    const verifier = getRecaptchaVerifier(containerId);

    console.log(`[Firebase Phone Auth] Dispatching real carrier SMS to ${normalizedPhone}...`);
    const confirmation = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
    cachedConfirmationResult = confirmation;

    console.log(`[Firebase Phone Auth] ✓ Real SMS successfully dispatched to ${normalizedPhone}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Firebase Phone Auth] Dispatch failure:', err);
    if (cachedRecaptchaVerifier) {
      try {
        cachedRecaptchaVerifier.clear();
      } catch (_) {}
      cachedRecaptchaVerifier = null;
    }
    return {
      success: false,
      error: formatFirebaseError(err)
    };
  }
}

/**
 * Verify the 6-digit SMS code against Google Firebase Identity servers
 */
export async function verifyRealMobileSMS(
  otpCode: string
): Promise<{ verified: boolean; uid?: string; phoneNumber?: string; error?: string }> {
  try {
    if (!cachedConfirmationResult) {
      return {
        verified: false,
        error: 'No active Firebase SMS verification session found. Please request a new code.'
      };
    }

    const result = await cachedConfirmationResult.confirm(otpCode.trim());
    const user = result.user;

    console.log(`[Firebase Phone Auth] ✓ 6-digit code verified for UID: ${user.uid}, Phone: ${user.phoneNumber}`);
    return {
      verified: true,
      uid: user.uid,
      phoneNumber: user.phoneNumber || undefined
    };
  } catch (err: any) {
    console.error('[Firebase Phone Auth] Verification failed:', err);
    return {
      verified: false,
      error: formatFirebaseError(err)
    };
  }
}
