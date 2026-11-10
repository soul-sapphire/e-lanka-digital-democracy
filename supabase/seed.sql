-- ============================================================================
-- E-Lanka Digital Democracy Platform - Seed Data
-- ============================================================================

-- 1. Default Admin / Moderator Profiles
INSERT INTO profiles (id, role, nic_blind_index, email_blind_index, anonymized_alias, district, is_verified_citizen, totp_enabled)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'PANEL_MODERATOR', 'blind_mod_001_hash', 'blind_mod_email_001', 'Panel-Lead-Dr-Fernando', 'Colombo', TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000002', 'POLICY_ADMIN', 'blind_adm_002_hash', 'blind_adm_email_002', 'Policy-Admin-Perera', 'Kandy', TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000003', 'SYSTEM_AUDITOR', 'blind_aud_003_hash', 'blind_aud_email_003', 'PDPA-Auditor-Silva', 'Galle', TRUE, TRUE),
  ('c0000000-0000-0000-0000-000000000001', 'CITIZEN', 'blind_cit_001_hash', 'blind_cit_email_001', 'Citizen-Western-9421', 'Colombo', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Policy Consultations spanning stages
INSERT INTO policies (
  id, code,
  title_en, title_si, title_ta,
  summary_en, summary_si, summary_ta,
  description_en, description_si, description_ta,
  category, stage, target_ministry, author_agency, submission_count, is_publicly_visible, moderator_panel_notes
)
VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'EL-POL-2026-001',
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
  'Awaiting initial review by Expert Panel.'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Petitions
INSERT INTO petitions (
  id, code,
  title_en, title_si, title_ta,
  objective_en, objective_si, objective_ta,
  target_authority, category, required_signatures, current_signatures, status, deadline
)
VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'PET-2026-012',
  'Mandate Open Fiber Access & Universal High-Speed Broadband across Rural Schools',
  'ග්‍රාමීය පාසල් පුරා විවෘත ෆයිබර් ප්‍රවේශය සහ අධිවේගී බ්‍රෝඩ්බෑන්ඩ් අනිවාර්ය කිරීම',
  'கிராமப்புறப் பள்ளிகள் முழுவதும் திறந்த ஃபைபர் அணுகல் மற்றும் அதிவேக பிராட்பேண்டை கட்டாயமாக்குங்கள்',
  'Require telecommunication operators to offer subsidized 100Mbps dedicated fiber connections to all 10,155 government schools in Sri Lanka.',
  'ශ්‍රී ලංකාවේ සියලුම රජයේ පාසල් 10,155 සඳහාම සහනාධාර සහිත 100Mbps ෆයිබර් සම්බන්ධතා ලබා දීමට විදුලි සංදේශ සමාගම්වලට නියම කිරීම.',
  'இலங்கையிலுள்ள அனைத்து 10,155 அரச பாடசாலைகளுக்கும் மானிய விலையில் 100Mbps ஃபைபர் இணைப்புகளை வழங்குமாறு தொலைத்தொடர்பு நிறுவனங்களைக் கோருதல்.',
  'Telecommunications Regulatory Commission of Sri Lanka (TRCSL)',
  'EDUCATION_YOUTH',
  10000,
  7420,
  'ACTIVE',
  NOW() + INTERVAL '45 days'
),
(
  'e0000000-0000-0000-0000-000000000002',
  'PET-2026-018',
  'Statutory Ban on Single-Use Non-Biodegradable Polythene in Coastal Sanctuaries',
  'වෙරළබඩ අභයභූමිවල තනි භාවිත නොදිරන පොලිතීන් භාවිතය නීතියෙන් තහනම් කිරීම',
  'கடலோர சரணாலயங்களில் ஒருமுறை பயன்படுத்தும் மக்கும் தன்மையற்ற பொலித்தீனுக்கு சட்டப்பூர்வ தடை',
  'Establish zero-plastic zones across coastal reserves from Mirissa to Trincomalee to protect marine biodiversity and local fishery livelihoods.',
  'සමුද්‍ර ජෛව විවිධත්වය සහ ධීවර ජීවනෝපාය ආරක්ෂා කිරීම සඳහා මිරිස්සේ සිට ත්‍රිකුණාමලය දක්වා වෙරළබඩ කලාපවල ප්ලාස්ටික් රහිත කලාප ස්ථාපිත කිරීම.',
  'கடல் பல்லுயிர் மற்றும் மீனவ வாழ்வாதாரங்களைப் பாதுகாக்க மிரிஸ்ஸ முதல் திருகோணமலை வரையிலான கடலோரப் பகுதிகளில் பிளாஸ்டிக் இல்லாத மண்டலங்களை நிறுவுதல்.',
  'Central Environmental Authority (CEA)',
  'ENVIRONMENTAL_SUSTAINABILITY',
  5000,
  3890,
  'ACTIVE',
  NOW() + INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

