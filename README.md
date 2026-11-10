# E-Lanka Digital Democracy Platform (EL-SPEC-2026-V3)

> **Compliance Standard:** Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022  
> **Core Architectural Paradigm:** Decoupled High-Resilience Infrastructure — Ultra-Low Bandwidth React Progressive Web App (PWA) + Cryptographic Node.js Engine + Supabase PostgreSQL DB.  
> **Critical Architectural Mandate:** **Zero-WordPress, Zero-PHP**. The entire public and authenticated ecosystem is built purely using modern React, TypeScript, Tailwind CSS, and shadcn/ui.

---

## 1. System Architecture & Security Framework

The platform implements a three-tier decoupled architecture guaranteeing complete isolation between public content display, private citizen ingestion, and statutory audit logging.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC DISCOVERY & CITIZEN PWA                  │
│   (Vite + React 18 + Tailwind CSS + i18next Trilingual + Recharts)      │
│   - Ultra-low bandwidth PWA Service Worker (Cache-First / Stale-While) │
│   - Offline survey response queue (Local IndexedDB/localStorage)       │
│   - LMS Context Integration with Centre for Society & Learning         │
│     (www.cslk.org)                                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ TLS 1.3 / REST JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 NODE.JS SECURE INGESTION ENGINE (PORT 4000)            │
│   - Application-Layer Field-Level Encryption (AES-256-GCM)             │
│   - Salted HMAC-SHA256 Blind Indexing (O(1) duplicate NIC detection)   │
│   - RFC 6238 Time-Based One-Time Password (TOTP) 2FA Engine           │
│   - Sri Lanka PDPA Section 14 Automated Right-to-Erasure Pipeline      │
│   - Multi-Channel Dispatcher (WhatsApp wa.me deep links + tokens)      │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼                                          ▼
┌───────────────────────────────┐     ┌───────────────────────────────────┐
│     SUPABASE POSTGRESQL DB    │     │   AI OPINION MAPPING WORKER       │
│  - Row-Level Security (RLS)   │     │   - Gemini / Groq LLM API client  │
│  - Blind-indexed NIC & Signers│     │   - Sri Lankan NIC/Phone/Email    │
│  - Immutable Chained PDPA     │     │     regex redaction & scrubbing   │
│    Audit Ledger (Section 23)  │     │   - Thematic clustering           │
└───────────────────────────────┘     │   - Zero-PII public JSON compiler │
                                      └───────────────────────────────────┘
```

---

## 2. 5-Stage Policy Consultation Lifecycle

```
[ Stage 1: Proposal Submission & Moderation Queue ]
                      │
                      ▼
[ Stage 2: Approved by Panel Gate (APPROVED_PANEL) ]  <-- Mandatory Moderation Gate + TOTP 2FA
                      │
                      ▼
[ Stage 3: Dynamic Questionnaire Live & WhatsApp Dispatch ]
                      │
                      ▼
[ Stage 4: AI Opinion Mapping & PII Scrubbing Sync ]
                      │
                      ▼
[ Stage 5: Concluded & Public Zero-PII Aggregates Published ]
```

1. **Stage 1 — Proposal Submission & Panel Moderation Gate:** Incoming policy draft submissions enter a restricted queue. Administrative and expert panels must authenticate with **RFC 6238 TOTP 2FA** and explicitly transition status to `APPROVED_PANEL`. Questionnaire formulation cannot proceed without this gate.
2. **Stage 2 — Dynamic Questionnaire Formulation:** Approved initiatives permit administrators to build customized surveys including structured single-select, multi-select, 1-5 rating scales, and qualitative feedback modules.
3. **Stage 3 — Multi-Channel Invitation & Dispatch:** Automated triggers publish the consultation. Invitations are dispatched with PII-free cryptographic tokens via transactional email and shareable WhatsApp deep links (`https://wa.me/?text=...`).
4. **Stage 4 — AI Opinion Mapping & Scrubbing Engine:** Incoming responses are ingested, encrypted via AES-256-GCM, and processed by background AI workers. Sri Lankan NICs (`9+V` or `12 digits`), mobile numbers, and emails are scrubbed. Thematic clusters and qualitative sentiment distributions are extracted.
5. **Stage 5 — Public Anonymized Sync & Display:** Quantitative metrics (response splits, thematic clusters, signature counters) compile into zero-PII public JSON payloads served via edge endpoints.

---

## 3. Cryptographic Implementations

### Field-Level Encryption (AES-256-GCM)
* Located in: `packages/backend/src/crypto/fle.ts`
* Cryptographic Key: 256-bit derived from master secret via SHA-256.
* Initialization Vector (IV): Cryptographically secure random 12-byte (96-bit) buffer generated per field.
* Authentication Tag: 128-bit GCM tag ensuring payload integrity against ciphertext tampering.
* Encrypted Envelope:
  ```json
  {
    "iv": "6fc3c9d8dafd8a5b71ea602a",
    "authTag": "0c50b1fe639c64175ce0101d0dbdb0ed",
    "ciphertext": "aebf5f91e935b47312714350dc7717e3192392...",
    "keyVersion": "v1",
    "algorithm": "aes-256-gcm"
  }
  ```

### HMAC-SHA256 Blind Indexing
* Located in: `packages/backend/src/crypto/blind-index.ts`
* Normalizes Sri Lankan National Identity Card formats:
  - Old format: 9 digits + 'V' or 'X' (e.g. `851234567V`)
  - New format: 12 digits (e.g. `198512345678`)
* Applies secret pepper `BLIND_INDEX_PEPPER` to generate a deterministic 64-character hex hash.
* Enables strict `O(1)` duplicate submission prevention on e-petitions and consultations without storing or decrypting citizen credentials in database indexes.

### RFC 6238 TOTP 2FA Engine
* Located in: `packages/backend/src/crypto/totp.ts`
* Native Node.js crypto implementation complying with RFC 6238 and RFC 4648 Base32.
* Generates 20-byte Base32 secrets, standard `otpauth://totp/...` URIs compatible with Google Authenticator, FreeOTP, and Aegis.
* Enforces time-drift window of ±1 step (90 seconds tolerance) for administrative access.

### Sri Lanka PDPA No. 9 of 2022 Right to Erasure
* Located in: `packages/backend/src/services/pdpa.service.ts` and `packages/backend/src/db/store.ts`
* Exercising `/api/v1/citizen/erasure` wipes encrypted open-text feedback and signer credentials, decouples citizen blind indexes (`ERASED_PDPA_SEC_14`), and nullifies foreign keys.
* **Preserves immutable quantitative aggregate counts** to prevent statistical census corruption while upholding non-retaliation.

---

## 4. Monorepo Structure

```
E-Lanka/
├── package.json                    # Monorepo root workspace configuration
├── .env.example                    # Template environment variables
├── supabase/
│   ├── migrations/
│   │   └── 20260101000000_init_schema.sql  # Full Supabase PostgreSQL schema & RLS policies
│   └── seed.sql                    # Initial seed data (5-stage policies, petitions, profiles)
├── packages/
│   ├── shared/                     # Shared TypeScript types & DTO interfaces
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/crypto.ts
│   │       ├── types/policy.ts
│   │       ├── types/survey.ts
│   │       ├── types/petition.ts
│   │       ├── types/user.ts
│   │       ├── types/ai.ts
│   │       ├── types/pdpa.ts
│   │       └── index.ts
│   ├── backend/                    # Node.js Secure Ingestion Engine & Security API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── crypto/
│   │       │   ├── fle.ts          # AES-256-GCM Field-Level Encryption
│   │       │   ├── blind-index.ts  # HMAC-SHA256 Blind Indexing
│   │       │   └── totp.ts         # RFC 6238 TOTP 2FA Engine
│   │       ├── db/
│   │       │   └── store.ts        # Database store & transactional state adapter
│   │       ├── middleware/
│   │       │   └── auth.middleware.ts # JWT + RBAC + TOTP 2FA validation
│   │       ├── routes/
│   │       │   ├── auth.routes.ts
│   │       │   ├── policy.routes.ts
│   │       │   ├── survey.routes.ts
│   │       │   ├── petition.routes.ts
│   │       │   ├── citizen.routes.ts
│   │       │   ├── admin.routes.ts
│   │       │   └── public.routes.ts
│   │       ├── services/
│   │       │   ├── pdpa.service.ts       # PDPA No. 9 of 2022 Statutory Engine
│   │       │   ├── ai-worker.service.ts  # AI Opinion Mapping & PII Scrubber
│   │       │   └── invitation.service.ts # WhatsApp deep links & tokens
│   │       └── server.ts           # Express bootstrap
│   └── frontend/                   # Ultra-Low Bandwidth React PWA
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── public/
│       │   ├── manifest.json       # PWA manifest
│       │   ├── sw.js               # Low-bandwidth Service Worker
│       │   └── favicon.svg
│       └── src/
│           ├── i18n/               # Trilingual i18next setup
│           │   ├── locales/en.json # English dictionary
│           │   ├── locales/si.json # Sinhala (සිංහල) dictionary
│           │   └── locales/ta.json # Tamil (தமிழ்) dictionary
│           ├── components/
│           │   ├── Navbar.tsx      # Trilingual pill switcher, role modal, PWA connectivity
│           │   ├── Footer.tsx      # PDPA declarations, CSLK linkage
│           │   ├── LifecycleBadge.tsx # 5-Stage badges
│           │   ├── LMSCard.tsx     # Context cards pointing to www.cslk.org
│           │   ├── LiveCounterWidget.tsx # Real-time cached verified signature counter
│           │   └── PetitionSignModal.tsx # NIC validation & blind index signing
│           ├── views/
│           │   ├── PublicPolicyHub.tsx     # Discovery feed & search
│           │   ├── PolicyDetailView.tsx    # Recharts analytics & policy briefs
│           │   ├── DynamicSurveyRunner.tsx # Offline-resilient survey form runner
│           │   ├── EPetitionsView.tsx      # E-petitions with live counters
│           │   ├── CitizenDashboard.tsx    # Privacy tracker & Right to Erasure
│           │   ├── AdminModerationPanel.tsx# 5-Stage Moderation Gate & Audit Ledger
│           │   └── LMSAcademyView.tsx      # Centre for Society & Learning integration
│           ├── services/
│           │   ├── api.ts                  # API client with cache fallbacks
│           │   └── offline-queue.ts        # Offline submission queue manager
│           ├── App.tsx
│           ├── main.tsx
│           └── index.css
```

---

## 5. Local Execution Instructions

### Prerequisites
* Node.js v20+ or v24+
* npm v10+

### Step 1: Install Dependencies & Build Packages
From the repository root:
```bash
npm install
npm run build
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `packages/backend/.env`:
```bash
cp .env.example packages/backend/.env
```

### Step 3: Start Development Servers
Run the backend API service (Port 4000):
```bash
npm run dev:backend
```
In a separate terminal, launch the Vite React PWA frontend (Port 5173):
```bash
npm run dev:frontend
```
Open **`http://localhost:5173`** in your browser.

---

## 6. Testing Key Civic Workflows

1. **Trilingual Switching:** Click the `EN` | `සිංහල` | `தமிழ்` pills in the top navigation bar. Notice the immediate, zero-latency UI re-render across policy briefs, stage badges, and survey prompts.
2. **Stage 1 Moderation Gate:**
   - Click the Role Switcher pill in the navbar and select **`PANEL_MODERATOR`**.
   - Navigate to **Moderation Gate** (`/admin`).
   - Inspect proposal `EL-POL-2026-004` in the Stage 1 Queue.
   - Click **Review & Set Panel Status**, enter TOTP code `123456`, and click **Approve (APPROVED_PANEL)**. The policy transitions to Stage 2.
3. **Dynamic Survey Runner with Offline Caching:**
   - Navigate to Policy `EL-POL-2026-001` and click **Participate in Consultation**.
   - Open browser DevTools, switch to the **Network** tab, and toggle to **Offline**.
   - Complete the questionnaire and click **Submit Encrypted Feedback**.
   - Notice that the PWA catches the submission, stores it in the local queue, and notifies the user. Toggle back to **Online** to see the submission automatically synchronize.
4. **Verified E-Petition Signing & Duplicate Prevention:**
   - Navigate to **E-Petitions** (`/petitions`).
   - Click **Sign This Petition** on `PET-2026-012`.
   - Enter NIC `851234567V`, your name, select your district, check the PDPA consent box, and confirm. The live counter animates up.
   - Attempt to sign again with the same NIC. The system intercepts the HMAC-SHA256 blind index and prevents duplicate signing.
5. **Exercising Statutory Right to Erasure:**
   - Navigate to **Citizen Tracker** (`/dashboard`).
   - View your anonymized participation history.
   - Click **Exercise Right to Erasure** and confirm.
   - The engine scrubs all encrypted PII, decouples records, logs an immutable block in the PDPA ledger, and preserves immutable national census counts.

---

## 7. Cloud Deployment Guide

### Frontend Deployment: Cloudflare Pages CDN
The React frontend compiles to pure static HTML/JS/CSS assets ready for Cloudflare Pages edge delivery.
1. Connect your repository to **Cloudflare Pages**.
2. Build Settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build --workspace=@e-lanka/frontend`
   - **Build output directory:** `packages/frontend/dist`
   - **Root directory:** `/`
3. Environment variables: Set `VITE_API_URL` to your production backend URL.

### Backend Engine Deployment: Supabase & Node.js
1. **Supabase Database:**
   - In your Supabase dashboard, navigate to the **SQL Editor**.
   - Execute `supabase/migrations/20260101000000_init_schema.sql` to apply tables, indexes, triggers, and Row-Level Security policies.
   - Run `supabase/seed.sql` to populate default policies, petitions, and administrative roles.
2. **Node.js API (Render / Railway / Google Cloud Run / AWS ECS):**
   - Deploy `packages/backend` using Docker or standard Node runtime (`npm run build && npm start`).
   - Set environment variables:
     * `FLE_MASTER_KEY`: 32-byte production secret.
     * `BLIND_INDEX_PEPPER`: Production HMAC pepper.
     * `PDPA_AUDIT_SECRET`: Chained audit ledger secret.
     * `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
     * `GEMINI_API_KEY` or `GROQ_API_KEY` for background worker LLM analysis.

