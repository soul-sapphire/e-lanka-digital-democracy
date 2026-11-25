/**
 * E-Lanka Digital Democracy Platform
 * Trilingual Neural Translation Service (English <-> Sinhala & Tamil)
 *
 * Implements 1-Click Automated AI Translation for statutory e-petitions and policy briefs.
 * Features:
 * 1. Live neural translation via MyMemory API with automatic rate-limit and error handling.
 * 2. Official Sri Lankan Statutory Glossary: Enforces exact legal terminology for ministries,
 *    statutory authorities, parliamentary procedures, and constitutional terms.
 * 3. HTML entity unescaping and punctuation normalization.
 */

export interface TrilingualText {
  en: string;
  si: string;
  ta: string;
}

export interface PetitionFieldsToTranslate {
  headline: string;
  title: string;
  objective: string;
}

export interface TranslatedPetitionFields {
  headline: TrilingualText;
  title: TrilingualText;
  objective: TrilingualText;
}

/**
 * Official Statutory & Institutional Terminology Glossary
 * Based on the Constitution of the Democratic Socialist Republic of Sri Lanka
 * and the Department of Official Languages (රාජ්‍ය භාෂා දෙපාර්තමේන්තුව).
 */
export const STATUTORY_GLOSSARY: Record<string, { si: string; ta: string }> = {
  'Central Environmental Authority': {
    si: 'මධ්‍යම පරිසර අධිකාරිය',
    ta: 'மத்திய சுற்றாடல் அதிகாரசபை'
  },
  'Telecommunications Regulatory Commission of Sri Lanka': {
    si: 'ශ්‍රී ලංකා විදුලි සංදේශ නියාමන කොමිෂන් සභාව',
    ta: 'இலங்கை தொலைத்தொடர்பு ஒழுங்குமுறைப்படுத்தல் ஆணைக்குழு'
  },
  'Parliament of Sri Lanka': {
    si: 'ශ්‍රී ලංකා පාර්ලිමේන්තුව',
    ta: 'இலங்கை பாராளுமன்றம்'
  },
  'Committee on Public Petitions': {
    si: 'මහජන පෙත්සම් පිළිබඳ කාරක සභාව',
    ta: 'பொது மனுக்கள் மீதான குழு'
  },
  'Standing Orders of Parliament': {
    si: 'පාර්ලිමේන්තු ස්ථාවර නියෝග',
    ta: 'பாராளுமன்ற நிலையியல் கட்டளைகள்'
  },
  'Ministry of Technology & Digital Economy': {
    si: 'තාක්ෂණ සහ ඩිජිටල් ආර්ථික අමාත්‍යාංශය',
    ta: 'தொழில்நுட்பம் மற்றும் டிஜிட்டல் பொருளாதார அமைச்சு'
  },
  'Ministry of Health': {
    si: 'සෞඛ්‍ය අමාත්‍යාංශය',
    ta: 'சுகாதார அமைச்சு'
  },
  'Ministry of Education': {
    si: 'අධ්‍යාපන අමාත්‍යාංශය',
    ta: 'கல்வி அமைச்சு'
  },
  'Ministry of Agriculture': {
    si: 'කෘෂිකර්ම අමාත්‍යාංශය',
    ta: 'விவசாய அமைச்சு'
  },
  'Data Protection Authority of Sri Lanka': {
    si: 'ශ්‍රී ලංකා දත්ත ආරක්ෂණ අධිකාරිය',
    ta: 'இலங்கை தரவுப் பாதுகாப்பு அதிகாரசபை'
  },
  'Personal Data Protection Act No. 9 of 2022': {
    si: '2022 අංක 9 දරන පුද්ගලික දත්ත ආරක්ෂණ පනත',
    ta: '2022 ஆம் ஆண்டின் 9 ஆம் இலக்க தனிநபர் தரவுப் பாதுகாப்புச் சட்டம்'
  },
  'Online Safety Act': {
    si: 'මාර්ගගත ආරක්ෂාව පිළිබඳ පනත',
    ta: 'நிகழ்நிலை காப்புச் சட்டம்'
  },
  'Single-Use Plastics': {
    si: 'එක්වරක් භාවිත කරන ප්ලාස්ටික්',
    ta: 'ஒருமுறை மட்டுமே பயன்படுத்தக்கூடிய மக்காத பிளாஸ்டிக்'
  },
  'Single-use plastics': {
    si: 'එක්වරක් භාවිත කරන ප්ලාස්ටික්',
    ta: 'ஒருமுறை மட்டுமே பயன்படுத்தக்கூடிய மக்காத பிලාස්ටிக்'
  },
  'High-Speed Internet': {
    si: 'අධිවේගී අන්තර්ජාලය',
    ta: 'அதிவேக இணையம்'
  },
  'Rural Schools': {
    si: 'ග්‍රාමීය පාසල්',
    ta: 'கிராமப்புறப் பாடசாலைகள்'
  },
  'Electoral District': {
    si: 'මැතිවරණ දිස්ත්‍රික්කය',
    ta: 'தேர்தல் மாவட்டம்'
  }
};

/**
 * Decode common HTML entities returned by translation APIs
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Translate a single string from English to Sinhala or Tamil with glossary enforcement
 */
export async function translateText(
  text: string,
  targetLang: 'si' | 'ta',
  sourceLang: string = 'en'
): Promise<string> {
  const clean = text?.trim();
  if (!clean) return '';

  // 1. Direct glossary exact match check
  for (const [englishTerm, translations] of Object.entries(STATUTORY_GLOSSARY)) {
    if (clean.toLowerCase() === englishTerm.toLowerCase()) {
      return translations[targetLang];
    }
  }

  // 2. Query Neural Translation API
  try {
    const encoded = encodeURIComponent(clean);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceLang}|${targetLang}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.responseData?.translatedText;
      if (rawText && typeof rawText === 'string') {
        let cleaned = decodeHtmlEntities(rawText.trim());
        
        // Remove known API error echo
        if (cleaned.startsWith('MYMEMORY WARNING:')) {
          cleaned = clean;
        }

        // Apply glossary word replacements for statutory terms inside the translated string
        for (const [englishTerm, translations] of Object.entries(STATUTORY_GLOSSARY)) {
          const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
          if (regex.test(cleaned)) {
            cleaned = cleaned.replace(regex, translations[targetLang]);
          }
        }

        return cleaned;
      }
    }
  } catch (err) {
    console.warn(`[Translation Service] Neural translation warning for ${targetLang}:`, err);
  }

  // 3. Fallback: Return original text if network failure occurs
  return clean;
}

/**
 * Simultaneously translate text from English into both Sinhala and Tamil
 */
export async function translateTrilingual(
  englishText: string
): Promise<TrilingualText> {
  const clean = englishText.trim();
  if (!clean) {
    return { en: '', si: '', ta: '' };
  }

  const [si, ta] = await Promise.all([
    translateText(clean, 'si', 'en'),
    translateText(clean, 'ta', 'en')
  ]);

  return {
    en: clean,
    si: si || clean,
    ta: ta || clean
  };
}

/**
 * 1-Click Translation for all petition fields:
 * - Action Headline
 * - Formal Gazette Title
 * - Objective & Citizen Demands Statement
 */
export async function translatePetitionTrilingual(
  fields: PetitionFieldsToTranslate
): Promise<TranslatedPetitionFields> {
  const [headline, title, objective] = await Promise.all([
    translateTrilingual(fields.headline),
    translateTrilingual(fields.title),
    translateTrilingual(fields.objective)
  ]);

  return {
    headline,
    title,
    objective
  };
}
