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
    portalName: 'Community Solutions Lanka (CSLK)',
    portalUrl: 'https://www.cslk.org',
    featuredCourses: [
      {
        id: 'LMS-CSLK-DDR',
        title: {
          en: 'Digital Democracy and Rights',
          si: 'ඩිජිටල් ප්‍රජාතන්ත්‍රවාදය සහ අයිතිවාසිකම්',
          ta: 'டிஜிட்டல் ஜனநாயகம் மற்றும் உரிமைகள்'
        },
        duration: '100% Free • 3 Hours • Self-Paced • Sinhala / தமிழ் / English • Automated E-Certificate',
        level: 'All Sri Lankan Citizens & Youth',
        badgeUrl: 'https://www.cslk.org/badges/digital-democracy-rights.png',
        enrollUrl: 'https://www.cslk.org/courses/digital-democracy-and-rights',
        modules: [
          'Module 1: Digital Democracy & Civic Literacy',
          'Module 2: Digital Safety, Online Safety Act 2024 & PDPA 2022',
          'Module 3: Practical Guide to E-Lanka'
        ],
        youthChampionsHighlight: 'The top 10 graduates will be selected as official CSLK Youth Champions.'
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

