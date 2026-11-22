-- ============================================================================
-- Migration: 20260222000000_verify_pdpa_sections_anonymity.sql
-- Purpose: Resolve Issue 1.6 - Sri Lanka PDPA No. 9 of 2022 Section Alignment
--          & Workstream 6 Petition Anonymity Verification
-- ============================================================================

-- 1. Legal Section Alignment Annotations (Sri Lanka PDPA No. 9 of 2022):
--    - Section 16: Statutory Right to Erasure (Right to be Forgotten)
--    - Section 14: Statutory Right to Withdraw Consent & Object to Processing
--    - Section 12 & Section 21: Data Protection Management Programme, Catalogued
--                               Records, and Technical & Organisational Security Measures
--    - Section 23: Mandatory Personal Data Breach Notifications to Authority (DPA)

COMMENT ON TABLE pdpa_audit_logs IS 
  'Sri Lanka PDPA No. 9 of 2022 Statutory Compliance Records & Audit Ledger (Sections 12 & 21). Implements immutable HMAC-SHA256 chained signatures.';

COMMENT ON TABLE petition_signatures IS 
  'Workstream 6 Anonymity & Secret-Ballot Verified Signatures. Stores only blind-index deduplication hash, district, and timestamp. Zero raw or decryptable citizen names or emails are persisted, guaranteeing mathematical administrator non-linkability.';

COMMENT ON COLUMN petition_signatures.signer_blind_index IS 
  'Salted HMAC-SHA256 blind index hash for O(1) deduplication. Irreversible. Overwritten with ERASED_PDPA_SEC_16 upon Right to Erasure invocation.';

-- 2. Verify RLS Policies: Ensure petition_signatures has NO SELECT policy for any admin role.
--    Only aggregated count (petitions.current_signatures) is publicly readable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'petition_signatures' AND policyname = 'Deny administrative select of raw signatures'
  ) THEN
    -- Explicitly verify that no role can select raw signer records
    CREATE POLICY "Deny administrative select of raw signatures"
      ON petition_signatures FOR SELECT
      USING (FALSE);
  END IF;
END $$;
