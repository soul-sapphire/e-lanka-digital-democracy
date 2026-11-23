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
      // Identity & Routing
      from_name: 'E-Lanka Digital Democracy',
      sender_name: 'E-Lanka Democratic Platform',
      reply_to: 'support@elanka.gov.lk',
      to_email: targetEmail.trim(),
      email: targetEmail.trim(),
      recipient: targetEmail.trim(),
      to_name: 'Citizen',
      name: 'Citizen',
      subject: `[E-Lanka] Citizen Verification Code: ${otpCode}`,

      // Pure E-Lanka OTP Variables
      otp_code: otpCode,
      verification_code: otpCode,
      code: otpCode,
      reference: reference,
      summary_date: new Date().toLocaleDateString('en-GB'),
      message: `Welcome to E-Lanka Digital Democracy.\n\nYour 6-digit citizen verification code is: ${otpCode}\n\nThis one-time passcode is valid for 2 minutes. Reference: ${reference}.\n\nFor your security, do not share this verification code with anyone.`,
      recommendations: `Verification Code: ${otpCode} (Valid for 2 minutes) | Reference: ${reference}`,

      // Neutralize any legacy or pediatric fields if using a shared template
      child_name: 'E-Lanka Citizen Verification',
      child_age: '',
      child_gender: '',
      headache_score: '',
      fressh_score: '',
      severity: 'Verified',
      passport_link: '',
      continue_link: '',
      app_url: 'https://elanka.gov.lk'
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
