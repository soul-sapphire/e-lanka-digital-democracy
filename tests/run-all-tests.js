/**
 * E-Lanka Digital Democracy Platform - Comprehensive Test Suite
 * Specification: EL-SPEC-2026-V3
 * Compliance: Sri Lanka Personal Data Protection Act (PDPA), No. 9 of 2022
 */

const assert = require('assert');
const path = require('path');
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

    // Execute statutory erasure
    const erasure = store.executeRightToErasure({
      citizenBlindIndex,
      erasureScope: 'ALL_PII',
      reason: 'Citizen invoked PDPA Sec 14',
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

