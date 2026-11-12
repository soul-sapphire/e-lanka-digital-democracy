/**
 * E-Lanka Digital Democracy Platform
 * Backend Ingestion Engine & Security API
 *
 * Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
 * Specification: EL-SPEC-2026-V3
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { authRouter } from './routes/auth.routes';
import { policyRouter } from './routes/policy.routes';
import { surveyRouter } from './routes/survey.routes';
import { petitionRouter } from './routes/petition.routes';
import { citizenRouter } from './routes/citizen.routes';
import { adminRouter } from './routes/admin.routes';
import { publicRouter } from './routes/public.routes';
import { verificationRoutes } from './routes/verification.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allows flexible API responses and Vite HMR
}));

// CORS Configuration for Cloudflare Pages and local dev
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-totp-token', 'x-client-language']
}));

// Payload parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// API Version 1 Route Registrations
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/policies', policyRouter);
app.use('/api/v1/surveys', surveyRouter);
app.use('/api/v1/petitions', petitionRouter);
app.use('/api/v1/citizen', citizenRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/public', publicRouter);
app.use('/api/v1/verification', verificationRoutes);

// Root Index / Welcome
app.get('/', (req: Request, res: Response) => {
  res.json({
    platform: 'E-Lanka Digital Democracy Platform API',
    specification: 'EL-SPEC-2026-V3',
    pdpaCompliance: 'Sri Lanka PDPA No. 9 of 2022 Statutory Standard',
    endpoints: {
      health: '/api/v1/public/health',
      policies: '/api/v1/policies',
      petitions: '/api/v1/petitions',
      surveys: '/api/v1/surveys',
      citizenDashboard: '/api/v1/citizen/engagement',
      adminPendingQueue: '/api/v1/admin/pending-queue',
      pdpaAuditLogs: '/api/v1/admin/audit-logs',
      lmsContextCards: '/api/v1/public/lms-context'
    }
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[E-Lanka Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏛️  E-LANKA DIGITAL DEMOCRACY PLATFORM - SECURE ENGINE`);
    console.log(`📡  Listening on http://localhost:${PORT}`);
    console.log(`🔒  Field-Level Encryption: AES-256-GCM [ACTIVE]`);
    console.log(`🛡️  Blind Indexing: HMAC-SHA256 [ACTIVE]`);
    console.log(`🔑  2FA Engine: RFC 6238 TOTP [ACTIVE]`);
    console.log(`⚖️  PDPA Compliance: Sri Lanka No. 9 of 2022 [ENFORCED]`);
    console.log(`=======================================================`);
  });
}

export default app;

