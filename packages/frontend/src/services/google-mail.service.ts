/**
 * E-Lanka Digital Democracy Platform
 * High-Volume Zero-Cost Email Verification Engine via Google Apps Script (Gmail API)
 * Quota: 15,000 emails/month (500 free emails/day) at $0.00 forever
 */

export const GOOGLE_SCRIPT_WEBHOOK_URL =
  (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbyXIlVCSa4D3UbvgoytlFQxATAl66s_mCHB53IGiKTCKK22bMCMIOvHwkYqOSlV9ItW/exec';

export async function sendGoogleScriptOTP(
  targetEmail: string,
  otpCode: string,
  reference: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      to_email: targetEmail.trim(),
      otp_code: otpCode,
      reference: reference
    });

    // Google Apps Script accepts text/plain JSON payload without CORS preflight failures
    await fetch(GOOGLE_SCRIPT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: payload,
      mode: 'no-cors'
    });

    console.log(`[Google Mail Gateway] ✉ OTP dispatched to ${targetEmail} via Google Apps Script.`);
    return { success: true };
  } catch (err: any) {
    console.warn('[Google Mail Gateway] Dispatch attempt note:', err);
    return {
      success: false,
      error: err?.message || 'Google Mail gateway error'
    };
  }
}
