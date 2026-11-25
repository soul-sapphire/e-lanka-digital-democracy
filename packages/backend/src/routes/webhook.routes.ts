/**
 * E-Lanka Digital Democracy Platform
 * LifterLMS Automated Graduation & Youth Champions Webhook Router
 *
 * Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
 * Specification: EL-SPEC-2026-V3 / Issue 2.2 & Issue 3.3
 * Target: External LifterLMS on WordPress (www.cslk.org)
 */

import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { DatabaseStore } from '../db/store';
import { PDPAService } from '../services/pdpa.service';
import { computeBlindHash, generateCitizenAlias } from '../crypto/blind-index';
import { getSupabaseClient } from '../db/supabase';
import { UserProfile } from '@e-lanka/shared';

export const webhookRouter = Router();

const DEFAULT_WEBHOOK_SECRET = process.env.LIFTERLMS_WEBHOOK_SECRET || 'cslk_lifterlms_webhook_secret_2026_secure';

/**
 * Verify Webhook Secret / Signature
 */
function verifyWebhookAuthenticity(req: Request): boolean {
  const incomingSecret =
    req.headers['x-lifterlms-secret'] ||
    req.headers['x-cslk-webhook-secret'] ||
    req.query.secret ||
    req.body.webhook_secret;

  if (incomingSecret === DEFAULT_WEBHOOK_SECRET) {
    return true;
  }

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token === DEFAULT_WEBHOOK_SECRET) {
      return true;
    }
  }

  // Allow localhost/development test requests without blocking
  if (process.env.NODE_ENV !== 'production' && req.headers['x-bypass-secret'] === 'local-test') {
    return true;
  }

  return false;
}

/**
 * GET /api/v1/webhooks/lifterlms/status
 * Public integration status and configuration specification for WordPress admin
 */
webhookRouter.get('/lifterlms/status', (req: Request, res: Response): void => {
  res.json({
    status: 'ACTIVE',
    service: 'LifterLMS Webhook Ingestion Engine',
    portal: 'Community Solutions Lanka (CSLK)',
    portalUrl: 'https://www.cslk.org',
    targetCourse: 'Digital Democracy and Rights (LMS-CSLK-DDR)',
    webhookEndpoint: '/api/v1/webhooks/lifterlms',
    acceptedEvents: [
      'lifterlms_course_completed',
      'course.completed',
      'user.graduated',
      'student.certified'
    ],
    rolePromotion: 'FIELD_CHAMPION (Youth Champion)',
    pdpaCompliance: 'Sri Lanka PDPA No. 9 of 2022 Statutory Standard',
    instructions: {
      step1: 'In WordPress Admin > LifterLMS > Settings > Webhooks, click "Add Webhook".',
      step2: 'Set Topic to "Course Completed", and paste Delivery URL: https://e-lanka-digital-democracy.vercel.app/api/v1/webhooks/lifterlms',
      step3: 'Set Secret Header "x-lifterlms-secret" with your configured secret key.'
    }
  });
});

/**
 * POST /api/v1/webhooks/lifterlms
 * Handles inbound graduation events from WordPress LifterLMS
 */
webhookRouter.post('/lifterlms', async (req: Request, res: Response): Promise<void> => {
  // 1. Verify webhook authenticity
  const isAuthentic = verifyWebhookAuthenticity(req);
  if (!isAuthentic && process.env.NODE_ENV === 'production') {
    res.status(401).json({
      error: 'UNAUTHORIZED_WEBHOOK',
      message: 'Invalid or missing LifterLMS webhook secret token (x-lifterlms-secret).'
    });
    return;
  }

  const payload = req.body || {};

  // Support both standard LifterLMS JSON payloads and simplified direct webhooks
  const event = payload.event || payload.action || payload.topic || 'course.completed';
  const data = payload.data || payload;

  const studentEmail = (data.user_email || data.email || data.student_email || '').trim().toLowerCase();
  const studentName = (data.user_name || data.name || data.student_name || 'Graduated Youth Champion').trim();
  const studentNIC = (data.user_nic || data.nic || data.nicNumber || '').trim().toUpperCase();
  const district = (data.district || 'Colombo').trim();
  const courseCode = (data.course_code || data.course_id || 'LMS-CSLK-DDR').toString();
  const grade = Number(data.grade || data.score || 100);

  if (!studentEmail && !studentNIC) {
    res.status(400).json({
      error: 'MISSING_IDENTIFIER',
      message: 'Webhook payload must provide either student email or National Identity Card (NIC).'
    });
    return;
  }

  try {
    const store = DatabaseStore.getInstance();

    // 2. Compute salted blind indexes
    const emailBlindIndex = studentEmail ? computeBlindHash(studentEmail, 'EMAIL') : undefined;
    const nicBlindIndex = studentNIC ? computeBlindHash(studentNIC, 'NIC') : undefined;

    // 3. Search for existing citizen profile
    let profile: UserProfile | undefined;
    if (nicBlindIndex) {
      profile = store.getProfileByNICBlindIndex(nicBlindIndex);
    }

    const collectorId = `CSLK-YC-2026-${Math.floor(100 + Math.random() * 900)}`;

    if (profile) {
      // Upgrade existing citizen to FIELD_CHAMPION
      profile.role = 'FIELD_CHAMPION';
      profile.isVerifiedCitizen = true;
      if (!profile.district && district) {
        profile.district = district;
      }
      store.saveProfile(profile);
    } else {
      // Create new verified Youth Champion profile
      const alias = generateCitizenAlias(district, nicBlindIndex || emailBlindIndex || 'YOUTH');
      profile = {
        id: crypto.randomUUID(),
        role: 'FIELD_CHAMPION',
        nicBlindIndex,
        emailBlindIndex,
        anonymizedAlias: alias,
        district,
        isVerifiedCitizen: true,
        totpEnabled: false,
        createdAt: new Date().toISOString()
      };
      store.saveProfile(profile);
    }

    // 4. Synchronize role promotion to live Supabase PostgreSQL
    const client = getSupabaseClient();
    if (client) {
      Promise.resolve(
        client
          .from('profiles')
          .upsert({
            id: profile.id,
            role: 'FIELD_CHAMPION',
            nic_blind_index: profile.nicBlindIndex,
            email_blind_index: profile.emailBlindIndex,
            anonymized_alias: profile.anonymizedAlias,
            district: profile.district,
            is_verified_citizen: true,
            updated_at: new Date().toISOString()
          })
      )
        .then((resp: any) => {
          if (resp?.error) console.error('[Supabase Webhook Sync Error]', resp.error.message);
        })
        .catch((err: any) => console.error('[Supabase Webhook Sync Exception]', err));
    }

    // 5. Statutory PDPA Audit Log (Section 21 & Section 12)
    PDPAService.logAudit({
      action: 'DATA_INGESTION',
      actorRole: 'SYSTEM_AUDITOR',
      actorId: 'LIFTERLMS_GATEWAY',
      resourceType: 'USER_PROFILE',
      resourceId: profile.id,
      purposeDescription: `LifterLMS automated graduation webhook processed: Student promoted to FIELD_CHAMPION for rural offline data collection under statutory oversight. Course: ${courseCode}, Score: ${grade}%.`
    });

    res.status(200).json({
      success: true,
      event,
      message: `Student successfully graduated from "${courseCode}" and promoted to FIELD_CHAMPION (Youth Champion).`,
      promotion: {
        profileId: profile.id,
        role: 'FIELD_CHAMPION',
        collectorId,
        anonymizedAlias: profile.anonymizedAlias,
        district: profile.district,
        isVerifiedCitizen: true,
        offlineCollectorUrl: '/collector',
        certifiedCourse: 'Digital Democracy and Rights',
        graduatedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error('[LifterLMS Webhook Exception]', err);
    res.status(500).json({
      error: 'WEBHOOK_PROCESSING_FAILED',
      message: err.message || 'Failed to process LifterLMS webhook.'
    });
  }
});
