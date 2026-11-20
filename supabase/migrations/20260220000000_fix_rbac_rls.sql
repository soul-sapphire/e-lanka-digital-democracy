-- ============================================================================
-- E-Lanka Digital Democracy Platform - RBAC Security & RLS Fix (Issue 1.2)
-- Enforces strict Row Level Security on policies, audit logs, and admin queues
-- ============================================================================

-- 1. Ensure unapproved draft proposals (Stage 1 PENDING_REVIEW) are invisible to CITIZEN role
DROP POLICY IF EXISTS "Public can view active or approved policies" ON policies;

CREATE POLICY "Public can view active or approved policies"
  ON policies FOR SELECT
  USING (
    (is_publicly_visible = TRUE AND stage IN ('APPROVED_PANEL', 'ACTIVE_CONSULTATION', 'AI_ANALYSIS_SYNC', 'CONCLUDED_ARCHIVED'))
    OR
    (auth.jwt() ->> 'role' IN ('PANEL_MODERATOR', 'POLICY_ADMIN', 'SYSTEM_AUDITOR'))
  );

-- 2. Ensure only SYSTEM_AUDITOR can inspect the immutable PDPA audit ledger
DROP POLICY IF EXISTS "Auditors can inspect audit logs" ON pdpa_audit_logs;

CREATE POLICY "Auditors can inspect audit logs"
  ON pdpa_audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'SYSTEM_AUDITOR');

-- 3. Explicitly deny SELECT on audit logs for citizens
REVOKE SELECT ON pdpa_audit_logs FROM anon;
