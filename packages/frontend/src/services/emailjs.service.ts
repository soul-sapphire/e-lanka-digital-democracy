/**
 * E-Lanka Digital Democracy Platform
 * Client-Side Email Delivery Engine via EmailJS (@emailjs/browser)
 * 100% Zero-Cost Free Tier (Direct browser-to-inbox dispatch)
 */

import emailjs from '@emailjs/browser';

const SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || 'service_c64k29r';
const TEMPLATE_ID = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || 'template_ww3jkms';
const PUBLIC_KEY = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || 'UE6qxu34BK-2rhxkV';

export async function sendEmailJSOTP(
  targetEmail: string,
  otpCode: string,
  reference: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const templateParams = {
      to_email: targetEmail.trim(),
      email: targetEmail.trim(),
      recipient: targetEmail.trim(),
      to_name: 'Citizen',
      name: 'Citizen',
      child_name: 'E-Lanka Citizen Verification',
      otp_code: otpCode,
      verification_code: otpCode,
      code: otpCode,
      reference: reference,
      summary_date: new Date().toLocaleDateString('en-GB'),
      message: `Your E-Lanka Digital Democracy verification code is: ${otpCode}. Valid for 2 minutes. Reference: ${reference}. Do not share this code.`,
      recommendations: `Verification Code: ${otpCode} (Valid for 2 minutes). Reference: ${reference}`
    };

    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log(`[EmailJS] Successfully dispatched live verification email to ${targetEmail}. Status: ${res.status}`);
    return { success: res.status === 200 };
  } catch (err: any) {
    console.error('[EmailJS] Dispatch error:', err);
    return {
      success: false,
      error: err?.text || err?.message || 'Email delivery failed through EmailJS.'
    };
  }
}
