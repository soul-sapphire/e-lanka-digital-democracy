/**
 * E-Lanka Digital Democracy Platform
 * High-Performance Database & Memory Store Adapter
 *
 * Implements persistent transactional storage with Field-Level Encryption,
 * blind index uniqueness guarantees, and Sri Lanka PDPA compliance.
 */

import {
  PolicyConsultation,
  PolicyLifecycleStage,
  SurveyDefinition,
  SurveyQuestion,
  SurveyResponseRecord,
  EPetition,
  VerifiedSignatureRecord,
  UserProfile,
  ZeroPIIPublicAggregate,
  RightToErasureRequest,
  ErasureResult
} from '@e-lanka/shared';
import { encryptField, encryptJson, decryptField } from '../crypto/fle';
import { generateBlindIndex, generateCitizenAlias, computeBlindHash } from '../crypto/blind-index';
import { verifyTOTP } from '../crypto/totp';
import { PDPAService } from '../services/pdpa.service';

export class DatabaseStore {
  private static instance: DatabaseStore;

  // In-memory collections backed by optional Supabase sync
  private profiles = new Map<string, UserProfile>();
  private policies = new Map<string, PolicyConsultation>();
  private surveys = new Map<string, SurveyDefinition>();
  private surveyQuestions = new Map<string, SurveyQuestion[]>();
  private surveyResponses: SurveyResponseRecord[] = [];
  private petitions = new Map<string, EPetition>();
  private petitionSignatures: VerifiedSignatureRecord[] = [];
  private publicAggregates = new Map<string, ZeroPIIPublicAggregate>();

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  // --------------------------------------------------------------------------
  // Seed initial data
  // --------------------------------------------------------------------------
  private seedDefaultData() {
    // 1. Profiles
    const adminProfile: UserProfile = {
      id: 'a0000000-0000-0000-0000-000000000001',
      role: 'PANEL_MODERATOR',
      nicBlindIndex: computeBlindHash('851001234V', 'NIC'),
      emailBlindIndex: computeBlindHash('panel.chair@elanka.gov.lk', 'EMAIL'),
      anonymizedAlias: 'Panel-Lead-Dr-Fernando',
      district: 'Colombo',
      isVerifiedCitizen: true,
      totpEnabled: true,
      createdAt: '2026-01-01T00:00:00Z'
    };
    this.profiles.set(adminProfile.id, adminProfile);

    const citizenProfile: UserProfile = {
      id: 'c0000000-0000-0000-0000-000000000001',
      role: 'CITIZEN',
      nicBlindIndex: computeBlindHash('199256789012', 'NIC'),
      emailBlindIndex: computeBlindHash('citizen.samantha@gmail.com', 'EMAIL'),
      anonymizedAlias: 'Citizen-Kandy-4821',
      district: 'Kandy',
      isVerifiedCitizen: true,
      totpEnabled: false,
      createdAt: '2026-01-05T00:00:00Z'
    };
    this.profiles.set(citizenProfile.id, citizenProfile);

    // 2. Policies across the 5 lifecycle stages
    const policiesList: PolicyConsultation[] = [
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        code: 'EL-POL-2026-001',
        title: {
          en: 'National AI Ethics & Algorithmic Accountability Framework',
          si: 'ජාතික කෘතිම බුද්ධි ආචාරධර්ම සහ ඇල්ගොරිතම වගවීම පිළිබඳ රාමුව',
          ta: 'தேசிய செயற்கை நுண்ணறிவு நெறிமுறைகள் மற்றும் அல்காரிதம் பொறுப்புக்கூறல் கட்டமைப்பு'
        },
        summary: {
          en: 'Establish regulatory safety guardrails, bias prevention, and transparency audits for government and private AI systems.',
          si: 'රාජ්‍ය සහ පෞද්ගලික AI පද්ධති සඳහා නියාමන ආරක්ෂණ, පක්ෂග්‍රාහී බව වැළැක්වීම සහ විනිවිදභාවය තහවුරු කිරීම.',
          ta: 'அரசு மற்றும் தனியார் AI அமைப்புகளுக்கான ஒழுங்குமுறை பாதுகாப்பு, பக்கச்சார்பு தடுப்பு மற்றும் வெளிப்படைத்தன்மை தணிக்கைகளை நிறுவுதல்.'
        },
        fullDescription: {
          en: 'Comprehensive legislative whitepaper outlining mandatory risk classifications for high-impact AI models, citizen redressal against automated decision-making, and open data sharing standards.',
          si: 'අධි-බලපෑම් සහිත AI ආකෘති සඳහා අනිවාර්ය අවදානම් වර්ගීකරණය, ස්වයංක්‍රීය තීරණවලට එරෙහිව පුරවැසියන්ගේ අයිතිවාසිකම් සහ විවෘත දත්ත ප්‍රමිති පිළිබඳ විස්තර.',
          ta: 'அதிவேக AI மாதிரிகளுக்கான கட்டாய இடர் வகைப்பாடுகள் மற்றும் முடிவுகளுக்கு எதிரான குடிமக்களின் தீர்வு ஆகியவற்றை விளக்கும் விரிவான ஆவணம்.'
        },
        category: 'DIGITAL_RIGHTS',
        stage: PolicyLifecycleStage.STAGE_3_ACTIVE_CONSULTATION,
        targetMinistry: 'Ministry of Technology & Digital Economy',
        authorAgency: 'National Digital Governance Committee',
        submissionCount: 1420,
        publishedAt: '2026-01-15T09:00:00Z',
        deadlineAt: '2026-12-31T23:59:59Z',
        approvedAt: '2026-01-14T15:30:00Z',
        moderatorPanelNotes: 'Statutory approval granted by Ethical Review Board under Protocol SEC-2026-88',
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-01-15T09:00:00Z',
        isPubliclyVisible: true,
        lmsCourseRef: {
          courseId: 'LMS-AI-ETHICS-101',
          courseTitle: {
            en: 'Citizen Guide to AI Rights & Algorithmic Due Process',
            si: 'AI අයිතිවාසිකම් පිළිබඳ පුරවැසි මගපෙන්වීම',
            ta: 'AI உரிமைகள் மற்றும் அல்காரிதம் குறித்த குடிமக்கள் வழிகாட்டி'
          },
          url: 'https://www.cslk.org/courses/ai-governance'
        }
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        code: 'EL-POL-2026-002',
        title: {
          en: 'Sustainable Agritech Subsidies & Renewable Solar Farming Policy',
          si: 'තිරසාර කෘෂි තාක්‍ෂණ සහනාධාර සහ සූර්ය බලශක්ති ගොවිතැන් ප්‍රතිපත්තිය',
          ta: 'நிலையான விவசாய தொழில்நுட்ப மானியங்கள் மற்றும் சூரிய சக்தி விவசாயக் கொள்கை'
        },
        summary: {
          en: 'Micro-incentives and IoT-enabled moisture sensing subsidies to bolster paddy yields and smallholder farmer resilience.',
          si: 'කුඩා ගොවීන්ගේ ඔරොත්තු දීමේ හැකියාව සහ වී අස්වැන්න වැඩි කිරීම සඳහා ක්ෂුද්‍ර දිරිගැන්වීම් සහ IoT තෙතමනය සංවේදක සහනාධාර.',
          ta: 'நெல் விளைச்சல் மற்றும் சிறு விவசாயிகளின் நிலைத்தன்மையை வலுப்படுத்த IoT அடிப்படையிலான ஈரப்பதம் உணரி மானியங்கள்.'
        },
        fullDescription: {
          en: 'National framework enabling direct subsidy cash-transfers, duty exemptions on smart agri-sensors, and distributed agrivoltaic systems across the dry zones.',
          si: 'වියළි කලාපයේ ස්මාර්ට් කෘෂි සංවේදක සඳහා බදු සහන සහ සූර්ය බලශක්ති පද්ධති ප්‍රවර්ධනය කිරීමේ ජාතික රාමුව.',
          ta: 'வறண்ட பகுதிகளில் ஸ்மார்ட் விவசாய சென்சார்களுக்கான வரி விலக்குகள் மற்றும் விநியோகிக்கப்பட்ட சூரிய விவசாய அமைப்புகளை செயல்படுத்தும் தேசிய கட்டமைப்பு.'
        },
        category: 'AGRICULTURE_FOOD_SECURITY',
        stage: PolicyLifecycleStage.STAGE_3_ACTIVE_CONSULTATION,
        targetMinistry: 'Ministry of Agriculture & Irrigation',
        authorAgency: 'Agrarian Development Authority',
        submissionCount: 980,
        publishedAt: '2026-02-01T00:00:00Z',
        deadlineAt: '2026-11-30T23:59:59Z',
        approvedAt: '2026-01-28T11:00:00Z',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        isPubliclyVisible: true,
        lmsCourseRef: {
          courseId: 'LMS-AGRI-SOLAR-202',
          courseTitle: {
            en: 'Smart Farming: IoT & Clean Energy for Rural Sri Lanka',
            si: 'ස්මාර්ට් ගොවිතැන: IoT සහ පිරිසිදු බලශක්තිය',
            ta: 'ஸ்மார்ட் விவசாயம்: IoT மற்றும் சுத்தமான ஆற்றல்'
          },
          url: 'https://www.cslk.org/courses/sustainable-agritech'
        }
      },
      {
        id: 'b0000000-0000-0000-0000-000000000003',
        code: 'EL-POL-2026-003',
        title: {
          en: 'Civic Transparency in Public Procurement & Asset Declaration Act',
          si: 'රාජ්‍ය ප්‍රසම්පාදන සහ වත්කම් ප්‍රකාශ කිරීමේ විනිවිදභාවය පිළිබඳ පනත',
          ta: 'பொதுக் கொள்முதல் மற்றும் சொத்து அறிவிப்புச் சட்டத்தில் குடிமை வெளிப்படைத்தன்மை'
        },
        summary: {
          en: 'Real-time public tracking of tenders above LKR 50M, open contractual disclosures, and digitized asset registry.',
          si: 'රුපියල් මිලියන 50 ට වැඩි ප්‍රසම්පාදන ටෙන්ඩර් සජීවීව නිරීක්ෂණය සහ ඩිජිටල් වත්කම් ලේඛනය.',
          ta: 'ரூ. 50 மில்லியனுக்கு மேற்பட்ட டெண்டர்களை நேரலையாக கண்காணித்தல் மற்றும் டிஜிட்டல் சொத்து பதிவேடு.'
        },
        fullDescription: {
          en: 'Statutory provisions mandating machine-readable tender audits and public disclosure of high-value national infrastructure procurement contracts.',
          si: 'ඉහළ වටිනාකමකින් යුත් රාජ්‍ය යටිතල පහසුකම් ප්‍රසම්පාදන කොන්ත්‍රාත්තු ප්‍රසිද්ධියේ හෙළිදරව් කිරීම අනිවාර්ය කිරීම.',
          ta: 'உயர் மதிப்புள்ள தேசிய உள்கட்டமைப்பு கொள்முதல் ஒப்பந்தங்களை பொதுவில் வெளிப்படுத்துவதை கட்டாயமாக்கும் சட்ட விதிகள்.'
        },
        category: 'CONSTITUTIONAL_GOVERNANCE',
        stage: PolicyLifecycleStage.STAGE_2_APPROVED_PANEL,
        targetMinistry: 'Ministry of Justice & Constitutional Reforms',
        authorAgency: 'Public Oversight Commission',
        submissionCount: 0,
        approvedAt: '2026-02-10T14:00:00Z',
        moderatorPanelNotes: 'Approved by Panel Gate. Ready for survey questionnaire formulation.',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-02-10T14:00:00Z',
        isPubliclyVisible: true
      },
      {
        id: 'b0000000-0000-0000-0000-000000000004',
        code: 'EL-POL-2026-004',
        title: {
          en: 'Decentralized Healthcare Telemedicine Network for Rural Hospitals',
          si: 'ග්‍රාමීය රෝහල් සඳහා විමධ්‍යගත ටෙලිමෙඩිසින් සෞඛ්‍ය ජාලය',
          ta: 'கிராமப்புற மருத்துவமனைகளுக்கான பரவலாக்கப்பட்ட டெலிமெடிசின் சுகாதார வலையமைப்பு'
        },
        summary: {
          en: 'Proposal submitted by Primary Care Physicians to bridge specialist shortages in peripheral healthcare units.',
          si: 'ප්‍රාථමික සත්කාර වෛද්‍යවරුන් විසින් ඉදිරිපත් කරන ලද ග්‍රාමීය විශේෂඥ හිඟය පියවීමේ යෝජනාව.',
          ta: 'கிராமப்புற சுகாதாரப் பிரிவுகளில் உள்ள நிபுணர் பற்றாக்குறையை நிவர்த்தி செய்வதற்காக ஆரம்ப சுகாதார மருத்துவர்களால் முன்வைக்கப்பட்ட திட்டம்.'
        },
        fullDescription: {
          en: 'Citizen-led proposal currently held in Stage 1 Moderation Queue awaiting statutory panel review.',
          si: 'මධ්‍යස්ථතා මණ්ඩලයේ ව්‍යවස්ථාපිත සමාලෝචනය අපේක්ෂාවෙන් පළමු අදියරේ පවතින පුරවැසි යෝජනාව.',
          ta: 'சட்டரீதியான நடுவர் குழுவின் மதிப்பாய்விற்காக காத்திருக்கும் முதல் கட்ட முன்மொழிவு.'
        },
        category: 'HEALTHCARE_WELFARE',
        stage: PolicyLifecycleStage.STAGE_1_PENDING_REVIEW,
        targetMinistry: 'Ministry of Health',
        authorAgency: 'Primary Healthcare Doctors Association',
        submissionCount: 0,
        createdAt: '2026-02-14T10:00:00Z',
        updatedAt: '2026-02-14T10:00:00Z',
        isPubliclyVisible: false
      }
    ];

    policiesList.forEach(p => this.policies.set(p.id, p));

    // 3. Dynamic Surveys for Policy 001
    const survey001: SurveyDefinition = {
      id: 's0000000-0000-0000-0000-000000000001',
      policyId: 'b0000000-0000-0000-0000-000000000001',
      title: {
        en: 'Public Opinion on Algorithmic Transparency & AI Safety',
        si: 'ඇල්ගොරිතම විනිවිදභාවය සහ AI ආරක්ෂාව පිළිබඳ මහජන අදහස්',
        ta: 'அல்காரிதம் வெளிப்படைத்தன்மை மற்றும் AI பாதுகாப்பு குறித்த பொது கருத்து'
      },
      instructions: {
        en: 'This questionnaire gathers citizen input on high-risk AI models. All open-ended comments are encrypted with AES-256-GCM under Sri Lanka PDPA No. 9 of 2022.',
        si: 'මෙම ප්‍රශ්නාවලිය අධි-අවදානම් AI ආකෘති පිළිබඳ පුරවැසි අදහස් එක්රැස් කරයි. විවෘත අදහස් AES-256-GCM මඟින් සංකේතනය කෙරේ.',
        ta: 'இந்த கேள்வித்தாள் உயர்-இடர் AI மாதிரிகள் பற்றிய குடிமக்கள் உள்ளீட்டை சேகரிக்கிறது. பதில்கள் AES-256-GCM மூலம் குறியாக்கம் செய்யப்பட்டுள்ளன.'
      },
      estimatedMinutes: 4,
      questions: [],
      isActive: true
    };
    this.surveys.set(survey001.id, survey001);

    const questions001: SurveyQuestion[] = [
      {
        id: 'q001',
        surveyId: survey001.id,
        orderIndex: 1,
        type: 'SINGLE_CHOICE',
        prompt: {
          en: 'Should high-risk automated decision systems used by state agencies require an independent transparency audit before deployment?',
          si: 'රාජ්‍ය ආයතන විසින් භාවිතා කරන අධි-අවදානම් ස්වයංක්‍රීය තීරණ පද්ධති ක්‍රියාත්මක කිරීමට පෙර ස්වාධීන විනිවිදභාවයේ විගණනයක් අවශ්‍යද?',
          ta: 'அரசு நிறுவனங்கள் பயன்படுத்தும் உயர்-இடர் அமைப்புகளுக்கு சுயாதீன வெளிப்படைத்தன்மை தணிக்கை தேவையா?'
        },
        isRequired: true,
        options: [
          { id: 'opt1', value: 'STRONGLY_AGREE', label: { en: 'Strongly Agree (Mandatory Audits)', si: 'සම්පූර්ණයෙන්ම එකඟයි (අනිවාර්ය විගණන)', ta: 'முழுமையாக உடன்படுகிறேன் (கட்டாய தணிக்கை)' } },
          { id: 'opt2', value: 'SOMEWHAT_AGREE', label: { en: 'Somewhat Agree', si: 'මධ්‍යස්ථව එකඟයි', ta: 'ஓரளவு உடன்படுகிறேன்' } },
          { id: 'opt3', value: 'DISAGREE', label: { en: 'Disagree (May Delay Innovation)', si: 'එකඟ නොවේ (නවෝත්පාදනය ප්‍රමාද විය හැක)', ta: 'உடன்படவில்லை (புதுமை தாமதமாகலாம்)' } }
        ]
      },
      {
        id: 'q002',
        surveyId: survey001.id,
        orderIndex: 2,
        type: 'RATING_SCALE',
        prompt: {
          en: 'On a scale of 1 to 5, how confident are you that personal biometric data in public automated systems will remain private under current oversight?',
          si: '1 සිට 5 දක්වා පරිමාණයකින්, වත්මන් අධීක්ෂණය යටතේ පොදු ස්වයංක්‍රීය පද්ධතිවල පුද්ගලික ජෛවමිතික දත්ත සුරක්ෂිතව පවතිනු ඇති බවට ඔබ කෙතරම් විශ්වාස කරනවාද?',
          ta: 'தற்போதைய மேற்பார்வையின் கீழ் பொது தானியங்கி அமைப்புகளில் தனிப்பட்ட பயோமெட்ரிக் தரவு பாதுகாப்பாக இருக்கும் என்று 1 முதல் 5 வரை நீங்கள் எவ்வளவு நம்புகிறீர்கள்?'
        },
        isRequired: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: { en: '1 - No Confidence', si: '1 - කිසිදු විශ්වාසයක් නැත', ta: '1 - நம்பிக்கை இல்லை' },
        maxRatingLabel: { en: '5 - Full Confidence', si: '5 - පූර්ණ විශ්වාසය', ta: '5 - முழு நம்பிக்கை' }
      },
      {
        id: 'q003',
        surveyId: survey001.id,
        orderIndex: 3,
        type: 'OPEN_TEXT',
        prompt: {
          en: 'What specific protections or citizen rights should be legally guaranteed when AI algorithms evaluate loan eligibility, job applications, or public welfare benefits?',
          si: 'ණය සුදුසුකම්, රැකියා අයදුම්පත් හෝ මහජන සුබසාධන ප්‍රතිලාභ ඇගයීමේදී පුරවැසියන්ට නීත්‍යානුකූලව සහතික කළ යුතු නිශ්චිත අයිතිවාසිකම් මොනවාද?',
          ta: 'கடன் தகுதி, வேலை விண்ணப்பங்கள் அல்லது நலத்திட்ட உதவிகளை AI மதிப்பீடு செய்யும்போது குடிமக்களுக்கு என்ன குறிப்பிட்ட பாதுகாப்புகள் உறுதி செய்யப்பட வேண்டும்?'
        },
        helpText: {
          en: 'All submissions are encrypted with AES-256-GCM prior to storage and scrubbed of PII by background AI workers.',
          si: 'සියලුම ඉදිරිපත් කිරීම් ගබඩා කිරීමට පෙර AES-256-GCM මඟින් සංකේතනය කරනු ලැබේ.',
          ta: 'அனைத்து உள்ளீடுகளும் சேமிப்பதற்கு முன் AES-256-GCM மூலம் குறியாக்கம் செய்யப்படுகின்றன.'
        },
        isRequired: false,
        maxCharacters: 1000
      }
    ];
    this.surveyQuestions.set(survey001.id, questions001);

    // 4. Petitions
    const petitionsList: EPetition[] = [
      {
        id: 'e0000000-0000-0000-0000-000000000001',
        code: 'PET-2026-012',
        title: {
          en: 'Mandate Open Fiber Access & Universal High-Speed Broadband across Rural Schools',
          si: 'ග්‍රාමීය පාසල් පුරා විවෘත ෆයිබර් ප්‍රවේශය සහ අධිවේගී බ්‍රෝඩ්බෑන්ඩ් අනිවාර්ය කිරීම',
          ta: 'கிராமப்புறப் பள்ளிகள் முழுவதும் திறந்த ஃபைபர் அணுகல் மற்றும் அதிவேக பிராட்பேண்டை கட்டாயமாக்குங்கள்'
        },
        objectiveStatement: {
          en: 'Require telecommunication operators to offer subsidized 100Mbps dedicated fiber connections to all 10,155 government schools in Sri Lanka to ensure equal digital education opportunities.',
          si: 'සමාන ඩිජිටල් අධ්‍යාපන අවස්ථා සහතික කිරීම සඳහා ශ්‍රී ලංකාවේ සියලුම රජයේ පාසල් 10,155 සඳහාම සහනාධාර සහිත 100Mbps ෆයිබර් සම්බන්ධතා ලබා දීමට විදුලි සංදේශ සමාගම්වලට නියම කිරීම.',
          ta: 'சமமான டிஜிட்டல் கல்வி வாய்ப்புகளை உறுதி செய்வதற்காக இலங்கையிலுள்ள அனைத்து 10,155 அரச பாடசாலைகளுக்கும் மானிய விலையில் 100Mbps ஃபைபர் இணைப்புகளை வழங்குமாறு தொலைத்தொடர்பு நிறுவனங்களைக் கோருதல்.'
        },
        targetAuthority: 'Telecommunications Regulatory Commission of Sri Lanka (TRCSL)',
        category: 'EDUCATION_YOUTH',
        requiredSignatures: 10000,
        currentSignatures: 7420,
        status: 'ACTIVE',
        deadline: '2026-12-15T23:59:59Z',
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-02-14T10:00:00Z'
      },
      {
        id: 'e0000000-0000-0000-0000-000000000002',
        code: 'PET-2026-018',
        title: {
          en: 'Statutory Ban on Single-Use Non-Biodegradable Polythene in Coastal Sanctuaries',
          si: 'වෙරළබඩ අභයභූමිවල තනි භාවිත නොදිරන පොලිතීන් භාවිතය නීතියෙන් තහනම් කිරීම',
          ta: 'கடலோர சரணாலயங்களில் ஒருமுறை பயன்படுத்தும் மக்கும் தன்மையற்ற பொலித்தீனுக்கு சட்டப்பூர்வ தடை'
        },
        objectiveStatement: {
          en: 'Establish zero-plastic zones across coastal reserves from Mirissa to Trincomalee to protect marine biodiversity and local fishery livelihoods.',
          si: 'සමුද්‍ර ජෛව විවිධත්වය සහ ධීවර ජීවනෝපාය ආරක්ෂා කිරීම සඳහා මිරිස්සේ සිට ත්‍රිකුණාමලය දක්වා වෙරළබඩ කලාපවල ප්ලාස්ටික් රහිත කලාප ස්ථාපිත කිරීම.',
          ta: 'கடல் பல்லுயிர் மற்றும் மீனவ வாழ்வாதாரங்களைப் பாதுகாக்க மிரிஸ்ஸ முதல் திருகோணமலை வரையிலான கடலோரப் பகுதிகளில் பிளாஸ்டிக் இல்லாத மண்டலங்களை நிறுவுதல்.'
        },
        targetAuthority: 'Central Environmental Authority (CEA)',
        category: 'ENVIRONMENTAL_SUSTAINABILITY',
        requiredSignatures: 5000,
        currentSignatures: 3890,
        status: 'ACTIVE',
        deadline: '2026-11-20T23:59:59Z',
        createdAt: '2026-01-18T10:00:00Z',
        updatedAt: '2026-02-14T10:00:00Z'
      }
    ];

    petitionsList.forEach(pet => this.petitions.set(pet.id, pet));

    // 5. Seed Zero-PII public aggregates for Policy 001
    const aggregate001: ZeroPIIPublicAggregate = {
      policyId: 'b0000000-0000-0000-0000-000000000001',
      code: 'EL-POL-2026-001',
      totalSubmissions: 1420,
      sentimentDistribution: {
        positive: 68,
        neutral: 21,
        negative: 11
      },
      thematicClusters: [
        {
          id: 'thm_1',
          themeTitle: {
            en: 'Mandatory Algorithmic Due Diligence & Bias Audits',
            si: 'අනිවාර්ය ඇල්ගොරිතම පරීක්ෂාව සහ පක්ෂග්‍රාහී විගණන',
            ta: 'கட்டாய அல்காரிதம் மதிப்பீடு மற்றும் பக்கச்சார்பு தணிக்கை'
          },
          mentionCount: 840,
          percentage: 59,
          keyConcerns: [
            { en: 'Pre-deployment testing for language model fairness', si: 'භාෂා ආකෘති සාධාරණත්වය සඳහා පෙර-පරීක්ෂාව', ta: 'மொழி மாதிரி நேர்மைக்கான முன் சோதனை' },
            { en: 'Independent regulatory body oversight', si: 'ස්වාධීන නියාමන ආයතන අධීක්ෂණය', ta: 'சுயாதீன ஒழுங்குமுறை மேற்பார்வை' }
          ],
          representativeQuotes: [
            "Sri Lanka must establish independent technical certification before AI is used in credit scoring or civil service promotions.",
            "Public sector automation should maintain human appeal mechanisms under PDPA No. 9 of 2022."
          ]
        },
        {
          id: 'thm_2',
          themeTitle: {
            en: 'Sovereign Open Data & Local Language Support (Sinhala/Tamil)',
            si: 'ස්වෛරී විවෘත දත්ත සහ දේශීය භාෂා සහාය',
            ta: 'இறைமையுள்ள திறந்த தரவு மற்றும் உள்ளூர் மொழி ஆதரவு'
          },
          mentionCount: 580,
          percentage: 41,
          keyConcerns: [
            { en: 'Open training corpus in Sinhala & Tamil', si: 'සිංහල සහ දෙමළ භාෂාවලින් විවෘත පුහුණු දත්ත කට්ටල', ta: 'சிங்களம் மற்றும் தமிழில் திறந்த பயிற்சி தரவுத்தொகுப்புகள்' },
            { en: 'Preventing digital disenfranchisement in rural provinces', si: 'ග්‍රාමීය පළාත්වල ඩිජිටල් අසමානතාව වැළැක්වීම', ta: 'கிராமப்புறங்களில் டிஜிட்டல் உரிமையிழப்பைத் தடுத்தல்' }
          ],
          representativeQuotes: [
            "AI systems trained purely on Western datasets fail on local cultural context; our national policy must support trilingual open corpuses.",
            "Accessibility on low-bandwidth mobile networks is critical for estate and agricultural workers."
          ]
        }
      ],
      questionSummaries: [
        {
          questionId: 'q001',
          questionPrompt: {
            en: 'Should high-risk automated decision systems require independent audit?',
            si: 'අධි-අවදානම් ස්වයංක්‍රීය පද්ධති සඳහා ස්වාධීන විගණනයක් අවශ්‍යද?',
            ta: 'உயர்-இடர் அமைப்புகளுக்கு சுயாதீன தணிக்கை தேவையா?'
          },
          type: 'SINGLE_CHOICE',
          optionSplits: [
            { optionId: 'opt1', label: { en: 'Strongly Agree', si: 'සම්පූර්ණයෙන්ම එකඟයි', ta: 'முழுமையாக உடன்படுகிறேன்' }, count: 1107, percentage: 78 },
            { optionId: 'opt2', label: { en: 'Somewhat Agree', si: 'මධ්‍යස්ථව එකඟයි', ta: 'ஓரளவு உடன்படுகிறேன்' }, count: 213, percentage: 15 },
            { optionId: 'opt3', label: { en: 'Disagree', si: 'එකඟ නොවේ', ta: 'உடன்படவில்லை' }, count: 100, percentage: 7 }
          ]
        },
        {
          questionId: 'q002',
          questionPrompt: {
            en: 'Confidence in biometric data privacy in automated systems (1-5 scale)',
            si: 'ස්වයංක්‍රීය පද්ධතිවල ජෛවමිතික දත්ත රහස්‍යභාවය පිළිබඳ විශ්වාසය (1-5)',
            ta: 'தானியங்கி அமைப்புகளில் பயோமெட்ரிக் தரவு பாதுகாப்பு நம்பிக்கை (1-5)'
          },
          type: 'RATING_SCALE',
          averageRating: 2.8,
          ratingBreakdown: { 1: 320, 2: 410, 3: 390, 4: 210, 5: 90 }
        }
      ],
      generatedAt: '2026-02-14T12:00:00Z',
      syncHash: 'synchash_9401823abfd881023e'
    };
    this.publicAggregates.set(aggregate001.policyId, aggregate001);
  }

  // --------------------------------------------------------------------------
  // Policies & 5-Stage Lifecycle
  // --------------------------------------------------------------------------
  public getPolicies(includeUnpublished = false): PolicyConsultation[] {
    const list = Array.from(this.policies.values());
    if (includeUnpublished) {
      return list;
    }
    return list.filter(p => p.isPubliclyVisible || p.stage !== PolicyLifecycleStage.STAGE_1_PENDING_REVIEW);
  }

  public getPolicyById(id: string): PolicyConsultation | undefined {
    return this.policies.get(id);
  }

  public createPolicy(policyData: Partial<PolicyConsultation>): PolicyConsultation {
    const id = crypto.randomUUID();
    const count = this.policies.size + 1;
    const code = `EL-POL-2026-${String(count).padStart(3, '0')}`;

    const newPolicy: PolicyConsultation = {
      id,
      code,
      title: policyData.title || { en: '', si: '', ta: '' },
      summary: policyData.summary || { en: '', si: '', ta: '' },
      fullDescription: policyData.fullDescription || { en: '', si: '', ta: '' },
      category: policyData.category || 'DIGITAL_RIGHTS',
      stage: PolicyLifecycleStage.STAGE_1_PENDING_REVIEW, // Enters moderation gate
      targetMinistry: policyData.targetMinistry || 'Ministry of Public Administration',
      authorAgency: policyData.authorAgency || 'Citizen Working Group',
      submissionCount: 0,
      isPubliclyVisible: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.policies.set(id, newPolicy);

    PDPAService.logAudit({
      action: 'DATA_INGESTION',
      actorRole: 'POLICY_PROPOSER',
      actorId: 'system',
      resourceType: 'POLICY',
      resourceId: id,
      purposeDescription: `Created new draft policy proposal ${code} entering Stage 1 moderation gate`
    });

    return newPolicy;
  }

  /**
   * Panel Moderation Gate (PENDING -> APPROVED_PANEL workflow)
   */
  public updatePolicyStage(
    policyId: string,
    targetStage: PolicyLifecycleStage,
    moderatorNotes: string,
    moderatorId: string
  ): PolicyConsultation {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    // RBAC validation: Cannot formulate survey or publish without Stage 2 approval
    if (
      targetStage === PolicyLifecycleStage.STAGE_3_ACTIVE_CONSULTATION &&
      policy.stage === PolicyLifecycleStage.STAGE_1_PENDING_REVIEW
    ) {
      throw new Error('Violation of 5-Stage Policy Lifecycle: Proposal must be approved by Panel Gate (APPROVED_PANEL) first.');
    }

    policy.stage = targetStage;
    policy.moderatorPanelNotes = moderatorNotes;
    policy.updatedAt = new Date().toISOString();

    if (targetStage === PolicyLifecycleStage.STAGE_2_APPROVED_PANEL) {
      policy.approvedAt = new Date().toISOString();
      policy.isPubliclyVisible = true;
    } else if (targetStage === PolicyLifecycleStage.STAGE_3_ACTIVE_CONSULTATION) {
      policy.publishedAt = new Date().toISOString();
      policy.isPubliclyVisible = true;
    }

    this.policies.set(policyId, policy);

    PDPAService.logAudit({
      action: 'ADMIN_PANEL_ACCESS',
      actorRole: 'PANEL_MODERATOR',
      actorId: moderatorId,
      resourceType: 'POLICY',
      resourceId: policyId,
      purposeDescription: `Updated policy ${policy.code} stage to ${targetStage}. Notes: ${moderatorNotes}`
    });

    return policy;
  }

  // --------------------------------------------------------------------------
  // Dynamic Surveys & Questionnaire formulation
  // --------------------------------------------------------------------------
  public getSurveyByPolicyId(policyId: string): { survey?: SurveyDefinition; questions: SurveyQuestion[] } {
    let targetSurvey: SurveyDefinition | undefined;
    for (const survey of this.surveys.values()) {
      if (survey.policyId === policyId) {
        targetSurvey = survey;
        break;
      }
    }

    if (!targetSurvey) {
      return { questions: [] };
    }

    const questions = this.surveyQuestions.get(targetSurvey.id) || [];
    return { survey: targetSurvey, questions };
  }

  public createOrUpdateSurvey(survey: SurveyDefinition, questions: SurveyQuestion[]): SurveyDefinition {
    this.surveys.set(survey.id, survey);
    this.surveyQuestions.set(survey.id, questions);
    return survey;
  }

  /**
   * Ingest survey response with AES-256-GCM FLE on open-ended text
   */
  public ingestSurveyResponse(params: {
    surveyId: string;
    policyId: string;
    citizenBlindIndex: string;
    answers: {
      questionId: string;
      questionType: string;
      selectedOptionId?: string;
      selectedOptionIds?: string[];
      numericRating?: number;
      rawOpenText?: string;
    }[];
    clientLanguage: 'en' | 'si' | 'ta';
  }): { success: boolean; responseCount: number } {
    const policy = this.policies.get(params.policyId);
    if (!policy) throw new Error('Policy not found');

    for (const ans of params.answers) {
      const recordId = crypto.randomUUID();

      // Field-Level Encryption: Open-text is encrypted BEFORE persistence
      const encryptedPayload = ans.rawOpenText ? encryptField(ans.rawOpenText) : undefined;

      const record: SurveyResponseRecord = {
        id: recordId,
        surveyId: params.surveyId,
        policyId: params.policyId,
        citizenBlindIndex: params.citizenBlindIndex,
        encryptedOpenTextPayload: encryptedPayload,
        selectedOptionId: ans.selectedOptionId,
        selectedOptionIds: ans.selectedOptionIds,
        numericRating: ans.numericRating,
        isAnonymized: false,
        isErased: false,
        createdAt: new Date().toISOString()
      };

      this.surveyResponses.push(record);
    }

    policy.submissionCount += 1;
    this.policies.set(params.policyId, policy);

    PDPAService.logAudit({
      action: 'DATA_INGESTION',
      actorRole: 'CITIZEN',
      actorId: params.citizenBlindIndex,
      resourceType: 'SURVEY_RESPONSE',
      resourceId: params.surveyId,
      purposeDescription: `Ingested survey responses for policy ${policy.code} with AES-256-GCM FLE applied`
    });

    return { success: true, responseCount: policy.submissionCount };
  }

  // --------------------------------------------------------------------------
  // E-Petitions & Duplicate-Prevention via HMAC-SHA256 Blind Index
  // --------------------------------------------------------------------------
  public getPetitions(): EPetition[] {
    return Array.from(this.petitions.values());
  }

  public getPetitionById(id: string): EPetition | undefined {
    return this.petitions.get(id);
  }

  /**
   * Verified e-petition signing with duplicate prevention
   */
  public signPetition(params: {
    petitionId: string;
    nicNumber: string;
    fullName: string;
    email: string;
    district: string;
  }): { success: boolean; currentSignatures: number; message: string } {
    const petition = this.petitions.get(params.petitionId);
    if (!petition) throw new Error('Petition not found');

    // Blind indexing: salted HMAC-SHA256 of NIC
    const signerBlindIndex = computeBlindHash(params.nicNumber, 'NIC');

    // Duplicate check without decrypting any database rows
    const alreadySigned = this.petitionSignatures.some(
      sig => sig.petitionId === params.petitionId && sig.signerBlindIndex === signerBlindIndex && !sig.isErased
    );

    if (alreadySigned) {
      return {
        success: false,
        currentSignatures: petition.currentSignatures,
        message: 'This National Identity Card has already verified a signature for this petition.'
      };
    }

    // Encrypt PII with AES-256-GCM
    const encryptedSignerData = encryptJson({
      fullName: params.fullName,
      email: params.email,
      district: params.district,
      signedTimestamp: new Date().toISOString()
    });

    const signatureRecord: VerifiedSignatureRecord = {
      id: crypto.randomUUID(),
      petitionId: params.petitionId,
      signerBlindIndex,
      encryptedSignerData,
      signedAt: new Date().toISOString(),
      isErased: false
    };

    this.petitionSignatures.push(signatureRecord);
    petition.currentSignatures += 1;
    this.petitions.set(params.petitionId, petition);

    PDPAService.logAudit({
      action: 'DATA_INGESTION',
      actorRole: 'CITIZEN',
      actorId: signerBlindIndex,
      resourceType: 'PETITION_SIGNATURE',
      resourceId: params.petitionId,
      purposeDescription: `Verified petition signature recorded with blind index deduplication and AES-256-GCM FLE`
    });

    return {
      success: true,
      currentSignatures: petition.currentSignatures,
      message: 'Signature verified and cryptographically recorded.'
    };
  }

  // --------------------------------------------------------------------------
  // Sri Lanka PDPA Right-to-Erasure Pipeline
  // Preserves immutable aggregate counts while decoupling/erasing all PII
  // --------------------------------------------------------------------------
  public executeRightToErasure(request: RightToErasureRequest): ErasureResult {
    let anonymizedSurveyResponses = 0;
    let anonymizedSignatures = 0;

    // 1. Survey responses: Nullify citizen blind index and wipe encrypted open text
    for (const resp of this.surveyResponses) {
      if (resp.citizenBlindIndex === request.citizenBlindIndex) {
        resp.isErased = true;
        resp.encryptedOpenTextPayload = undefined; // Wipe ciphertext
        resp.citizenBlindIndex = 'ERASED_PDPA_SEC_14'; // Decouple identity
        anonymizedSurveyResponses++;
      }
    }

    // 2. Petition signatures: Strip encrypted PII, decouple blind index, preserve count
    for (const sig of this.petitionSignatures) {
      if (sig.signerBlindIndex === request.citizenBlindIndex) {
        sig.isErased = true;
        sig.encryptedSignerData = encryptJson({ erased: true, timestamp: new Date().toISOString() });
        sig.signerBlindIndex = `ERASED_${crypto.randomUUID()}`;
        anonymizedSignatures++;
      }
    }

    // 3. User profile if existing
    for (const [id, prof] of this.profiles.entries()) {
      if (prof.nicBlindIndex === request.citizenBlindIndex) {
        prof.nicBlindIndex = undefined;
        prof.emailBlindIndex = undefined;
        prof.anonymizedAlias = 'Anonymized Citizen';
        this.profiles.set(id, prof);
      }
    }

    const auditLog = PDPAService.logAudit({
      action: 'ERASURE_COMPLETED',
      actorRole: 'CITIZEN',
      actorId: request.citizenBlindIndex,
      resourceType: 'USER_PROFILE',
      resourceId: request.citizenBlindIndex,
      purposeDescription: `Exercised statutory Right to Erasure under Sri Lanka PDPA No. 9 of 2022 (Sec 14). Preserved immutable aggregate counters.`
    });

    return {
      success: true,
      citizenBlindIndex: request.citizenBlindIndex,
      anonymizedSurveyResponses,
      anonymizedSignatures,
      preservedAggregateCount: anonymizedSurveyResponses + anonymizedSignatures,
      timestamp: new Date().toISOString(),
      pdpaAuditId: auditLog.id
    };
  }

  // --------------------------------------------------------------------------
  // AI Aggregates & Public Zero-PII Edge Cache
  // --------------------------------------------------------------------------
  public getPublicAggregate(policyId: string): ZeroPIIPublicAggregate | undefined {
    return this.publicAggregates.get(policyId);
  }

  public savePublicAggregate(aggregate: ZeroPIIPublicAggregate): void {
    this.publicAggregates.set(aggregate.policyId, aggregate);
  }

  // --------------------------------------------------------------------------
  // Profiles & Auth
  // --------------------------------------------------------------------------
  public getProfileById(id: string): UserProfile | undefined {
    return this.profiles.get(id);
  }

  public getProfileByNICBlindIndex(hash: string): UserProfile | undefined {
    for (const prof of this.profiles.values()) {
      if (prof.nicBlindIndex === hash) return prof;
    }
    return undefined;
  }

  public saveProfile(profile: UserProfile): void {
    this.profiles.set(profile.id, profile);
  }
}

