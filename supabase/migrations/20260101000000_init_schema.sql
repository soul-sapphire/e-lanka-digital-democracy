-- ============================================================================
-- E-Lanka Digital Democracy Platform - Database Migration (EL-SPEC-2026-V3)
-- Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
-- Target: Supabase PostgreSQL
-- ============================================================================

-- Enable required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
CREATE TYPE policy_stage_enum AS ENUM (
  'PENDING_REVIEW',
  'APPROVED_PANEL',
  'ACTIVE_CONSULTATION',
  'AI_ANALYSIS_SYNC',
  'CONCLUDED_ARCHIVED'
);

CREATE TYPE user_role_enum AS ENUM (
  'CITIZEN',
  'PANEL_MODERATOR',
  'POLICY_ADMIN',
  'SYSTEM_AUDITOR'
);

CREATE TYPE petition_status_enum AS ENUM (
  'DRAFT',
  'ACTIVE',
  'SUBMITTED_TO_AUTHORITY',
  'ACCEPTED',
  'CLOSED'
);

CREATE TYPE pdpa_action_enum AS ENUM (
  'CONSENT_GRANTED',
  'CONSENT_WITHDRAWN',
  'DATA_INGESTION',
  'FIELD_ENCRYPTION_ACCESS',
  'ERASURE_REQUEST',
  'ERASURE_COMPLETED',
  'DATA_EXPORT_SUBJECT',
  'ADMIN_PANEL_ACCESS',
  'AI_SCRUBBING_RUN'
);

-- ----------------------------------------------------------------------------
-- 2. User Profiles & RBAC
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role_enum NOT NULL DEFAULT 'CITIZEN',
  -- HMAC-SHA256 blind indexes prevent plaintext storage while allowing duplicate checks
  nic_blind_index VARCHAR(64) UNIQUE,
  email_blind_index VARCHAR(64) UNIQUE,
  anonymized_alias VARCHAR(64) NOT NULL,
  district VARCHAR(64),
  is_verified_citizen BOOLEAN NOT NULL DEFAULT FALSE,
  totp_secret VARCHAR(128),
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Policy Consultations (5-Stage Lifecycle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(32) NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_si TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  summary_si TEXT NOT NULL,
  summary_ta TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_si TEXT NOT NULL,
  description_ta TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  stage policy_stage_enum NOT NULL DEFAULT 'PENDING_REVIEW',
  target_ministry TEXT NOT NULL,
  author_agency TEXT NOT NULL,
  submission_count INT NOT NULL DEFAULT 0,
  is_publicly_visible BOOLEAN NOT NULL DEFAULT FALSE,
  moderator_panel_notes TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Dynamic Surveys & Localized Questions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_si TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  instructions_en TEXT NOT NULL,
  instructions_si TEXT NOT NULL,
  instructions_ta TEXT NOT NULL,
  estimated_minutes INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  question_type VARCHAR(32) NOT NULL, -- SINGLE_CHOICE, MULTIPLE_CHOICE, RATING_SCALE, OPEN_TEXT
  prompt_en TEXT NOT NULL,
  prompt_si TEXT NOT NULL,
  prompt_ta TEXT NOT NULL,
  help_text_en TEXT,
  help_text_si TEXT,
  help_text_ta TEXT,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  options_json JSONB,
  min_rating INT,
  max_rating INT,
  max_characters INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Survey Responses with AES-256-GCM Field-Level Encryption
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  -- Salted blind index allows counting user participation while preserving non-retaliation
  citizen_blind_index VARCHAR(64) NOT NULL,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  question_type VARCHAR(32) NOT NULL,
  selected_option_id VARCHAR(64),
  selected_option_ids JSONB,
  numeric_rating INT,
  -- AES-256-GCM encrypted envelope: { iv, authTag, ciphertext, keyVersion, algorithm }
  encrypted_open_text JSONB,
  is_anonymized BOOLEAN NOT NULL DEFAULT FALSE,
  is_erased BOOLEAN NOT NULL DEFAULT FALSE,
  client_language VARCHAR(8) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. E-Petitions Engine
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS petitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(32) NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_si TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  objective_en TEXT NOT NULL,
  objective_si TEXT NOT NULL,
  objective_ta TEXT NOT NULL,
  target_authority TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  required_signatures INT NOT NULL DEFAULT 5000,
  current_signatures INT NOT NULL DEFAULT 0,
  status petition_status_enum NOT NULL DEFAULT 'ACTIVE',
  background_doc_url TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS petition_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  -- Unique index guarantees one signature per citizen without revealing identity
  signer_blind_index VARCHAR(64) NOT NULL,
  -- Encrypted PII envelope: { iv, authTag, ciphertext, keyVersion, algorithm }
  encrypted_signer_pii JSONB NOT NULL,
  is_erased BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_petition_signer UNIQUE (petition_id, signer_blind_index)
);

-- ----------------------------------------------------------------------------
-- 7. PDPA No. 9 of 2022 Statutory Audit Logging (Immutable Append-Only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pdpa_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action pdpa_action_enum NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  actor_id_hash VARCHAR(64) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  purpose_description TEXT NOT NULL,
  ip_address_hash VARCHAR(64) NOT NULL,
  user_agent_hash VARCHAR(64) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  immutable_signature VARCHAR(128) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 8. AI Consultation Aggregates (Zero-PII Edge Payloads)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_consultation_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE UNIQUE,
  total_submissions INT NOT NULL DEFAULT 0,
  sentiment_json JSONB NOT NULL,
  thematic_clusters_json JSONB NOT NULL,
  question_summaries_json JSONB NOT NULL,
  sync_hash VARCHAR(64) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. Performance & Security Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_policies_stage ON policies(stage);
CREATE INDEX IF NOT EXISTS idx_policies_public ON policies(is_publicly_visible);
CREATE INDEX IF NOT EXISTS idx_responses_policy_idx ON survey_responses(policy_id);
CREATE INDEX IF NOT EXISTS idx_responses_blind_idx ON survey_responses(citizen_blind_index);
CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
CREATE INDEX IF NOT EXISTS idx_signatures_blind_idx ON petition_signatures(signer_blind_index);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON pdpa_audit_logs(timestamp DESC);

-- ----------------------------------------------------------------------------
-- 10. Row-Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdpa_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consultation_aggregates ENABLE ROW LEVEL SECURITY;

-- Policies table: Public can view approved or active policies
CREATE POLICY "Public can view active or approved policies"
  ON policies FOR SELECT
  USING (is_publicly_visible = TRUE OR stage IN ('APPROVED_PANEL', 'ACTIVE_CONSULTATION', 'AI_ANALYSIS_SYNC', 'CONCLUDED_ARCHIVED'));

-- Policies table: Only authorized moderators/admins can insert or update policies
CREATE POLICY "Moderators can review pending proposals"
  ON policies FOR ALL
  USING (auth.jwt() ->> 'role' IN ('PANEL_MODERATOR', 'POLICY_ADMIN', 'SYSTEM_AUDITOR'));

-- Surveys and questions: Public can read active surveys
CREATE POLICY "Public read active surveys"
  ON surveys FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Public read survey questions"
  ON survey_questions FOR SELECT
  USING (TRUE);

-- Petitions: Public can read active petitions
CREATE POLICY "Public read petitions"
  ON petitions FOR SELECT
  USING (TRUE);

-- Signatures: Signature count is public, but raw rows are restricted
CREATE POLICY "Allow public insert of verified signatures"
  ON petition_signatures FOR INSERT
  WITH CHECK (TRUE);

-- Survey responses: Public can insert responses, but cannot read others' encrypted data
CREATE POLICY "Allow citizen response ingestion"
  ON survey_responses FOR INSERT
  WITH CHECK (TRUE);

-- AI Aggregates: Public can read zero-PII aggregates
CREATE POLICY "Public read zero-pii aggregates"
  ON ai_consultation_aggregates FOR SELECT
  USING (TRUE);

-- PDPA Audit Log: strictly INSERT only, updates and deletes disallowed
CREATE POLICY "Allow insertion of audit logs"
  ON pdpa_audit_logs FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Auditors can inspect audit logs"
  ON pdpa_audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'SYSTEM_AUDITOR');

-- Prevent any UPDATE or DELETE on pdpa_audit_logs to guarantee statutory immutability
REVOKE UPDATE, DELETE ON pdpa_audit_logs FROM PUBLIC, authenticated, anon;

