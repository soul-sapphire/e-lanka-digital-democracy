/**
 * E-Lanka Digital Democracy Platform
 * Public Discovery & Edge Sync Routes
 *
 * Serves zero-PII aggregated JSON payloads for edge CDN caching
 * and external LMS routing context cards pointing to www.cslk.org.
 */

import { Router, Request, Response } from 'express';
import { DatabaseStore } from '../db/store';

export const publicRouter = Router();

/**
 * Public Zero-PII Aggregates for Edge Delivery
 */
publicRouter.get('/aggregates/:policyId', (req: Request, res: Response): void => {
  const store = DatabaseStore.getInstance();
  const aggregate = store.getPublicAggregate(req.params.policyId);

  if (!aggregate) {
    res.status(404).json({ error: 'Public aggregate not yet generated for this consultation' });
    return;
  }

  // Set HTTP caching headers for CDN edge performance
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  res.json({ data: aggregate });
});

/**
 * LMS Context Cards linking to www.cslk.org
 */
publicRouter.get('/lms-context', (req: Request, res: Response): void => {
  res.json({
    portalName: 'Centre for Society & Learning Sri Lanka (CSLK)',
    portalUrl: 'https://www.cslk.org',
    featuredCourses: [
      {
        id: 'LMS-101',
        title: {
          en: 'Democracy in the Digital Age: Understanding Citizen Participation',
          si: 'ඩිජිටල් යුගයේ ප්‍රජාතන්ත්‍රවාදය: පුරවැසි සහභාගීත්වය අවබෝධ කර ගැනීම',
          ta: 'டிஜிட்டல் யுகத்தில் ஜனநாயகம்: குடிமக்கள் பங்களிப்பைப் புரிந்துகொள்ளுதல்'
        },
        duration: '2 Hours (Self-paced)',
        level: 'Introductory',
        badgeUrl: 'https://www.cslk.org/badges/digital-citizen.png',
        enrollUrl: 'https://www.cslk.org/courses/digital-democracy-101'
      },
      {
        id: 'LMS-202',
        title: {
          en: 'Sri Lanka PDPA No. 9 of 2022: Your Statutory Privacy Rights',
          si: 'ශ්‍රී ලංකා PDPA 2022 අංක 9: ඔබගේ ව්‍යවස්ථාපිත රහස්‍යතා අයිතිවාසිකම්',
          ta: 'இலங்கை PDPA 2022 எண் 9: உங்கள் சட்டரீதியான தனியுரிமை உரிமைகள்'
        },
        duration: '1.5 Hours',
        level: 'Intermediate',
        badgeUrl: 'https://www.cslk.org/badges/privacy-champion.png',
        enrollUrl: 'https://www.cslk.org/courses/pdpa-privacy-rights'
      }
    ]
  });
});

/**
 * System Health & Security Metrics
 */
publicRouter.get('/health', (req: Request, res: Response): void => {
  res.json({
    status: 'ONLINE',
    platform: 'E-Lanka Digital Democracy Platform',
    version: '2026.3.0-V3',
    pdpaCompliance: 'Sri Lanka PDPA No. 9 of 2022 (Compliant)',
    encryptionStandard: 'AES-256-GCM Application Layer (FLE)',
    blindIndexing: 'HMAC-SHA256 (Salted)',
    totpStandard: 'RFC 6238 Compliant (Google Authenticator / FreeOTP)',
    timestamp: new Date().toISOString()
  });
});

