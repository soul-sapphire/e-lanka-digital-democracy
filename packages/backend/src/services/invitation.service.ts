/**
 * E-Lanka Digital Democracy Platform
 * Multi-Channel Invitation Dispatcher (Workstream 5)
 *
 * Generates shareable WhatsApp deep links (wa.me intents) embedded with
 * PII-free cryptographic tokens and transactional email notices.
 */

import crypto from 'node:crypto';

const INVITATION_HMAC_SECRET = process.env.INVITATION_SECRET || 'e-lanka-invite-dispatch-token-secret-2026';

export interface DispatchTokenPayload {
  policyId: string;
  channel: 'whatsapp' | 'email' | 'web';
  nonce: string;
  expiresAt: string;
}

export class InvitationService {
  /**
   * Generate a tamper-proof, PII-free cryptographic token for invitation tracking
   */
  public static generateInvitationToken(policyId: string, channel: 'whatsapp' | 'email' | 'web'): string {
    const nonce = crypto.randomBytes(8).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    const payload = `${policyId}:${channel}:${nonce}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', INVITATION_HMAC_SECRET).update(payload).digest('hex').substring(0, 16);

    const raw = JSON.stringify({ p: policyId, c: channel, n: nonce, e: expiresAt, s: signature });
    return Buffer.from(raw).toString('base64url');
  }

  /**
   * Verify token authenticity without storing or decrypting citizen PII
   */
  public static verifyInvitationToken(token: string): { valid: boolean; policyId?: string; channel?: string } {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const data = JSON.parse(decoded);
      const expectedPayload = `${data.p}:${data.c}:${data.n}:${data.e}`;
      const expectedSig = crypto.createHmac('sha256', INVITATION_HMAC_SECRET).update(expectedPayload).digest('hex').substring(0, 16);

      if (data.s !== expectedSig) return { valid: false };
      if (new Date(data.e) < new Date()) return { valid: false };

      return { valid: true, policyId: data.p, channel: data.c };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Build client-side WhatsApp deep link (wa.me intent)
   */
  public static buildWhatsAppShareUrl(params: {
    policyTitle: string;
    policyCode: string;
    policyId: string;
    baseUrl?: string;
    language?: 'en' | 'si' | 'ta';
  }): string {
    const host = params.baseUrl || 'https://democracy.elanka.gov.lk';
    const token = this.generateInvitationToken(params.policyId, 'whatsapp');
    const link = `${host}/policies/${params.policyId}?ref=wa&t=${token}`;

    let message = '';
    if (params.language === 'si') {
      message = `ශ්‍රී ලංකා ඩිජිටල් ප්‍රජාතන්ත්‍රවාදී වේදිකාව:\n"${params.policyTitle}" (${params.policyCode}) පිළිබඳ ඔබගේ අදහස ප්‍රකාශ කරන්න.\nඔබගේ දත්ත AES-256 මඟින් සුරක්ෂිත කර ඇත.\nසහභාගී වන්න: ${link}`;
    } else if (params.language === 'ta') {
      message = `இலங்கை டிஜிட்டல் ஜனநாயக தளம்:\n"${params.policyTitle}" (${params.policyCode}) குறித்த உங்கள் கருத்தைப் பகிருங்கள்.\nபங்கேற்க: ${link}`;
    } else {
      message = `E-Lanka Digital Democracy Platform:\nShare your voice on "${params.policyTitle}" (${params.policyCode}).\nProtected under Sri Lanka PDPA No. 9 of 2022.\nParticipate: ${link}`;
    }

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
}

