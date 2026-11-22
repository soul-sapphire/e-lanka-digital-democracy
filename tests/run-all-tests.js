/**
 * E-Lanka Digital Democracy Platform - Comprehensive Test Suite
 * Specification: EL-SPEC-2026-V3
 * Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../packages/backend/.env') });

const { encryptField, decryptField, encryptJson, decryptJson } = require('../packages/backend/dist/crypto/fle');
const {
  normalizeNIC,
  isValidSriLankanNIC,
  normalizeEmail,
  generateBlindIndex,
  computeBlindHash,
  generateCitizenAlias
} = require('../packages/backend/dist/crypto/blind-index');
const {
  generateTOTPSecret,
  computeTOTP,
  verifyTOTP,
  generateOtpauthUri,
  base32Encode,
  base32Decode
} = require('../packages/backend/dist/crypto/totp');
const { DatabaseStore } = require('../packages/backend/dist/db/store');
const { PDPAService } = require('../packages/backend/dist/services/pdpa.service');
const { AIWorkerService } = require('../packages/backend/dist/services/ai-worker.service');
const { PolicyLifecycleStage } = require('../packages/shared/dist/types/policy');
const { decodeAndValidateSriLankanNIC, verifyClaimedCitizenDetails } = require('../packages/shared/dist/nic-validator');
const { drpGatewayService } = require('../packages/backend/dist/services/drp-gateway.service');
const { mobileOTPService } = require('../packages/backend/dist/services/otp.service');

let passedTests = 0;
let failedTests = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function itAsync(description, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('🏛️  E-LANKA DIGITAL DEMOCRACY PLATFORM - COMPREHENSIVE TEST SUITE');
  console.log('⚖️  Statutory Standard: Sri Lanka PDPA No. 9 of 2022');
  console.log('===============================================================\n');

  // --------------------------------------------------------------------------
  // SUITE 1: Field-Level Encryption (AES-256-GCM)
  // --------------------------------------------------------------------------
  console.log('📦 SUITE 1: Field-Level Encryption (FLE) Engine (AES-256-GCM)');

  it('1.1 Encrypts plaintext and decrypts to exact original content', () => {
    const secret = 'Citizen Nimal Perera (NIC: 851234567V) - Highly Sensitive Open Text Feedback';
    const payload = encryptField(secret);

    assert.strictEqual(payload.algorithm, 'aes-256-gcm');
    assert.strictEqual(payload.keyVersion, 'v1');
    assert.strictEqual(typeof payload.iv, 'string');
    assert.strictEqual(payload.iv.length, 24); // 12 bytes = 24 hex chars
    assert.strictEqual(typeof payload.authTag, 'string');
    assert.strictEqual(payload.authTag.length, 32); // 16 bytes = 32 hex chars
    assert.notStrictEqual(payload.ciphertext, secret);

    const decrypted = decryptField(payload);
    assert.strictEqual(decrypted, secret);
  });

  it('1.2 Generates unique IVs and ciphertexts for identical plaintext inputs', () => {
    const text = 'Same citizen feedback repeated';
    const enc1 = encryptField(text);
    const enc2 = encryptField(text);

    assert.notStrictEqual(enc1.iv, enc2.iv);
    assert.notStrictEqual(enc1.ciphertext, enc2.ciphertext);
    assert.strictEqual(decryptField(enc1), text);
    assert.strictEqual(decryptField(enc2), text);
  });

  it('1.3 Detects ciphertext tampering and rejects with integrity error', () => {
    const payload = encryptField('Original unmodified payload');
    // Tamper with ciphertext by corrupting last byte
    const tamperedCiphertext = payload.ciphertext.slice(0, -2) + (payload.ciphertext.endsWith('00') ? 'ff' : '00');
    const tamperedPayload = { ...payload, ciphertext: tamperedCiphertext };

    assert.throws(() => {
      decryptField(tamperedPayload);
    }, /Unsupported state or unable to authenticate data|bad decrypt/i);
  });

  it('1.4 Encrypts and decrypts structured JSON data structures', () => {
    const data = { citizenId: 'cit_9942', verified: true, districts: ['Colombo', 'Gampaha'], rating: 5 };
    const enc = encryptJson(data);
    const dec = decryptJson(enc);

    assert.deepStrictEqual(dec, data);
  });

  // --------------------------------------------------------------------------
  // SUITE 2: HMAC-SHA256 Blind Indexing & NIC Normalization
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 2: HMAC-SHA256 Blind Indexing Engine (Deduplication)');

  it('2.1 Normalizes old Sri Lankan NIC format (9 digits + V/X)', () => {
    assert.strictEqual(normalizeNIC(' 851234567v '), '851234567V');
    assert.strictEqual(normalizeNIC('851234567-X'), '851234567X');
    assert.strictEqual(isValidSriLankanNIC('851234567V'), true);
    assert.strictEqual(isValidSriLankanNIC('851234567x'), true);
  });

  it('2.2 Normalizes new Sri Lankan NIC format (12 digits)', () => {
    assert.strictEqual(normalizeNIC(' 198512345678 '), '198512345678');
    assert.strictEqual(isValidSriLankanNIC('198512345678'), true);
    assert.strictEqual(isValidSriLankanNIC('12345'), false); // Too short
    assert.strictEqual(isValidSriLankanNIC('19851234567899'), false); // Too long
  });

  it('2.3 Generates deterministic 64-char hex blind index for duplicate detection', () => {
    const hash1 = computeBlindHash('851234567V', 'NIC');
    const hash2 = computeBlindHash(' 851234567v ', 'NIC');
    const hash3 = computeBlindHash('199012345678', 'NIC');

    assert.strictEqual(hash1.length, 64);
    assert.strictEqual(hash1, hash2, 'Normalized variations must yield identical blind hash');
    assert.notStrictEqual(hash1, hash3, 'Different NICs must produce distinct hashes');
  });

  it('2.4 Generates privacy-preserving citizen alias', () => {
    const alias = generateCitizenAlias('Kandy', 'fa67b8569bacb53cca1889242c13cf29');
    assert.strictEqual(alias, 'Citizen-Kandy-fa67');
  });

  // --------------------------------------------------------------------------
  // SUITE 3: RFC 6238 TOTP 2FA Verification Engine
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 3: RFC 6238 Time-Based One-Time Password (TOTP) 2FA');

  it('3.1 Generates 20-byte cryptographically secure Base32 secret', () => {
    const secret = generateTOTPSecret();
    assert.strictEqual(typeof secret, 'string');
    assert.strictEqual(secret.length, 32); // 20 bytes = 32 Base32 characters
  });

  it('3.2 Generates standard 6-digit TOTP token and verifies on current time step', () => {
    const secret = generateTOTPSecret();
    const currentCounter = Math.floor(Date.now() / 1000 / 30);
    const code = computeTOTP(secret, currentCounter);

    assert.strictEqual(code.length, 6);
    assert.strictEqual(/^\d{6}$/.test(code), true);
    assert.strictEqual(verifyTOTP(secret, code, 1), true);
  });

  it('3.3 Accepts code within clock-drift tolerance window (±1 step / 30s)', () => {
    const secret = generateTOTPSecret();
    const currentCounter = Math.floor(Date.now() / 1000 / 30);
    const previousStepCode = computeTOTP(secret, currentCounter - 1);
    const nextStepCode = computeTOTP(secret, currentCounter + 1);

    assert.strictEqual(verifyTOTP(secret, previousStepCode, 1), true);
    assert.strictEqual(verifyTOTP(secret, nextStepCode, 1), true);
  });

  it('3.4 Strictly rejects stale or invalid TOTP codes', () => {
    const secret = generateTOTPSecret();
    const currentCounter = Math.floor(Date.now() / 1000 / 30);
    const staleCode = computeTOTP(secret, currentCounter - 5); // 150 seconds ago

    assert.strictEqual(verifyTOTP(secret, staleCode, 1), false);
    assert.strictEqual(verifyTOTP(secret, '000000', 1), false);
    assert.strictEqual(verifyTOTP(secret, 'invalid', 1), false);
  });

  it('3.5 Constructs standard otpauth URI compatible with authenticator apps', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const uri = generateOtpauthUri('admin@elanka.gov.lk', 'E-Lanka Democracy', secret);

    assert.strictEqual(uri.startsWith('otpauth://totp/'), true);
    assert.strictEqual(uri.includes('secret=JBSWY3DPEHPK3PXP'), true);
    assert.strictEqual(uri.includes('digits=6'), true);
    assert.strictEqual(uri.includes('period=30'), true);
  });

  // --------------------------------------------------------------------------
  // SUITE 4: 5-Stage Policy Consultation Lifecycle & Moderation Gate
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 4: 5-Stage Policy Lifecycle & Moderation Gate');

  it('4.1 Proposal submission starts in Stage 1 (PENDING_REVIEW) and is private', () => {
    const store = DatabaseStore.getInstance();
    const draft = store.createPolicy({
      title: { en: 'Open Source Government Software Mandate', si: 'විවෘත මූලාශ්‍ර රාජ්‍ය මෘදුකාංග විධානය', ta: 'திறந்த மூல அரசு மென்பொருள் கட்டளை' },
      summary: { en: 'Require public institutions to prioritize open-source software.', si: 'විවෘත මූලාශ්‍ර මෘදුකාංග සඳහා ප්‍රමුඛත්වය ලබා දීම.', ta: 'திறந்த மூல மென்பொருளுக்கு முன்னுரிமை அளித்தல்.' },
      category: 'DIGITAL_RIGHTS'
    });

    assert.strictEqual(draft.stage, PolicyLifecycleStage.STAGE_1_PENDING_REVIEW);
    assert.strictEqual(draft.isPubliclyVisible, false);
    assert.strictEqual(draft.submissionCount, 0);
  });

  it('4.2 Strictly blocks skipping Stage 2 (Cannot publish without APPROVED_PANEL)', () => {
    const store = DatabaseStore.getInstance();
    const draft = store.createPolicy({
      title: { en: 'Test Policy', si: 'පරීක්ෂණ ප්‍රතිපත්තිය', ta: 'சோதனை கொள்கை' },
      summary: { en: 'Test summary', si: 'පරීක්ෂණ සාරාංශය', ta: 'சோதனை சுருக்கம்' },
      category: 'ECONOMIC_REFORM'
    });

    assert.throws(() => {
      // Attempt unauthorized transition from PENDING_REVIEW directly to ACTIVE_CONSULTATION
      store.updatePolicyStage(
        draft.id,
        PolicyLifecycleStage.STAGE_3_ACTIVE_CONSULTATION,
        'Attempting illegal skip',
        'rogue_admin'
      );
    }, /Violation of 5-Stage Policy Lifecycle: Proposal must be approved by Panel Gate/i);
  });

  it('4.3 Panel Gate review approves proposal to Stage 2 (APPROVED_PANEL)', () => {
    const store = DatabaseStore.getInstance();
    const draft = store.createPolicy({
      title: { en: 'Judicial Digitization Act', si: 'අධිකරණ ඩිජිටල්කරණ පනත', ta: 'நீதித்துறை டிஜிட்டல்மயமாக்கல் சட்டம்' },
      summary: { en: 'Paperless courts across all provincial high courts.', si: 'සියලුම පළාත් මහාධිකරණ හරහා කඩදාසි රහිත උසාවි.', ta: 'காகிதமில்லா நீதிமன்றங்கள்.' },
      category: 'CONSTITUTIONAL_GOVERNANCE'
    });

    const approved = store.updatePolicyStage(
      draft.id,
      PolicyLifecycleStage.STAGE_2_APPROVED_PANEL,
      'Approved unanimously by Expert Legal Advisory Committee',
      'panel_chair_dr_fernando'
    );

    assert.strictEqual(approved.stage, PolicyLifecycleStage.STAGE_2_APPROVED_PANEL);
    assert.strictEqual(approved.isPubliclyVisible, true);
    assert.strictEqual(typeof approved.approvedAt, 'string');
  });

  it('4.4 Server-side RBAC strictly excludes unapproved Stage 1 proposals (EL-POL-2026-004) from public queries', () => {
    const store = DatabaseStore.getInstance();
    const publicPolicies = store.getPolicies(false);

    // Verify EL-POL-2026-004 is NOT present in public query
    const leakedDraft = publicPolicies.find(p => p.code === 'EL-POL-2026-004');
    assert.strictEqual(leakedDraft, undefined, 'Draft proposal EL-POL-2026-004 must not leak to public queries');

    // Verify all public policies have stage != STAGE_1_PENDING_REVIEW and isPubliclyVisible = true
    for (const policy of publicPolicies) {
      assert.notStrictEqual(policy.stage, PolicyLifecycleStage.STAGE_1_PENDING_REVIEW);
      assert.strictEqual(policy.isPubliclyVisible, true);
    }

    // Verify admin query can access all proposals including EL-POL-2026-004
    const adminPolicies = store.getPolicies(true);
    const adminDraft = adminPolicies.find(p => p.code === 'EL-POL-2026-004');
    assert.notStrictEqual(adminDraft, undefined, 'Admin query must have access to Stage 1 moderation queue');
    assert.strictEqual(adminDraft.stage, PolicyLifecycleStage.STAGE_1_PENDING_REVIEW);
  });

  // --------------------------------------------------------------------------
  // SUITE 5: Dynamic Survey Ingestion with AES-256-GCM FLE
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 5: Dynamic Survey Response Ingestion & FLE Persistence');

  it('5.1 Ingests survey response and encrypts open-text feedback with AES-256-GCM', () => {
    const store = DatabaseStore.getInstance();
    const policyId = 'b0000000-0000-0000-0000-000000000001';
    const surveyData = store.getSurveyByPolicyId(policyId);

    const citizenBlindIndex = computeBlindHash('199012345678', 'NIC');
    const initialCount = store.getPolicyById(policyId).submissionCount;

    const res = store.ingestSurveyResponse({
      surveyId: surveyData.survey.id,
      policyId,
      citizenBlindIndex,
      answers: [
        {
          questionId: 'q001',
          questionType: 'SINGLE_CHOICE',
          selectedOptionId: 'opt1'
        },
        {
          questionId: 'q002',
          questionType: 'RATING_SCALE',
          numericRating: 4
        },
        {
          questionId: 'q003',
          questionType: 'OPEN_TEXT',
          rawOpenText: 'Independent statutory audits must be audited every 6 months under PDPA No. 9 of 2022.'
        }
      ],
      clientLanguage: 'en'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.responseCount, initialCount + 1);
  });

  // --------------------------------------------------------------------------
  // SUITE 6: E-Petition Verified Signatures & Blind Index Deduplication
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 6: E-Petition Engine (Live Counters & Duplicate Prevention)');

  it('6.1 Records verified signature and atomically increments signature counter', () => {
    const store = DatabaseStore.getInstance();
    const petitionId = 'e0000000-0000-0000-0000-000000000001';
    const initialSignatures = store.getPetitionById(petitionId).currentSignatures;

    const res = store.signPetition({
      petitionId,
      nicNumber: '199512349999',
      fullName: 'Sunil Weerasinghe',
      email: 'sunil@test.lk',
      district: 'Galle'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.currentSignatures, initialSignatures + 1);
  });

  it('6.2 Rejects duplicate signature attempt by same NIC using blind indexing', () => {
    const store = DatabaseStore.getInstance();
    const petitionId = 'e0000000-0000-0000-0000-000000000001';
    const initialSignatures = store.getPetitionById(petitionId).currentSignatures;

    // First signature
    store.signPetition({
      petitionId,
      nicNumber: '881234999V',
      fullName: 'Anoma Jayawardena',
      email: 'anoma@test.lk',
      district: 'Colombo'
    });

    // Attempt second signature with same NIC
    const dupRes = store.signPetition({
      petitionId,
      nicNumber: ' 881234999v ',
      fullName: 'Anoma Jayawardena',
      email: 'anoma@test.lk',
      district: 'Colombo'
    });

    assert.strictEqual(dupRes.success, false);
    assert.strictEqual(dupRes.message.includes('already verified a signature'), true);
    assert.strictEqual(dupRes.currentSignatures, initialSignatures + 1);
  });

  // --------------------------------------------------------------------------
  // SUITE 7: Sri Lanka PDPA No. 9 of 2022 Right to Erasure Pipeline
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 7: Sri Lanka PDPA No. 9 of 2022 Statutory Right to Erasure');

  it('7.1 Decouples citizen identity, wipes PII, and preserves immutable counts', () => {
    const store = DatabaseStore.getInstance();
    const testNic = '197512345678';
    const citizenBlindIndex = computeBlindHash(testNic, 'NIC');

    // Seed response and signature
    store.ingestSurveyResponse({
      surveyId: 's0000000-0000-0000-0000-000000000001',
      policyId: 'b0000000-0000-0000-0000-000000000001',
      citizenBlindIndex,
      answers: [{ questionId: 'q003', questionType: 'OPEN_TEXT', rawOpenText: 'Private confidential citizen thoughts' }],
      clientLanguage: 'en'
    });

    store.signPetition({
      petitionId: 'e0000000-0000-0000-0000-000000000002',
      nicNumber: testNic,
      fullName: 'Citizen to be Erased',
      email: 'erase.me@test.lk',
      district: 'Matara'
    });

    const prePolicyCount = store.getPolicyById('b0000000-0000-0000-0000-000000000001').submissionCount;
    const prePetitionCount = store.getPetitionById('e0000000-0000-0000-0000-000000000002').currentSignatures;

    // Execute statutory erasure under Section 16 (read with Section 14)
    const erasure = store.executeRightToErasure({
      citizenBlindIndex,
      erasureScope: 'ALL_PII',
      reason: 'Citizen invoked PDPA Section 16 (read with Section 14)',
      acknowledgedImmutableRetention: true
    });

    assert.strictEqual(erasure.success, true);
    assert.strictEqual(erasure.anonymizedSurveyResponses >= 1, true);
    assert.strictEqual(erasure.anonymizedSignatures >= 1, true);

    // CRITICAL: Aggregate counts must remain unchanged
    const postPolicyCount = store.getPolicyById('b0000000-0000-0000-0000-000000000001').submissionCount;
    const postPetitionCount = store.getPetitionById('e0000000-0000-0000-0000-000000000002').currentSignatures;

    assert.strictEqual(postPolicyCount, prePolicyCount, 'Policy count must be preserved post-erasure');
    assert.strictEqual(postPetitionCount, prePetitionCount, 'Petition count must be preserved post-erasure');
  });

  it('7.2 Verifies cryptographic chain integrity of PDPA audit ledger', () => {
    const chainStatus = PDPAService.verifyChainIntegrity();
    assert.strictEqual(chainStatus.isValid, true);
    assert.strictEqual(chainStatus.totalBlocksChecked > 0, true);
  });

  it('7.3 Logs all key statutory PDPA events required under Issue 1.4', () => {
    // Log FAILED_2FA_ATTEMPT
    const log1 = PDPAService.logAudit({
      action: 'FAILED_2FA_ATTEMPT',
      actorRole: 'UNKNOWN',
      actorId: '192.168.1.50',
      resourceType: 'AUTHENTICATION',
      resourceId: 'REQ-AUTH-FAIL',
      purposeDescription: 'Security alert: Invalid TOTP token entered'
    });
    assert.strictEqual(log1.action, 'FAILED_2FA_ATTEMPT');
    assert.strictEqual(typeof log1.immutableSignature, 'string');

    // Log DATA_ERASURE_EXECUTED
    const log2 = PDPAService.logAudit({
      action: 'DATA_ERASURE_EXECUTED',
      actorRole: 'CITIZEN',
      actorId: 'BLIND-IDX-XYZ',
      resourceType: 'USER_PROFILE',
      resourceId: 'USER-001',
      purposeDescription: 'Statutory Right to Erasure executed'
    });
    assert.strictEqual(log2.action, 'DATA_ERASURE_EXECUTED');

    // Log AI_PII_SCRUBBING_TRIGGERED
    const log3 = PDPAService.logAudit({
      action: 'AI_PII_SCRUBBING_TRIGGERED',
      actorRole: 'AI_WORKER',
      actorId: 'worker-01',
      resourceType: 'POLICY',
      resourceId: 'POL-001',
      purposeDescription: 'Executed automated PII scrubbing'
    });
    assert.strictEqual(log3.action, 'AI_PII_SCRUBBING_TRIGGERED');

    // Log EPETITION_SIGNED
    const log4 = PDPAService.logAudit({
      action: 'EPETITION_SIGNED',
      actorRole: 'CITIZEN',
      actorId: 'BLIND-IDX-SIGN',
      resourceType: 'PETITION_SIGNATURE',
      resourceId: 'PET-001',
      purposeDescription: 'Verified citizen signed petition'
    });
    assert.strictEqual(log4.action, 'EPETITION_SIGNED');

    // Log POLICY_PUBLISHED
    const log5 = PDPAService.logAudit({
      action: 'POLICY_PUBLISHED',
      actorRole: 'POLICY_ADMIN',
      actorId: 'admin-01',
      resourceType: 'POLICY',
      resourceId: 'POL-001',
      purposeDescription: 'Policy officially published to Stage 3 consultation'
    });
    assert.strictEqual(log5.action, 'POLICY_PUBLISHED');
  });

  it('7.4 Verifies full HMAC-SHA256 chained integrity across newly logged events', () => {
    const chainStatus = PDPAService.verifyChainIntegrity();
    assert.strictEqual(chainStatus.isValid, true, 'HMAC-SHA256 chain must remain unbroken');
    assert.strictEqual(chainStatus.algorithm, 'HMAC-SHA256 (RFC 2104)');
    assert.strictEqual(typeof chainStatus.genesisBlockSignature, 'string');
    assert.strictEqual(typeof chainStatus.latestBlockSignature, 'string');
  });

  it('7.5 Confirms audit logs filtering by action, actorRole, and search keyword', () => {
    const failed2fa = PDPAService.getAuditLogs({ action: 'FAILED_2FA_ATTEMPT' });
    assert.ok(failed2fa.logs.length >= 1, 'Should filter by FAILED_2FA_ATTEMPT');
    assert.ok(failed2fa.logs.every(l => l.action === 'FAILED_2FA_ATTEMPT'));

    const searchRes = PDPAService.getAuditLogs({ search: 'Security alert' });
    assert.ok(searchRes.logs.length >= 1, 'Should find search keyword');
  });

  it('7.6 Workstream 6 Anonymity Audit: Verifies zero personal data stored in petition signature rows', () => {
    const store = DatabaseStore.getInstance();
    const testNic = '912345678V';
    const testName = 'Vulnerable Human Rights Activist';
    const testEmail = 'activist@cslk.org';
    const testDistrict = 'Jaffna';

    const signRes = store.signPetition({
      petitionId: 'e0000000-0000-0000-0000-000000000001',
      nicNumber: testNic,
      fullName: testName,
      email: testEmail,
      district: testDistrict
    });
    assert.strictEqual(signRes.success, true);

    // Retrieve internal signatures matching this specific blind index
    const signerBlindIndex = computeBlindHash(testNic, 'NIC');
    const sig = store.petitionSignatures.find(s => s.petitionId === 'e0000000-0000-0000-0000-000000000001' && s.signerBlindIndex === signerBlindIndex);
    assert.ok(sig, 'Signature record must exist');

    // Decrypt the signer payload with the master FLE key
    const decryptedData = decryptJson(sig.encryptedSignerData);

    // CRITICAL: Ensure neither real name, email, nor raw NIC is persisted anywhere
    assert.strictEqual(decryptedData.fullName, undefined, 'Raw full name must NEVER be persisted in signature row');
    assert.strictEqual(decryptedData.email, undefined, 'Raw email must NEVER be persisted in signature row');
    assert.strictEqual(decryptedData.nicNumber, undefined, 'Raw NIC must NEVER be persisted in signature row');
    assert.strictEqual(decryptedData.district, testDistrict, 'District demographic counter is retained');
    assert.strictEqual(typeof decryptedData.anonymizedAlias, 'string', 'Pseudonymous citizen alias is retained');

    // Check raw JSON string across entire signature record
    const rawSigJson = JSON.stringify(sig);
    assert.strictEqual(rawSigJson.includes(testName), false, 'Activist name must not appear in signature record');
    assert.strictEqual(rawSigJson.includes(testEmail), false, 'Activist email must not appear in signature record');
    assert.strictEqual(rawSigJson.includes(testNic), false, 'Activist NIC must not appear in signature record');
  });

  it('7.7 Validates statutory PDPA Section citations (Section 16 Erasure, Section 14 Withdrawal, Sections 12 & 21 Audit, Section 23 Breach)', () => {
    const store = DatabaseStore.getInstance();
    const testNic = '198812345678';
    const blindIndex = computeBlindHash(testNic, 'NIC');

    store.ingestSurveyResponse({
      surveyId: 's0000000-0000-0000-0000-000000000001',
      policyId: 'b0000000-0000-0000-0000-000000000001',
      citizenBlindIndex: blindIndex,
      answers: [{ questionId: 'q003', questionType: 'OPEN_TEXT', rawOpenText: 'Statutory test feedback' }],
      clientLanguage: 'en'
    });

    const erasure = store.executeRightToErasure({
      citizenBlindIndex: blindIndex,
      erasureScope: 'ALL_PII',
      reason: 'Statutory Section 16 verification',
      acknowledgedImmutableRetention: true
    });

    assert.strictEqual(erasure.success, true);

    // Check that erased survey response has the updated Section 16 decoupling token
    const erasedResp = store.surveyResponses.find(r => r.isErased && r.citizenBlindIndex === 'ERASED_PDPA_SEC_16');
    assert.ok(erasedResp, 'Erased response must be marked with ERASED_PDPA_SEC_16 token');

    // Check statutory audit log description
    const erasureLog = PDPAService.getAuditLogs({ action: 'DATA_ERASURE_EXECUTED' }).logs[0];
    assert.ok(erasureLog.purposeDescription.includes('Section 16, read with Section 14'), 'Audit log must cite Section 16 and Section 14');
  });

  // --------------------------------------------------------------------------
  // SUITE 8: AI Worker PII Scrubbing & Sentiment Mapping
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 8: AI Opinion Mapping & Sri Lankan PII Scrubbing');

  it('8.1 Redacts Sri Lankan NICs, phone numbers, and emails from unstructured text', () => {
    const rawInput = 'Citizen Bandara with NIC 921456789V and phone 0771234567 email bandara@gmail.com urges approval of solar agritech subsidies.';
    const scrubbed = AIWorkerService.scrubPII(rawInput);

    assert.strictEqual(scrubbed.scrubbedText.includes('921456789V'), false);
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_NIC]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('0771234567'), false);
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_PHONE]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('bandara@gmail.com'), false);
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_EMAIL]'), true);
  });

  it('8.2 Synthesizes qualitative sentiment score and label', () => {
    const positiveInput = 'I strongly support this excellent and crucial policy initiative. Urgent implementation is needed.';
    const analysis = AIWorkerService.scrubPII(positiveInput);

    assert.strictEqual(analysis.sentiment.score > 0, true);
    assert.strictEqual(['POSITIVE', 'VERY_POSITIVE'].includes(analysis.sentiment.label), true);
  });

  await itAsync('8.3 Generates zero-PII public JSON aggregates', async () => {
    const aggregate = await AIWorkerService.processAndSyncAggregates('b0000000-0000-0000-0000-000000000001');

    assert.strictEqual(typeof aggregate.syncHash, 'string');
    assert.strictEqual(aggregate.totalSubmissions > 0, true);
    assert.strictEqual(aggregate.thematicClusters.length > 0, true);
    assert.strictEqual(typeof aggregate.sentimentDistribution.positive, 'number');
  });

  it('8.4 Redacts Sinhala personal names, NICs, phones, emails, locations and organizations', () => {
    const siInput = 'මම කමල් පෙරේරා (ජා.හැ.අංකය: 851234567V, දුරකථනය: 0771234567, විද්‍යුත් තැපෑල: kamal.perera@gmail.com). මම පදිංචි මහනුවර දිස්ත්‍රික්කයේ ගන්නෝරුව ගමේ. ලංකා විදුලිබල මණ්ඩලය පිළිබඳ මෙම ප්‍රතිපත්තියට මම එකඟයි.';
    const scrubbed = AIWorkerService.scrubPII(siInput);

    assert.strictEqual(scrubbed.scrubbedText.includes('කමල් පෙරේරා'), false, 'Sinhala name must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_NAME]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('851234567V'), false, 'Sinhala NIC must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_NIC]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('0771234567'), false, 'Sinhala phone must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_PHONE]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('kamal.perera@gmail.com'), false, 'Sinhala email must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_EMAIL]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('මහනුවර'), false, 'Sinhala location must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('ලංකා විදුලිබල මණ්ඩලය'), false, 'Sinhala organization must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_ORGANIZATION]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_LOCATION]'), true);
  });

  it('8.5 Redacts Tamil personal names, modern 12-digit NICs, phones, emails and locations', () => {
    const taInput = 'நான் குமார் செல்வா (தேசிய அடையாள அட்டை: 199012345678, தொலைபேசி: +94 71 234 5678, மின்னஞ்சல்: kumar.selva@gmail.com). நான் வசிக்கும் இடம் யாழ்ப்பாணம் நல்லூர் கிராமம். இந்த கொள்கையை நான் முழுமையாக ஆதரிக்கிறேன்.';
    const scrubbed = AIWorkerService.scrubPII(taInput);

    assert.strictEqual(scrubbed.scrubbedText.includes('குமார் செல்வா'), false, 'Tamil name must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_NAME]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('199012345678'), false, 'Tamil 12-digit NIC must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_NIC]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('+94 71 234 5678'), false, 'Tamil phone must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_PHONE]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('kumar.selva@gmail.com'), false, 'Tamil email must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_EMAIL]'), true);
    assert.strictEqual(scrubbed.scrubbedText.includes('யாழ்ப்பாணம்'), false, 'Tamil location must be redacted');
    assert.strictEqual(scrubbed.scrubbedText.includes('[REDACTED_LOCATION]'), true);
  });

  it('8.6 Accurately computes sentiment for Sinhala and Tamil qualitative feedback', () => {
    const siPos = AIWorkerService.scrubPII('මෙම ඩිජිටල් ප්‍රජාතන්ත්‍රවාදී පද්ධතිය ඉතා විශිෂ්ටයි සහ අත්‍යවශ්‍යයි, මම සම්පූර්ණයෙන්ම එකඟයි.');
    assert.strictEqual(siPos.sentiment.score > 0, true);
    assert.strictEqual(['POSITIVE', 'VERY_POSITIVE'].includes(siPos.sentiment.label), true);

    const siNeg = AIWorkerService.scrubPII('මෙම ක්‍රියාමාර්ගය ඉතා හානිකරයි සහ අවදානම් සහගතයි, මම දැඩි ලෙස විරුද්ධයි.');
    assert.strictEqual(siNeg.sentiment.score < 0, true);
    assert.strictEqual(['NEGATIVE', 'VERY_NEGATIVE'].includes(siNeg.sentiment.label), true);

    const taPos = AIWorkerService.scrubPII('இந்த புதிய திட்டம் மிகவும் சிறப்பானது மற்றும் அவசியமானது, நான் முழுமையாக ஆதரிக்கிறேன்.');
    assert.strictEqual(taPos.sentiment.score > 0, true);
    assert.strictEqual(['POSITIVE', 'VERY_POSITIVE'].includes(taPos.sentiment.label), true);

    const taNeg = AIWorkerService.scrubPII('இந்த நடவடிக்கை மிகவும் ஆபத்தானது மற்றும் தீங்கானது, நான் முற்றிலுமாக எதிர்க்கிறேன்.');
    assert.strictEqual(taNeg.sentiment.score < 0, true);
    assert.strictEqual(['NEGATIVE', 'VERY_NEGATIVE'].includes(taNeg.sentiment.label), true);
  });

  // --------------------------------------------------------------------------
  // SUITE 9: 3-Tier Sovereign Citizen Verification & Anti-Spoofing Engine
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 9: 3-Tier Citizen Verification & Anti-Spoofing Engine');

  it('9.1 Decodes valid 9-digit old and 12-digit new Sri Lankan NICs', () => {
    // 851234567V -> Year 1985, Days: 123 (May 3), Male, Voter eligible
    const oldMale = decodeAndValidateSriLankanNIC('851234567V');
    assert.strictEqual(oldMale.isValid, true);
    assert.strictEqual(oldMale.format, 'OLD_9_DIGIT');
    assert.strictEqual(oldMale.birthYear, 1985);
    assert.strictEqual(oldMale.gender, 'MALE');
    assert.strictEqual(oldMale.isVoterEligible, true);
    assert.strictEqual(oldMale.calculatedDOB, '1985-05-02');

    // 199062345678 -> Year 1990, Days: 623 (Female: 623 - 500 = 123 -> May 2)
    const newFemale = decodeAndValidateSriLankanNIC('199062345678');
    assert.strictEqual(newFemale.isValid, true);
    assert.strictEqual(newFemale.format, 'NEW_12_DIGIT');
    assert.strictEqual(newFemale.birthYear, 1990);
    assert.strictEqual(newFemale.gender, 'FEMALE');
    assert.strictEqual(newFemale.calculatedDOB, '1990-05-02');
  });

  it('9.2 Mathematically rejects randomly fabricated/invalid NIC sequences', () => {
    // Day of year 999 is invalid (female max is 866, male max is 366)
    const invalidNIC = decodeAndValidateSriLankanNIC('909994567V');
    assert.strictEqual(invalidNIC.isValid, false);
    assert.strictEqual(invalidNIC.validationError.includes('invalid day-of-year sequence'), true);

    // Day of year 000 is invalid
    const zeroDays = decodeAndValidateSriLankanNIC('199000012345');
    assert.strictEqual(zeroDays.isValid, false);
  });

  it('9.3 Detects identity mismatches between claimed DOB/gender and encoded NIC', () => {
    // NIC encodes MALE born 1985, but user claims FEMALE born 1992
    const mismatch = verifyClaimedCitizenDetails({
      nicNumber: '851234567V',
      claimedDOB: '1992-05-03',
      claimedGender: 'FEMALE'
    });
    assert.strictEqual(mismatch.verified, false);
    assert.strictEqual(mismatch.reason.includes('Claimed gender'), true);

    // Correct details match
    const match = verifyClaimedCitizenDetails({
      nicNumber: '851234567V',
      claimedDOB: '1985-05-03',
      claimedGender: 'MALE'
    });
    assert.strictEqual(match.verified, true);
  });

  await itAsync('9.4 DRP e-ID Gateway verifies registry status and assigns electoral district', async () => {
    const drpResult = await drpGatewayService.verifyNICWithDRP('851234567V');
    assert.strictEqual(drpResult.verified, true);
    assert.strictEqual(drpResult.citizenStatus, 'ACTIVE_LIVING');
    assert.strictEqual(typeof drpResult.electoralDistrict, 'string');
    assert.strictEqual(drpResult.drpTransactionId.startsWith('DRP-LK-'), true);
  });

  await itAsync('9.5 TRCSL Mobile SIM OTP service dispatches, verifies, and produces blind hash', async () => {
    // Normalizes and dispatches OTP
    const dispatch = await mobileOTPService.dispatchOTP('0771234567');
    assert.strictEqual(dispatch.success, true);
    assert.strictEqual(typeof dispatch.otpReference, 'string');
    assert.strictEqual(typeof dispatch.demoOtpCode, 'string');
    assert.strictEqual(dispatch.mobileMasked, '+94 77 *** 4567');

    // Incorrect code fails
    const failResult = mobileOTPService.verifyOTP(dispatch.otpReference, '0771234567', '000000');
    assert.strictEqual(failResult.verified, false);

    // Correct code succeeds and produces blind index
    const verifyResult = mobileOTPService.verifyOTP(dispatch.otpReference, '0771234567', dispatch.demoOtpCode);
    assert.strictEqual(verifyResult.verified, true);
    assert.strictEqual(typeof verifyResult.mobileBlindHash, 'string');
    assert.strictEqual(verifyResult.mobileBlindHash.length, 64); // SHA-256 hex length
  });

  // --------------------------------------------------------------------------
  // Suite 10 — RFC 6238 TOTP Engine & Hardcoded Bypass Removal (Issue 1.3)
  // --------------------------------------------------------------------------
  it('10.1 computeTOTP generates a 6-digit string for the demo secret', () => {
    const DEMO_SECRET = 'JBSWY3DPEHPK3PXP';
    const counter = Math.floor(Date.now() / 1000 / 30);
    const code = computeTOTP(DEMO_SECRET, counter);
    assert.strictEqual(typeof code, 'string');
    assert.strictEqual(code.length, 6);
    assert.match(code, /^\d{6}$/);
  });

  it('10.2 verifyTOTP accepts the live code for the demo secret', () => {
    const DEMO_SECRET = 'JBSWY3DPEHPK3PXP';
    const counter = Math.floor(Date.now() / 1000 / 30);
    const liveCode = computeTOTP(DEMO_SECRET, counter);
    const result = verifyTOTP(DEMO_SECRET, liveCode, 1);
    assert.strictEqual(result, true, 'Live TOTP code must pass verifyTOTP');
  });

  it('10.3 verifyTOTP rejects the hardcoded "123456" bypass string', () => {
    // "123456" is the former hardcoded bypass value — it must NOT be accepted by
    // the real verifyTOTP engine unless it happens to be the live RFC 6238 code
    // at this exact moment (statistically ~1-in-1,000,000 chance; we guard against
    // that by also checking that computeTOTP produces something different).
    const DEMO_SECRET = 'JBSWY3DPEHPK3PXP';
    const counter = Math.floor(Date.now() / 1000 / 30);
    const liveCode = computeTOTP(DEMO_SECRET, counter);
    if (liveCode !== '123456') {
      // The normal case: static '123456' must be rejected
      const result = verifyTOTP(DEMO_SECRET, '123456', 1);
      assert.strictEqual(result, false, 'Hardcoded "123456" must be rejected by verifyTOTP when it is not the live code');
    }
    // If by chance liveCode === '123456', skip the rejection assertion (would be false negative)
  });

  it('10.4 verifyTOTP rejects tokens with wrong length or empty strings', () => {
    const DEMO_SECRET = 'JBSWY3DPEHPK3PXP';
    assert.strictEqual(verifyTOTP(DEMO_SECRET, ''), false, 'Empty string must be rejected');
    assert.strictEqual(verifyTOTP(DEMO_SECRET, '12345'), false, '5-digit code must be rejected');
    assert.strictEqual(verifyTOTP(DEMO_SECRET, '1234567'), false, '7-digit code must be rejected');
    assert.strictEqual(verifyTOTP(DEMO_SECRET, 'abcdef'), false, 'Non-numeric string must be rejected');
  });

  it('10.5 generateOtpauthUri produces a valid otpauth:// URI for the demo secret', () => {
    const DEMO_SECRET = 'JBSWY3DPEHPK3PXP';
    const uri = generateOtpauthUri('Admin', 'E-Lanka Democracy', DEMO_SECRET);
    assert.ok(uri.startsWith('otpauth://totp/'), 'URI must start with otpauth://totp/');
    assert.ok(uri.includes(DEMO_SECRET), 'URI must contain the secret');
    assert.ok(uri.includes('algorithm=SHA1'), 'URI must specify SHA1 algorithm');
    assert.ok(uri.includes('digits=6'), 'URI must specify 6 digits');
    assert.ok(uri.includes('period=30'), 'URI must specify 30-second period');
  });

  // --------------------------------------------------------------------------
  // SUITE 11: Priority 02 - Institutional Branding & Integrity
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 11: Priority 02 - Institutional Branding & Integrity');

  it('11.1 Issue 2.1: Enforces "Community Solutions Lanka (CSLK)" organization naming across platform', () => {
    const fs = require('fs');
    const path = require('path');

    // Check backend routes source file
    const routesContent = fs.readFileSync(path.join(__dirname, '../packages/backend/src/routes/public.routes.ts'), 'utf8');
    assert.ok(routesContent.includes('Community Solutions Lanka (CSLK)'), 'public.routes.ts must cite Community Solutions Lanka (CSLK)');
    assert.strictEqual(routesContent.includes('Centre for Society & Learning'), false, 'public.routes.ts must not contain obsolete name');

    // Check frontend footer source file
    const footerContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/components/Footer.tsx'), 'utf8');
    assert.ok(footerContent.includes('Community Solutions Lanka (CSLK)'), 'Footer must cite Community Solutions Lanka (CSLK)');
    assert.strictEqual(footerContent.includes('Centre for Society and Learning'), false, 'Footer must not contain obsolete name');

    // Check Privacy Policy and About views
    const privacyContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/views/PrivacyPolicyView.tsx'), 'utf8');
    assert.ok(privacyContent.includes('Community Solutions Lanka (CSLK)'), 'PrivacyPolicyView must cite Community Solutions Lanka (CSLK)');
    assert.strictEqual(privacyContent.includes('Centre for Society & Learning'), false, 'PrivacyPolicyView must not contain obsolete name');

    const aboutContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/views/AboutContactView.tsx'), 'utf8');
    assert.ok(aboutContent.includes('Community Solutions Lanka (CSLK)'), 'AboutContactView must cite Community Solutions Lanka (CSLK)');
    assert.strictEqual(aboutContent.includes('Centre for Society & Learning'), false, 'AboutContactView must not contain obsolete name');
  });

  it('11.2 Issue 2.2: Verifies single official course "Digital Democracy and Rights" (3 Hours, 3 modules, Youth Champions, direct LifterLMS link)', () => {
    const fs = require('fs');
    const path = require('path');

    // 1. Check backend routes
    const routesContent = fs.readFileSync(path.join(__dirname, '../packages/backend/src/routes/public.routes.ts'), 'utf8');
    assert.ok(routesContent.includes('Digital Democracy and Rights'), 'public.routes.ts must feature Digital Democracy and Rights');
    assert.ok(routesContent.includes('3 Hours'), 'public.routes.ts must specify 3 Hours duration');
    assert.ok(routesContent.includes('Module 1: Digital Democracy & Civic Literacy'), 'public.routes.ts must list Module 1');
    assert.ok(routesContent.includes('Module 2: Digital Safety, Online Safety Act 2024 & PDPA 2022'), 'public.routes.ts must list Module 2');
    assert.ok(routesContent.includes('Module 3: Practical Guide to E-Lanka'), 'public.routes.ts must list Module 3');
    assert.ok(routesContent.includes('Youth Champions'), 'public.routes.ts must highlight Youth Champions');
    assert.ok(routesContent.includes('https://www.cslk.org/courses/digital-democracy-and-rights'), 'public.routes.ts must link to official LifterLMS course');

    // 2. Check LMSAcademyView.tsx
    const academyContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/views/LMSAcademyView.tsx'), 'utf8');
    assert.ok(academyContent.includes('Digital Democracy and Rights'), 'LMSAcademyView must feature official course');
    assert.ok(academyContent.includes('3 Hours'), 'LMSAcademyView must state 3 Hours');
    assert.ok(academyContent.includes('Youth Champions'), 'LMSAcademyView must feature Youth Champions highlight box');
    assert.ok(academyContent.includes('Module 1: Digital Democracy & Civic Literacy'), 'LMSAcademyView must include Module 1');
    assert.ok(academyContent.includes('Module 2: Digital Safety, Online Safety Act 2024 & PDPA 2022'), 'LMSAcademyView must include Module 2 (OSA 2024)');
    assert.ok(academyContent.includes('Module 3: Practical Guide to E-Lanka'), 'LMSAcademyView must include Module 3');
    assert.ok(academyContent.includes('https://www.cslk.org/courses/digital-democracy-and-rights'), 'LMSAcademyView must link to direct course page');

    // 3. Check LMSCard.tsx
    const cardContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/components/LMSCard.tsx'), 'utf8');
    assert.ok(cardContent.includes('Digital Democracy and Rights'), 'LMSCard must default to Digital Democracy and Rights');
    assert.ok(cardContent.includes('3 Hours'), 'LMSCard must state 3 Hours');
    assert.ok(cardContent.includes('Youth Champions'), 'LMSCard must mention Youth Champions');
    assert.ok(cardContent.includes('https://www.cslk.org/courses/digital-democracy-and-rights'), 'LMSCard must link to direct course page');
  });

  it('11.3 Issue 2.3: Verifies no internal specification codes (EL-SPEC-2026-V3, Workstream 4, Section 3.4) exposed in frontend UI', () => {
    const fs = require('fs');
    const path = require('path');

    const filesToCheck = [
      '../packages/frontend/src/views/PublicPolicyHub.tsx',
      '../packages/frontend/src/components/Footer.tsx',
      '../packages/frontend/src/views/AdminModerationPanel.tsx',
      '../packages/frontend/src/views/PrivacyPolicyView.tsx',
      '../packages/frontend/src/views/LMSAcademyView.tsx'
    ];

    for (const relPath of filesToCheck) {
      const content = fs.readFileSync(path.join(__dirname, relPath), 'utf8');
      assert.strictEqual(content.includes('EL-SPEC-2026-V3'), false, `${relPath} must not contain EL-SPEC-2026-V3`);
      assert.strictEqual(content.includes('Workstream 4'), false, `${relPath} must not contain Workstream 4`);
      assert.strictEqual(content.includes('Workstream 6'), false, `${relPath} must not contain Workstream 6`);
      assert.strictEqual(content.includes('Section 3.4'), false, `${relPath} must not contain Section 3.4`);
    }
  });

  it('11.4 Issue 2.4: Verifies homepage metrics calculate dynamically from live database consultations and petition counts', () => {
    const fs = require('fs');
    const path = require('path');

    const hubContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/views/PublicPolicyHub.tsx'), 'utf8');

    // 1. Must calculate active consultations dynamically based on STAGE_3_ACTIVE_CONSULTATION
    assert.ok(hubContent.includes('policies.filter'), 'PublicPolicyHub must dynamically filter policies');
    assert.ok(hubContent.includes('PolicyLifecycleStage.STAGE_3_ACTIVE_CONSULTATION'), 'PublicPolicyHub must filter by STAGE_3_ACTIVE_CONSULTATION');
    assert.ok(hubContent.includes('activeConsultationsCount'), 'PublicPolicyHub must compute activeConsultationsCount');

    // 2. Must calculate total verified signatures dynamically from petitions
    assert.ok(hubContent.includes('totalVerifiedSignatures'), 'PublicPolicyHub must compute totalVerifiedSignatures');
    assert.ok(hubContent.includes('petitions.reduce'), 'PublicPolicyHub must sum currentSignatures from petitions');

    // 3. Must NOT hardcode static "4" or "11,310+" in the metrics JSX
    assert.strictEqual(hubContent.includes('>4</div>'), false, 'PublicPolicyHub must not hardcode static 4 active consultations');
    assert.strictEqual(hubContent.includes('>11,310+</div>'), false, 'PublicPolicyHub must not hardcode static 11,310+ signatures');
  });

  // --------------------------------------------------------------------------
  // SUITE 12: Priority 03 - Functional & Feature Gaps
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 12: Priority 03 - Functional & Feature Gaps');

  it('12.1 Issue 3.1: Enforces Sri Lankan date format (DD/MM/YYYY) in DOB inputs, parsing, and cross-validation', () => {
    const {
      formatSriLankanDate,
      parseBirthYearFromDOB,
      verifyClaimedCitizenDetails
    } = require('../packages/shared/dist');

    // 1. Verify formatSriLankanDate transforms ISO (YYYY-MM-DD) to DD/MM/YYYY
    assert.strictEqual(formatSriLankanDate('1990-05-24'), '24/05/1990', 'Should format YYYY-MM-DD to DD/MM/YYYY');
    assert.strictEqual(formatSriLankanDate('2001-12-05'), '05/12/2001', 'Should pad single digits in DD/MM/YYYY');
    assert.strictEqual(formatSriLankanDate('24/05/1990'), '24/05/1990', 'Should preserve existing DD/MM/YYYY');

    // 2. Verify parseBirthYearFromDOB handles DD/MM/YYYY, YYYY/MM/DD, and YYYY-MM-DD
    assert.strictEqual(parseBirthYearFromDOB('24/05/1990'), 1990, 'Should extract year from DD/MM/YYYY');
    assert.strictEqual(parseBirthYearFromDOB('05-12-2001'), 2001, 'Should extract year from DD-MM-YYYY');
    assert.strictEqual(parseBirthYearFromDOB('1985-08-14'), 1985, 'Should extract year from YYYY-MM-DD');

    // 3. Verify cross-validation with Sri Lankan format
    // 901451234V is a 1990 male NIC
    const validMatch = verifyClaimedCitizenDetails({
      nicNumber: '901451234V',
      claimedDOB: '24/05/1990',
      claimedGender: 'MALE'
    });
    assert.strictEqual(validMatch.verified, true, 'Claimed DOB in DD/MM/YYYY format must verify successfully against 1990 NIC');

    const invalidMatch = verifyClaimedCitizenDetails({
      nicNumber: '901451234V',
      claimedDOB: '24/05/1985',
      claimedGender: 'MALE'
    });
    assert.strictEqual(invalidMatch.verified, false, 'Mismatched birth year in DD/MM/YYYY format must be rejected');
    assert.ok(invalidMatch.reason.includes('Claimed birth year (1985) does not match'), 'Reason must specify birth year mismatch');

    // 4. Verify PetitionSignModal uses DD/MM/YYYY format
    const fs = require('fs');
    const path = require('path');
    const modalContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/components/PetitionSignModal.tsx'), 'utf8');
    assert.ok(modalContent.includes('DD/MM/YYYY'), 'PetitionSignModal must display DD/MM/YYYY format');
    assert.ok(modalContent.includes('formatSriLankanDate'), 'PetitionSignModal must use formatSriLankanDate');
    assert.strictEqual(modalContent.includes('type="date"'), false, 'PetitionSignModal must not use raw browser type="date" which forces US mm/dd/yyyy');
  });

  it('12.2 Issue 3.2: AI Worker Integration - Policy Brief Export (PDF/Word), E-Petitions Support & HITL Workflow', () => {
    const fs = require('fs');
    const path = require('path');
    const panelPath = path.join(__dirname, '../packages/frontend/src/views/AdminModerationPanel.tsx');
    const panelContent = fs.readFileSync(panelPath, 'utf8');

    // 1. Verify E-Petitions are supported alongside Policy Consultations in AI target selector
    assert.ok(panelContent.includes('label="✍️ Verified Citizen E-Petitions"'), 'Target dropdown must include E-Petitions optgroup');
    assert.ok(panelContent.includes('label="🏛️ National Policy Consultations"'), 'Target dropdown must include Policy Consultations optgroup');
    assert.ok(panelContent.includes('value="pet:pet_01"'), 'Dropdown must list pet:pet_01');
    assert.ok(panelContent.includes('Statutory Ban on Single-Use Microplastics in Consumer Packaging'), 'Dropdown must show microplastics petition title');

    // 2. Verify display of Last AI Execution Timestamp (+05:30) and Result Summary
    assert.ok(panelContent.includes('Last AI Execution Timestamp (+05:30):'), 'Must display Sri Lankan timestamp for AI execution');
    assert.ok(panelContent.includes('formatSriLankanTimestamp'), 'Must format timestamp with formatSriLankanTimestamp');
    assert.ok(panelContent.includes('Result Summary:'), 'Must display execution result summary');
    assert.ok(panelContent.includes('totalSubmissions'), 'Must display total submissions analyzed');

    // 3. Verify Human-in-the-Loop (HITL) review card & admin approval
    assert.ok(panelContent.includes('Human-in-the-Loop (HITL) Review'), 'Must include mandatory HITL review badge');
    assert.ok(panelContent.includes('APPROVED & PUBLISHED (HITL VERIFIED)'), 'Must include HITL verified state');
    assert.ok(panelContent.includes('AI Executive Summary & Recommendations (Human-Editable Before Publication):'), 'Must include editable summary textarea');
    assert.ok(panelContent.includes('Approve & Publish to Public Hub'), 'Must have admin approval button');
    assert.ok(panelContent.includes('setIsApprovedByAdmin'), 'Must update admin approval state');

    // 4. Verify Export Policy Brief buttons (PDF/Print and Word .doc)
    assert.ok(panelContent.includes('handleExportPolicyBriefPDF'), 'Must have handleExportPolicyBriefPDF function');
    assert.ok(panelContent.includes('handleExportPolicyBriefWord'), 'Must have handleExportPolicyBriefWord function');
    assert.ok(panelContent.includes('Export Policy Brief (PDF / Print)'), 'Must render PDF export button');
    assert.ok(panelContent.includes('Export Policy Brief (Word / .doc)'), 'Must render Word export button');

    // 5. Verify the 6 Statutory State Institutions in formal submission block
    const stateInstitutions = [
      'Parliament Secretariat & Sectoral Oversight Committee on Governance & Digital Rights',
      'Presidential Secretariat',
      'Ministry of Technology & Digital Economy of Sri Lanka',
      'Ministry of Public Administration, Provincial Councils and Local Government',
      'Data Protection Authority of Sri Lanka (DPA)',
      'National Youth Services Council (NYSC)'
    ];
    for (const inst of stateInstitutions) {
      assert.ok(panelContent.includes(inst), `Policy Brief must be formally addressed to "${inst}"`);
    }

    // 6. Verify api.ts triggerAISync supports petitions and returns rich clusters
    const apiPath = path.join(__dirname, '../packages/frontend/src/services/api.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    assert.ok(apiContent.includes('isPetition'), 'api.triggerAISync must distinguish between policies and petitions');
    assert.ok(apiContent.includes('Environmental & Ecological Urgency across Coastal Districts'), 'api.triggerAISync must provide petition clusters');
  });

  it('12.3 Issue 3.3: Offline Data Collection Engine for Field Agents (Youth Champions / FIELD_CHAMPION Role)', () => {
    const fs = require('fs');
    const path = require('path');
    const store = DatabaseStore.getInstance();
    const petitionId = 'e0000000-0000-0000-0000-000000000001';
    const initialSignatures = store.getPetitionById(petitionId).currentSignatures;

    // 1. Verify DatabaseStore.batchSignPetitions handles rural batch collection with atomic increments
    const batchResult = store.batchSignPetitions([
      {
        petitionId,
        nicNumber: '199855501111',
        district: 'Nuwara Eliya',
        collectorId: 'YC-2026-001'
      },
      {
        petitionId,
        nicNumber: '199855502222',
        district: 'Nuwara Eliya',
        collectorId: 'YC-2026-001'
      },
      {
        petitionId,
        nicNumber: '199855501111', // Duplicate in batch
        district: 'Nuwara Eliya',
        collectorId: 'YC-2026-001'
      }
    ]);

    assert.strictEqual(batchResult.totalProcessed, 3, 'Must process all 3 batch items');
    assert.strictEqual(batchResult.syncedCount, 2, 'Must sync 2 valid unique signatures');
    assert.strictEqual(batchResult.skippedCount, 1, 'Must skip 1 duplicate signature');
    assert.strictEqual(store.getPetitionById(petitionId).currentSignatures, initialSignatures + 2, 'Petition count must increment by exactly 2');

    // 2. Verify FIELD_CHAMPION is defined in shared UserRole
    const sharedTypesPath = path.join(__dirname, '../packages/shared/src/types/user.ts');
    const sharedContent = fs.readFileSync(sharedTypesPath, 'utf8');
    assert.ok(sharedContent.includes("'FIELD_CHAMPION'"), "UserRole must include 'FIELD_CHAMPION'");
    assert.ok(sharedContent.includes('QueuedOfflineSignature'), 'Must define QueuedOfflineSignature interface');
    assert.ok(sharedContent.includes('QueuedOfflineSurvey'), 'Must define QueuedOfflineSurvey interface');

    // 3. Verify backend routes support batch-sync and Youth Champion login
    const petitionRoutesPath = path.join(__dirname, '../packages/backend/src/routes/petition.routes.ts');
    const petitionRoutesContent = fs.readFileSync(petitionRoutesPath, 'utf8');
    assert.ok(petitionRoutesContent.includes("petitionRouter.post('/batch-sync'"), 'Petition routes must support POST /batch-sync');
    assert.ok(petitionRoutesContent.includes("actorRole: 'FIELD_CHAMPION'"), 'Petition batch sync must log FIELD_CHAMPION audit event');

    const authRoutesPath = path.join(__dirname, '../packages/backend/src/routes/auth.routes.ts');
    const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
    assert.ok(authRoutesContent.includes("authRouter.post('/field-champion-login'"), 'Auth routes must support POST /field-champion-login');
    assert.ok(authRoutesContent.includes('YC-2026-'), 'Auth routes must validate Youth Champion ID format');

    // 4. Verify FieldCollectorView UI exists with rapid collectors and checkpoint defense
    const collectorViewPath = path.join(__dirname, '../packages/frontend/src/views/FieldCollectorView.tsx');
    const collectorViewContent = fs.readFileSync(collectorViewPath, 'utf8');
    assert.ok(collectorViewContent.includes('Rapid Citizen Petition Collector'), 'Must render rapid petition collector form');
    assert.ok(collectorViewContent.includes('Rapid Policy Survey Collector'), 'Must render rapid survey collector form');
    assert.ok(collectorViewContent.includes('Checkpoint Seizure Safeguard'), 'Must render DAL checkpoint seizure safeguard');
    assert.ok(collectorViewContent.includes('Save Signature & Next Citizen'), 'Must include rapid sequential submission action');

    // 5. Verify App.tsx routing and navigation integration
    const appPath = path.join(__dirname, '../packages/frontend/src/App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.ok(appContent.includes('path="/collector"'), 'App.tsx must route /collector to FieldCollectorView');

    const academyPath = path.join(__dirname, '../packages/frontend/src/views/LMSAcademyView.tsx');
    const academyContent = fs.readFileSync(academyPath, 'utf8');
    assert.ok(academyContent.includes('Launch Youth Champion Field Collector Mode'), 'LMS Academy must link to field collector mode');
  });

  it('12.4 Issue 3.4: Public Visualization of AI Insights - Infographics, Sentiment Splits & Thematic Clusters', () => {
    const fs = require('fs');
    const path = require('path');
    const detailViewPath = path.join(__dirname, '../packages/frontend/src/views/PolicyDetailView.tsx');
    const detailContent = fs.readFileSync(detailViewPath, 'utf8');

    // 1. Verify AI Public Consensus & Executive Synthesis Infographic Box
    assert.ok(detailContent.includes('AI Public Consensus & Executive Synthesis'), 'Must display AI Public Consensus executive box');
    assert.ok(detailContent.includes('Statutory Policy Panel Verified'), 'Must display statutory panel verification badge');
    assert.ok(detailContent.includes('getAiExecutiveSummary'), 'Must include tailored trilingual AI executive summary function');

    // 2. Verify Sentiment Splits Infographic with multi-segment bar and 3 metric cards
    assert.ok(detailContent.includes('Public Sentiment Splits & Citizen Stance Infographic'), 'Must display Sentiment Splits infographic section');
    assert.ok(detailContent.includes('Strong Civic Support'), 'Must render Strong Civic Support card');
    assert.ok(detailContent.includes('Deliberative / Inquiries'), 'Must render Deliberative / Inquiries card');
    assert.ok(detailContent.includes('Critical / Amendments'), 'Must render Critical / Amendments card');

    // 3. Verify view toggle between Infographic Bar & Cards and Interactive Charts
    assert.ok(detailContent.includes('Infographic Bar & Cards'), 'Must provide Infographic view mode button');
    assert.ok(detailContent.includes('Interactive Charts'), 'Must provide Interactive Charts view mode button');

    // 4. Verify Thematic Clusters with visual weight progress bar & PDPA protection seal
    assert.ok(detailContent.includes('Core Public Priorities'), 'Must display thematic cluster priorities');
    assert.ok(detailContent.includes('PII-Scrubbed Citizen Excerpt (PDPA Protected)'), 'Must include PDPA protected citizen excerpt badge');
    assert.ok(detailContent.includes('Key Citizen Concerns'), 'Must display key citizen concerns list');

    // 5. Verify citizen-friendly transparency label
    assert.ok(detailContent.includes('Public AI Transparency • Zero Personal Identifiers Stored'), 'Must display zero personal data assurance label');
  });

  it('12.5 Issue 3.5: Live Signature Counter & Plain PDPA Consent Checkbox', () => {
    const fs = require('fs');
    const path = require('path');

    // 1. Verify plain language PDPA consent prompt across all 3 official languages
    const enLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/en.json'), 'utf8'));
    const siLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/si.json'), 'utf8'));
    const taLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/ta.json'), 'utf8'));

    assert.strictEqual(
      enLoc.petitions.consentCheckbox,
      'Your personal data is 100% confidential and will not be made public.',
      'English consent text must match exact required plain-language prompt'
    );
    assert.strictEqual(
      siLoc.petitions.consentCheckbox,
      'ඔබගේ පෞද්ගලික දත්ත 100% රහසිගත වන අතර ප්‍රසිද්ධියට පත් නොකෙරේ.',
      'Sinhala consent text must match exact plain-language prompt'
    );
    assert.strictEqual(
      taLoc.petitions.consentCheckbox,
      'உங்கள் தனிப்பட்ட தரவு 100% ரகசியமானது மற்றும் பகிரங்கப்படுத்தப்படாது.',
      'Tamil consent text must match exact plain-language prompt'
    );

    // 2. Verify PetitionSignModal displays LiveCounterWidget on success
    const modalPath = path.join(__dirname, '../packages/frontend/src/components/PetitionSignModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf8');
    assert.ok(modalContent.includes('LiveCounterWidget'), 'PetitionSignModal must import LiveCounterWidget');
    assert.ok(modalContent.includes('currentSignatures={latestCount}'), 'PetitionSignModal must pass latestCount to LiveCounterWidget');
    assert.ok(modalContent.includes('setLatestCount(res.currentSignatures)'), 'Must update latestCount immediately on sign response');

    // 3. Verify EPetitionsView immediately updates state on signature success
    const petitionsViewPath = path.join(__dirname, '../packages/frontend/src/views/EPetitionsView.tsx');
    const petitionsViewContent = fs.readFileSync(petitionsViewPath, 'utf8');
    assert.ok(petitionsViewContent.includes('currentSignatures: newCount'), 'EPetitionsView must update currentSignatures to newCount');
    assert.ok(petitionsViewContent.includes('handleSignatureSuccess'), 'EPetitionsView must handle signature success callback');
  });

  // ==========================================================================
  // 13. Priority 04: UI/UX & Copywriting Improvements
  // ==========================================================================
  console.log('\n--- Section 13: Priority 04: UI/UX & Copywriting Improvements ---');

  it('13.1 Issue 4.1: Cluttered Navigation Bar - remove Moderation Gate 2FA, shorten Academy, enforce single-row CSS', () => {
    // 1. Verify Navbar.tsx navLinks does not expose /admin or 2FA
    const navbarPath = path.join(__dirname, '../packages/frontend/src/components/Navbar.tsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    
    // Check navLinks array structure
    const navLinksSection = navbarContent.substring(
      navbarContent.indexOf('const navLinks = ['),
      navbarContent.indexOf('];', navbarContent.indexOf('const navLinks = [')) + 2
    );
    assert.ok(!navLinksSection.includes('/admin'), 'Public navLinks must not contain /admin');
    assert.ok(!navLinksSection.includes('2FA'), 'Public navLinks must not contain 2FA badge');

    // 2. Verify whitespace-nowrap and flex-nowrap to keep menu items on a single row
    assert.ok(navbarContent.includes('whitespace-nowrap'), 'Navbar must include whitespace-nowrap');
    assert.ok(navbarContent.includes('flex-nowrap'), 'Navbar must include flex-nowrap to prevent row wrapping');

    // 3. Verify shortened Academy labels in trilingual locales
    const enLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/en.json'), 'utf8'));
    const siLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/si.json'), 'utf8'));
    const taLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/ta.json'), 'utf8'));

    assert.strictEqual(enLoc.nav.lms, 'Academy', 'English nav.lms must be shortened to Academy');
    assert.strictEqual(siLoc.nav.lms, 'ඇකඩමිය', 'Sinhala nav.lms must be shortened to ඇකඩමිය');
    assert.strictEqual(taLoc.nav.lms, 'அகாடமி', 'Tamil nav.lms must be shortened to அகாடமி');

    // 4. Verify Footer retains subtle link to Moderator Portal
    const footerPath = path.join(__dirname, '../packages/frontend/src/components/Footer.tsx');
    const footerContent = fs.readFileSync(footerPath, 'utf8');
    assert.ok(footerContent.includes('/admin/login'), 'Footer must provide access to /admin/login for moderators');
  });

  it('13.2 Issue 4.2: Missing Master Narrative & Above-the-Fold CTAs in Policy Hub Hero Section', () => {
    // 1. Verify Master Narrative headline in trilingual translations
    const enLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/en.json'), 'utf8'));
    const siLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/si.json'), 'utf8'));
    const taLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/ta.json'), 'utf8'));

    assert.strictEqual(
      enLoc.hero.title,
      'E-Lanka — Beyond Comments: Turn Your Voice into National Policy',
      'English hero title must match exact Master Campaign Narrative'
    );
    assert.strictEqual(enLoc.hero.signPetitionCta, 'Sign an E-Petition', 'English CTA must match Sign an E-Petition');
    assert.strictEqual(enLoc.hero.joinConsultationCta, 'Join a Consultation', 'English CTA must match Join a Consultation');

    assert.ok(siLoc.hero.title.includes('හුදු අදහස්වලින් ඔබ්බට'), 'Sinhala hero title must reflect Master Campaign Narrative');
    assert.strictEqual(siLoc.hero.signPetitionCta, 'ඊ-පෙත්සමක් අත්සන් කරන්න', 'Sinhala CTA must match Sign an E-Petition');
    assert.strictEqual(siLoc.hero.joinConsultationCta, 'ප්‍රතිපත්ති සාකච්ඡාවකට එක්වන්න', 'Sinhala CTA must match Join a Consultation');

    assert.ok(taLoc.hero.title.includes('வெறும் கருத்துக்களுக்கு அப்பால்'), 'Tamil hero title must reflect Master Campaign Narrative');
    assert.strictEqual(taLoc.hero.signPetitionCta, 'மின்-மனுவில் கையொப்பமிடுங்கள்', 'Tamil CTA must match Sign an E-Petition');
    assert.strictEqual(taLoc.hero.joinConsultationCta, 'கொள்கை ஆலோசனையில் இணையுங்கள்', 'Tamil CTA must match Join a Consultation');

    // 2. Verify PublicPolicyHub.tsx has both CTAs above the fold
    const hubPath = path.join(__dirname, '../packages/frontend/src/views/PublicPolicyHub.tsx');
    const hubContent = fs.readFileSync(hubPath, 'utf8');
    assert.ok(hubContent.includes('to="/petitions"'), 'PublicPolicyHub hero must link to /petitions');
    assert.ok(hubContent.includes("t('hero.signPetitionCta')"), 'Hero must render signPetitionCta button');
    assert.ok(hubContent.includes("t('hero.joinConsultationCta')"), 'Hero must render joinConsultationCta button');
    assert.ok(hubContent.includes('id="consultations"'), 'PublicPolicyHub must have #consultations target section');
  });

  it('13.3 Issue 4.3: Overly Technical & Legal Jargon Replacement with Plain Language Assurances', () => {
    const enLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/en.json'), 'utf8'));
    const siLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/si.json'), 'utf8'));
    const taLoc = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/frontend/src/i18n/locales/ta.json'), 'utf8'));

    // 1. Claimed Gender -> Gender
    assert.strictEqual(enLoc.petitions.genderLabel, 'Gender', 'Claimed Gender must be replaced by plain Gender');
    assert.ok(!enLoc.petitions.genderLabel.includes('Claimed'), 'No Claimed prefix allowed in gender label');

    // 2. Privacy-Preserving Citizen Tracker -> My Citizen Dashboard
    assert.strictEqual(enLoc.nav.dashboard, 'My Citizen Dashboard', 'nav.dashboard must be My Citizen Dashboard');
    assert.strictEqual(enLoc.dashboard.title, 'My Citizen Dashboard', 'dashboard.title must be My Citizen Dashboard');
    assert.strictEqual(siLoc.nav.dashboard, 'මගේ පුරවැසි පුවරුව', 'Sinhala nav.dashboard must be My Citizen Dashboard');
    assert.strictEqual(siLoc.dashboard.title, 'මගේ පුරවැසි පුවරුව', 'Sinhala dashboard.title must be My Citizen Dashboard');
    assert.strictEqual(taLoc.nav.dashboard, 'எனது குடிமக்கள் பலகை', 'Tamil nav.dashboard must be My Citizen Dashboard');
    assert.strictEqual(taLoc.dashboard.title, 'எனது குடிமக்கள் பலகை', 'Tamil dashboard.title must be My Citizen Dashboard');

    // 3. EXERCISE RIGHT TO ERASURE -> Delete My Account & Data
    assert.strictEqual(enLoc.dashboard.erasureBtn, 'Delete My Account & Data', 'Erasure button must be plain Delete My Account & Data');
    assert.strictEqual(siLoc.dashboard.erasureBtn, 'මගේ ගිණුම සහ දත්ත මකාදමන්න', 'Sinhala erasure button must be plain language');
    assert.strictEqual(taLoc.dashboard.erasureBtn, 'எனது கணக்கு மற்றும் தரவை நீக்கு', 'Tamil erasure button must be plain language');

    // 4. Plain assurances on public pages
    assert.strictEqual(enLoc.app.encryptionBadge, 'Your Identity & Signature Are 100% Secure', 'Header badge must be plain security assurance');
    assert.strictEqual(siLoc.app.encryptionBadge, 'ඔබගේ අනන්‍යතාව සහ අත්සන 100% ක් සුරක්ෂිතයි', 'Sinhala header badge must be plain security assurance');
    assert.strictEqual(taLoc.app.encryptionBadge, 'உங்கள் அடையாளம் மற்றும் கையொப்பம் 100% பாதுகாப்பானது', 'Tamil header badge must be plain security assurance');

    // 5. Verify UI files replaced technical jargon with plain assurances
    const footerContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/components/Footer.tsx'), 'utf8');
    assert.ok(!footerContent.includes('Zero-PHP Engine'), 'Footer must not contain Zero-PHP Engine');
    assert.ok(footerContent.includes('Sovereign Civic Platform • Verified & Secure'), 'Footer must display verified civic platform badge');
    assert.ok(footerContent.includes('Your signature and identity are 100% secure'), 'Footer must give plain assurance');

    const petitionsContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/views/EPetitionsView.tsx'), 'utf8');
    assert.ok(!petitionsContent.includes('(Section 3.2)'), 'EPetitionsView must not display Section 3.2 code');
    assert.ok(petitionsContent.includes('Your signature and identity are 100% secure and confidential'), 'EPetitionsView must give plain assurance');

    const dashboardContent = fs.readFileSync(path.join(__dirname, '../packages/frontend/src/views/CitizenDashboard.tsx'), 'utf8');
    assert.ok(!dashboardContent.includes('Section 3.3'), 'CitizenDashboard must not display Section 3.3 code');
    assert.ok(dashboardContent.includes('My Citizen Dashboard'), 'CitizenDashboard must display My Citizen Dashboard');
  });

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`🏁 TEST EXECUTION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite();

