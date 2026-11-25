-- ============================================================================
-- E-Lanka Digital Democracy Platform - Complete Production Database Schema
-- Compliance Standard: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
-- Target: Supabase PostgreSQL (Singapore Region - ap-southeast-1)
-- ============================================================================

-- Enable required cryptographic and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Custom Enumerations
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM (
    'CITIZEN',
    'FIELD_CHAMPION',
    'PANEL_MODERATOR',
    'POLICY_ADMIN',
    'SYSTEM_AUDITOR'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE policy_stage_enum AS ENUM (
    'PENDING_REVIEW',
    'APPROVED_PANEL',
    'ACTIVE_CONSULTATION',
    'AI_ANALYSIS_SYNC',
    'CONCLUDED_ARCHIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE petition_status_enum AS ENUM (
    'DRAFT',
    'ACTIVE',
    'SUBMITTED_TO_AUTHORITY',
    'ACCEPTED',
    'CLOSED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pdpa_action_enum AS ENUM (
    'CONSENT_GRANTED',
    'CONSENT_WITHDRAWN',
    'DATA_INGESTION',
    'FIELD_ENCRYPTION_ACCESS',
    'ERASURE_REQUEST',
    'ERASURE_COMPLETED',
    'DATA_EXPORT_SUBJECT',
    'ADMIN_PANEL_ACCESS',
    'AI_SCRUBBING_RUN',
    'FAILED_2FA_ATTEMPT',
    'DATA_ERASURE_EXECUTED',
    'AI_PII_SCRUBBING_TRIGGERED',
    'EPETITION_SIGNED',
    'POLICY_PUBLISHED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. User Profiles & RBAC
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role_enum NOT NULL DEFAULT 'CITIZEN',
  -- Salted HMAC-SHA256 blind indexes prevent plaintext storage while guaranteeing uniqueness
  nic_blind_index VARCHAR(64) UNIQUE,
  email_blind_index VARCHAR(64) UNIQUE,
  phone_blind_index VARCHAR(64) UNIQUE,
  anonymized_alias VARCHAR(64) NOT NULL,
  district VARCHAR(64) DEFAULT 'Colombo',
  is_verified_citizen BOOLEAN NOT NULL DEFAULT FALSE,
  calculated_dob DATE,
  gender VARCHAR(16),
  password_hash TEXT,
  totp_secret VARCHAR(128),
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. WebAuthn Biometric Passkeys (Fingerprint / Touch ID / Face ID)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS biometric_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nic_blind_index VARCHAR(64) NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name VARCHAR(128) DEFAULT 'Fingerprint / Face ID',
  transports JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 4. Policy Consultations (5-Stage Sovereign Lifecycle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(32) NOT NULL UNIQUE,
  -- Two-tier titles: Engaging action headline + formal statutory Gazette title
  headline_en TEXT,
  headline_si TEXT,
  headline_ta TEXT,
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
-- 5. Dynamic Trilingual Surveys & Questions
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
-- 6. Survey Responses with AES-256-GCM Field-Level Encryption (FLE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
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
-- 7. E-Petitions Engine (Two-Tier Titles & Live Real-Time Counters)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS petitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(32) NOT NULL UNIQUE,
  headline_en TEXT,
  headline_si TEXT,
  headline_ta TEXT,
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

-- ----------------------------------------------------------------------------
-- 8. Petition Signatures (Pure Blind Indexing • Zero Foreign Key to Profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS petition_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  -- Unique constraint guarantees one citizen, one signature mathematically
  signer_blind_index VARCHAR(64) NOT NULL,
  district VARCHAR(64) DEFAULT 'Colombo',
  is_erased BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_petition_signer UNIQUE (petition_id, signer_blind_index)
);

COMMENT ON TABLE petition_signatures IS 
  'Workstream 6 Anonymity & Secret-Ballot Verified Signatures. Stores only blind-index deduplication hash, district, and timestamp. Zero citizen names, emails, or user IDs are stored, guaranteeing mathematical administrator non-linkability.';

-- ----------------------------------------------------------------------------
-- 9. PDPA No. 9 of 2022 Statutory Audit Logging (Immutable Append-Only Ledger)
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

COMMENT ON TABLE pdpa_audit_logs IS 
  'Sri Lanka PDPA No. 9 of 2022 Statutory Compliance Records & Audit Ledger (Sections 12 & 21). Implements immutable HMAC-SHA256 chained signatures.';

-- ----------------------------------------------------------------------------
-- 10. AI Consultation Aggregates (Zero-PII Public Edge Caches)
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
-- 11. Offline Field Enumerator Batches (Youth Champions Collection)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS field_sync_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id VARCHAR(64) NOT NULL,
  district VARCHAR(64) NOT NULL,
  records_count INT NOT NULL DEFAULT 0,
  batch_hash VARCHAR(64) NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. Security & Performance Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_policies_stage ON policies(stage);
CREATE INDEX IF NOT EXISTS idx_policies_public ON policies(is_publicly_visible);
CREATE INDEX IF NOT EXISTS idx_responses_policy_idx ON survey_responses(policy_id);
CREATE INDEX IF NOT EXISTS idx_responses_blind_idx ON survey_responses(citizen_blind_index);
CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
CREATE INDEX IF NOT EXISTS idx_signatures_blind_idx ON petition_signatures(signer_blind_index);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON pdpa_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_biometrics_nic ON biometric_credentials(nic_blind_index);

-- ----------------------------------------------------------------------------
-- 13. Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdpa_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consultation_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_sync_batches ENABLE ROW LEVEL SECURITY;

-- Policies: Unapproved draft proposals (Stage 1 PENDING_REVIEW) are strictly invisible to citizens
DROP POLICY IF EXISTS "Public can view active or approved policies" ON policies;
CREATE POLICY "Public can view active or approved policies"
  ON policies FOR SELECT
  USING (
    (is_publicly_visible = TRUE AND stage IN ('APPROVED_PANEL', 'ACTIVE_CONSULTATION', 'AI_ANALYSIS_SYNC', 'CONCLUDED_ARCHIVED'))
    OR
    (auth.jwt() ->> 'role' IN ('PANEL_MODERATOR', 'POLICY_ADMIN', 'SYSTEM_AUDITOR'))
  );

DROP POLICY IF EXISTS "Moderators can review pending proposals" ON policies;
CREATE POLICY "Moderators can review pending proposals"
  ON policies FOR ALL
  USING (auth.jwt() ->> 'role' IN ('PANEL_MODERATOR', 'POLICY_ADMIN', 'SYSTEM_AUDITOR'));

-- Surveys & Questions: Public read active
DROP POLICY IF EXISTS "Public read active surveys" ON surveys;
CREATE POLICY "Public read active surveys"
  ON surveys FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read survey questions" ON survey_questions;
CREATE POLICY "Public read survey questions"
  ON survey_questions FOR SELECT
  USING (TRUE);

-- Petitions: Public read
DROP POLICY IF EXISTS "Public read petitions" ON petitions;
CREATE POLICY "Public read petitions"
  ON petitions FOR SELECT
  USING (TRUE);

-- Petitions: Allow staff and public to insert petitions
DROP POLICY IF EXISTS "Allow staff and public to insert petitions" ON petitions;
CREATE POLICY "Allow staff and public to insert petitions"
  ON petitions FOR INSERT
  WITH CHECK (TRUE);

-- Petitions: Allow update of petitions (e.g. signature counter increment)
DROP POLICY IF EXISTS "Allow update of petitions" ON petitions;
CREATE POLICY "Allow update of petitions"
  ON petitions FOR UPDATE
  USING (TRUE);

-- Signatures: Allow insertion, deny administrative SELECT of raw individual signatures
DROP POLICY IF EXISTS "Allow public insert of verified signatures" ON petition_signatures;
CREATE POLICY "Allow public insert of verified signatures"
  ON petition_signatures FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Deny administrative select of raw signatures" ON petition_signatures;
CREATE POLICY "Deny administrative select of raw signatures"
  ON petition_signatures FOR SELECT
  USING (FALSE);

-- Survey responses: Public insert only
DROP POLICY IF EXISTS "Allow citizen response ingestion" ON survey_responses;
CREATE POLICY "Allow citizen response ingestion"
  ON survey_responses FOR INSERT
  WITH CHECK (TRUE);

-- AI Aggregates: Public read
DROP POLICY IF EXISTS "Public read zero-pii aggregates" ON ai_consultation_aggregates;
CREATE POLICY "Public read zero-pii aggregates"
  ON ai_consultation_aggregates FOR SELECT
  USING (TRUE);

-- Audit Ledger: Strictly INSERT-only. Select restricted to SYSTEM_AUDITOR. Never UPDATE or DELETE.
DROP POLICY IF EXISTS "Allow insertion of audit logs" ON pdpa_audit_logs;
CREATE POLICY "Allow insertion of audit logs"
  ON pdpa_audit_logs FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Auditors can inspect audit logs" ON pdpa_audit_logs;
CREATE POLICY "Auditors can inspect audit logs"
  ON pdpa_audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'SYSTEM_AUDITOR');

REVOKE UPDATE, DELETE ON pdpa_audit_logs FROM PUBLIC, authenticated, anon;

-- ----------------------------------------------------------------------------
-- 14. Seed Data (Pre-Populated Administrative Accounts & Consultations)
-- ----------------------------------------------------------------------------
INSERT INTO profiles (id, role, nic_blind_index, email_blind_index, anonymized_alias, district, is_verified_citizen, totp_enabled)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'PANEL_MODERATOR', 'blind_mod_001_hash', 'blind_mod_email_001', 'Panel-Lead-Dr-Fernando', 'Colombo', TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000002', 'POLICY_ADMIN', 'blind_adm_002_hash', 'blind_adm_email_002', 'Policy-Admin-Perera', 'Kandy', TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000003', 'SYSTEM_AUDITOR', 'blind_aud_003_hash', 'blind_aud_email_003', 'PDPA-Auditor-Silva', 'Galle', TRUE, TRUE),
  ('c0000000-0000-0000-0000-000000000001', 'CITIZEN', 'blind_cit_001_hash', 'blind_cit_email_001', 'Citizen-Western-9421', 'Colombo', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO policies (
  id, code,
  headline_en, headline_si, headline_ta,
  title_en, title_si, title_ta,
  summary_en, summary_si, summary_ta,
  description_en, description_si, description_ta,
  category, stage, target_ministry, author_agency, submission_count, is_publicly_visible, moderator_panel_notes
)
VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'EL-POL-2026-001',
  'Stop Algorithmic Bias: Safe & Fair AI for Everyone!',
  'ඇල්ගොරිතම පක්ෂග්‍රාහීත්වය නවතමු: සැමට සාධාරණ AI තාක්ෂණයක්!',
  'அல்காரிதம் சார்புநிலையை நிறுத்துங்கள்: அனைவருக்கும் பாதுகாப்பான நியாயமான AI!',
  'National AI Ethics & Algorithmic Accountability Framework',
  'ජාතික කෘතිම බුද්ධි ආචාරධර්ම සහ ඇල්ගොරිතම වගවීම පිළිබඳ රාමුව',
  'தேசிய செயற்கை நுண்ணறிவு நெறிமுறைகள் மற்றும் அல்காரிதம் பொறுப்புக்கூறல் கட்டமைப்பு',
  'Establish regulatory safety guardrails, bias prevention, and transparency audits for government and private AI systems.',
  'රාජ්‍ය සහ පෞද්ගලික AI පද්ධති සඳහා නියාමන ආරක්ෂණ, පක්ෂග්‍රාහී බව වැළැක්වීම සහ විනිවිදභාවය තහවුරු කිරීම.',
  'அரசு மற்றும் தனியார் AI அமைப்புகளுக்கான ஒழுங்குமுறை பாதுகாப்பு, பக்கச்சார்பு தடுப்பு மற்றும் வெளிப்படைத்தன்மை தணிக்கைகளை நிறுவுதல்.',
  'Comprehensive legislative whitepaper outlining mandatory risk classifications for high-impact AI models, citizen redressal against automated decision-making, and open data sharing standards.',
  'අධි-බලපෑම් සහිත AI ආකෘති සඳහා අනිවාර්ය අවදානම් වර්ගීකරණය, ස්වයංක්‍රීය තීරණවලට එරෙහිව පුරවැසියන්ගේ අයිතිවාසිකම් සහ විවෘත දත්ත ප්‍රමිති පිළිබඳ විස්තර.',
  'அதிவேக AI மாதிரிகளுக்கான கட்டாய இடர் வகைப்பாடுகள் மற்றும் முடிவுகளுக்கு எதிரான குடிமக்களின் தீர்வு ஆகியவற்றை விளக்கும் விரிவான ஆவணம்.',
  'DIGITAL_RIGHTS',
  'ACTIVE_CONSULTATION',
  'Ministry of Technology & Digital Economy',
  'National Digital Council',
  1420,
  TRUE,
  'Approved by Independent Ethics Board on 2026-01-15'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'EL-POL-2026-002',
  'Solar Farming & Smart Tech Subsidies for Rural Agriculture',
  'ග්‍රාමීය කෘෂිකර්මාන්තය සඳහා සූර්ය බලශක්ති සහ ස්මාර්ට් තාක්ෂණ සහනාධාර',
  'கிராமப்புற விவசாயத்திற்கான சூரிய சக்தி மற்றும் ஸ்மார்ட் தொழில்நுட்ப மானியங்கள்',
  'Sustainable Agritech Subsidies & Renewable Solar Farming Policy',
  'තිරසාර කෘෂි තාක්‍ෂණ සහනාධාර සහ සූර්ය බලශක්ති ගොවිතැන් ප්‍රතිපත්තිය',
  'நிலையான விவசாய தொழில்நுட்ப மானியங்கள் மற்றும் சூரிய சக்தி விவசாயக் கொள்கை',
  'Micro-incentives and IoT-enabled moisture sensing subsidies to bolster paddy yields and smallholder farmer resilience.',
  'කුඩා ගොවීන්ගේ ඔරොත්තු දීමේ හැකියාව සහ වී අස්වැන්න වැඩි කිරීම සඳහා ක්ෂුද්‍ර දිරිගැන්වීම් සහ IoT තෙතමනය සංවේදක සහනාධාර.',
  'நெல் விளைச்சல் மற்றும் சிறு விவசாயிகளின் நிலைத்தன்மையை வலுப்படுத்த IoT அடிப்படையிலான ஈரப்பதம் உணரி மானியங்கள்.',
  'National framework enabling direct subsidy cash-transfers, duty exemptions on smart agri-sensors, and distributed agrivoltaic systems across the dry zones.',
  'වියළි කලාපයේ ස්මාර්ට් කෘෂි සංවේදක සඳහා බදු සහන සහ සූර්ය බලශක්ති පද්ධති ප්‍රවර්ධනය කිරීමේ ජාතික රාමුව.',
  'வறண்ட பகுதிகளில் ஸ்மார்ட் விவசாய சென்சார்களுக்கான வரி விலக்குகள் மற்றும் விநியோகிக்கப்பட்ட சூரிய விவசாய அமைப்புகளை செயல்படுத்தும் தேசிய கட்டமைப்பு.',
  'AGRICULTURE_FOOD_SECURITY',
  'ACTIVE_CONSULTATION',
  'Ministry of Agriculture & Irrigation',
  'Agrarian Development Board',
  980,
  TRUE,
  'Reviewed by Environmental and Agrarian committee.'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'EL-POL-2026-003',
  'Live Public Tracking of Government Tenders Over LKR 50M',
  'රුපියල් මිලියන 50 ට වැඩි රජයේ ටෙන්ඩර් සජීවීව නිරීක්ෂණය කිරීම',
  'ரூ. 50 மில்லியனுக்கு மேற்பட்ட அரசாங்க டெண்டர்களை நேரலையாக கண்காணித்தல்',
  'Civic Transparency in Public Procurement & Asset Declaration Act',
  'රාජ්‍ය ප්‍රසම්පාදන සහ වත්කම් ප්‍රකාශ කිරීමේ විනිවිදභාවය පිළිබඳ පනත',
  'பொதுக் கொள்முதல் மற்றும் சொத்து அறிவிப்புச் சட்டத்தில் குடிமை வெளிப்படைத்தன்மை',
  'Real-time public tracking of tenders above LKR 50M, open contractual disclosures, and digitized asset registry.',
  'රුපියල් මිලියන 50 ට වැඩි ප්‍රසම්පාදන ටෙන්ඩර් සජීවීව නිරීක්ෂණය සහ ඩිජිටල් වත්කම් ලේඛනය.',
  'ரூ. 50 மில்லியனுக்கு மேற்பட்ட டெண்டர்களை நேரலையாக கண்காணித்தல் மற்றும் டிஜிட்டல் சொத்து பதிவேடு.',
  'Mandatory publication of beneficial ownership, API access for investigative journalists, and automated conflict-of-interest flagging.',
  'සමාගම්වල සැබෑ හිමිකාරිත්වය හෙළිදරව් කිරීම සහ ගැටුම් ස්වයංක්‍රීයව හඳුනාගැනීම.',
  'நன்மை பயக்கும் உரிமையை கட்டாயமாக வெளியிடுதல் மற்றும் ஆர்வ முரண்பாடுகளை தானியங்கு முறையில் கண்டறிதல்.',
  'CONSTITUTIONAL_GOVERNANCE',
  'APPROVED_PANEL',
  'Ministry of Justice & Constitutional Affairs',
  'Anti-Corruption Commission',
  0,
  TRUE,
  'Approved by Expert Panel. Questionnaire formulation underway.'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'EL-POL-2026-004',
  'Decentralized Telemedicine for Peripheral Hospitals',
  'පර්යන්ත රෝහල් සඳහා විමධ්‍යගත ටෙලිමෙඩිසින් සේවාව',
  'கிராமப்புற மருத்துவமனைகளுக்கான பரவலாக்கப்பட்ட தொலைமருத்துவ சேவை',
  'Decentralized Healthcare Telemedicine Network for Rural Hospitals',
  'ග්‍රාමීය රෝහල් සඳහා විමධ්‍යගත ටෙලිමෙඩිසින් සෞඛ්‍ය ජාලය',
  'கிராமப்புற மருத்துவமனைகளுக்கான பரவலாக்கப்பட்ட டெலிமெடிசின் சுகாதார வலையமைப்பு',
  'Proposal submitted by Primary Care Physicians to bridge specialist shortages in peripheral healthcare units.',
  'ප්‍රාථමික සත්කාර වෛද්‍යවරුන් විසින් ඉදිරිපත් කරන ලද ග්‍රාමීය විශේෂඥ හිඟය පියවීමේ යෝජනාව.',
  'கிராமப்புற சுகாதாரப் பிரிவுகளில் உள்ள நிபுணர் பற்றாக்குறையை நிவர்த்தி செய்வதற்காக ஆரம்ப சுகாதார மருத்துவர்களால் முன்வைக்கப்பட்ட திட்டம்.',
  'Draft proposal awaiting statutory moderation gate approval prior to questionnaire formulation.',
  'ප්‍රශ්නාවලිය සැකසීමට පෙර ව්‍යවස්ථාපිත මධ්‍යස්ථතා මණ්ඩලයේ අනුමැතිය අපේක්ෂාවෙන් පවතී.',
  'கேள்வித்தாள் உருவாக்கத்திற்கு முன் சட்டரீதியான நடுவர் குழுவின் ஒப்புதலுக்காக காத்திருக்கும் வரைவு முன்மொழிவு.',
  'HEALTHCARE_WELFARE',
  'PENDING_REVIEW',
  'Ministry of Health',
  'Government Medical Officers Federation',
  0,
  FALSE,
  'Queued for Stage 1 Moderation Gate'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO petitions (
  id, code,
  headline_en, headline_si, headline_ta,
  title_en, title_si, title_ta,
  objective_en, objective_si, objective_ta,
  target_authority, category, required_signatures, current_signatures, status, deadline
)
VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'PET-2026-012',
  'Provide High-Speed Internet to All Rural Schools!',
  'සියලුම ග්‍රාමීය පාසල් සඳහා අධිවේගී අන්තර්ජාලය ලබා දෙන්න!',
  'அனைத்து கிராமப்புற பாடசாலைகளுக்கும் அதிவேக இணையத்தை வழங்குங்கள்!',
  'Mandate Open Fiber Access for Rural Education Zones',
  'ග්‍රාමීය අධ්‍යාපන කලාප සඳහා විවෘත ෆයිබර් ප්‍රවේශය අනිවාර්ය කිරීම',
  'கிராமப்புற கல்வி வலயங்களுக்கு திறந்த ஃபைபர் அணுகலை கட்டாயமாக்குதல்',
  'Ensure every public school in peripheral districts has gigabit connectivity for digital classrooms by end of 2026.',
  '2026 අවසන් වන විට ග්‍රාමීය පාසල් සඳහා ඩිජිටල් පන්ති කාමර සම්බන්ධතාව සහතික කිරීම.',
  '2026 இறுதிக்குள் தொலைதூரப் பாடசாலைகளுக்கு கிகாபிட் இணைப்பை உறுதி செய்தல்.',
  'Telecommunications Regulatory Commission of Sri Lanka (TRCSL)',
  'EDUCATION_YOUTH',
  5000,
  3842,
  'ACTIVE',
  NOW() + INTERVAL '45 days'
),
(
  'e0000000-0000-0000-0000-000000000002',
  'PET-2026-018',
  'Protect Our Beaches: Ban Single-Use Plastics Now!',
  'අපගේ වෙරළ තීරයන් රකිමු: එක්වරක් භාවිත කරන ප්ලාස්ටික් වහාම තහනම් කරනු!',
  'நமது கடற்கரைகளைப் பாதுகாப்போம்: ஒருமுறை பயன்படுத்தும் பிளாஸ்டிக்கை உடனடியாக தடை செய்வோம்!',
  'Statutory Ban on Single-Use Non-Biodegradable Plastics',
  'එක්වරක් භාවිත කරන ජෛව හායනය නොවන ප්ලාස්ටික් සඳහා ව්‍යවස්ථාපිත තහනම',
  'ஒருமுறை மட்டுமே பயன்படுத்தக்கூடிய மக்காத பிளாஸ்டிக்குகளுக்கு சட்டரீதியான தடை',
  'Phase out all non-essential consumer polyethylene packaging across Sri Lankan retail chains by Q3 2026.',
  '2026 තුන්වන කාර්තුව වන විට සියලුම අත්‍යවශ්‍ය නොවන පොලිතීන් භාවිතය නතර කිරීම.',
  '2026 ஆம் ஆண்டின் 3 ஆம் காலாண்டிற்குள் அனைத்து அத்தியாவசியமற்ற பொலித்தீன் பயன்பாட்டையும் நிறுத்துதல்.',
  'Central Environmental Authority (CEA)',
  'ENVIRONMENT_CLIMATE',
  10000,
  7129,
  'ACTIVE',
  NOW() + INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;
