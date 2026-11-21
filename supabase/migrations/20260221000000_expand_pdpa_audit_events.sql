-- E-Lanka Digital Democracy Platform
-- Migration: 20260221000000_expand_pdpa_audit_events.sql
-- Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022 (Section 23 Statutory Audit Logging)

-- Expand pdpa_action_enum with statutory events required under Issue 1.4
ALTER TYPE pdpa_action_enum ADD VALUE IF NOT EXISTS 'FAILED_2FA_ATTEMPT';
ALTER TYPE pdpa_action_enum ADD VALUE IF NOT EXISTS 'DATA_ERASURE_EXECUTED';
ALTER TYPE pdpa_action_enum ADD VALUE IF NOT EXISTS 'AI_PII_SCRUBBING_TRIGGERED';
ALTER TYPE pdpa_action_enum ADD VALUE IF NOT EXISTS 'EPETITION_SIGNED';
ALTER TYPE pdpa_action_enum ADD VALUE IF NOT EXISTS 'POLICY_PUBLISHED';
