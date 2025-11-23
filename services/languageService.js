// AI-Powered Language Service using Gemini 2.5 Pro
// Real-time translation for 22+ Indian languages
import aiService from './aiService';

const INDIAN_LANGUAGES = {
  'hi': { name: 'Hindi', nativeName: 'हिंदी' },
  'bn': { name: 'Bengali', nativeName: 'বাংলা' },
  'te': { name: 'Telugu', nativeName: 'తెలుగు' },
  'mr': { name: 'Marathi', nativeName: 'मराठी' },
  'ta': { name: 'Tamil', nativeName: 'தமிழ்' },
  'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી' },
  'ur': { name: 'Urdu', nativeName: 'اردو' },
  'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  'ml': { name: 'Malayalam', nativeName: 'മലയാളം' },
  'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  'as': { name: 'Assamese', nativeName: 'অসমীয়া' },
  'mai': { name: 'Maithili', nativeName: 'मैथिली' },
  'mag': { name: 'Magahi', nativeName: 'मगही' },
  'bho': { name: 'Bhojpuri', nativeName: 'भोजपुरी' },
  'ne': { name: 'Nepali', nativeName: 'नेपाली' },
  'sat': { name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  'ks': { name: 'Kashmiri', nativeName: 'کٲشُر' },
  'sd': { name: 'Sindhi', nativeName: 'سِنڌِي' },
  'kok': { name: 'Konkani', nativeName: 'कोंकणी' },
  'mni': { name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  'doi': { name: 'Dogri', nativeName: 'डोगरी' }
};

// Mock translations - In production, this would call Google Translate API
const MOCK_TRANSLATIONS = {
  // Common farming terms
  'Weather': {
    'hi': 'मौसम',
    'bn': 'আবহাওয়া',
    'te': 'వాతావరణం',
    'ta': 'வானிலை',
    'gu': 'હવામાન',
    'mr': 'हवामान'
  },
  'Soil Advisory': {
    'hi': 'मिट्टी सलाह',
    'bn': 'মাটি পরামর্শ',
    'te': 'నేల సలహా',
    'ta': 'மண் ஆலோசனை',
    'gu': 'માટી સલાह',
    'mr': 'माती सल्ला'
  },
  'Pest Detection': {
    'hi': 'कीट पहचान',
    'bn': 'কীটপতঙ্গ সনাক্তকরণ',
    'te': 'కీట గుర్తింపు',
    'ta': 'பூச்சி கண்டறிதல்',
    'gu': 'કીડા ઓળખ',
    'mr': 'कीटक ओळख'
  },
  'Market Prices': {
    'hi': 'बाजार भाव',
    'bn': 'বাজার দাম',
    'te': 'మార్కెట్ ధరలు',
    'ta': 'சந்தை விலைகள்',
    'gu': 'બાજાર ભાવ',
    'mr': 'बाजार किंमती'
  },
  'AI Assistant': {
    'hi': 'AI सहायक',
    'bn': 'AI সহায়ক',
    'te': 'AI సహాయకుడు',
    'ta': 'AI உதவியாளர்',
    'gu': 'AI સહાયક',
    'mr': 'AI सहाय्यक'
  }
};

class LanguageService {
  constructor() {
    this.currentLanguage = 'en'; // Default to English
    this.translationCache = new Map(); // Cache for translated texts
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  setCurrentLanguage(langCode) {
    this.currentLanguage = langCode;
  }

  getAllLanguages() {
    return {
      'en': { name: 'English', nativeName: 'English' },
      ...INDIAN_LANGUAGES
    };
  }

  // Real AI-powered translation using Gemini 2.5 Pro
  async translateText(text, targetLang) {
    if (targetLang === 'en' || !targetLang || !text) {
      return text; // Return original English text
    }

    // Use cache for frequently translated texts
    const cacheKey = `${text}_${targetLang}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }

    try {
      // Check for common mock translations first (for speed)
      if (MOCK_TRANSLATIONS[text] && MOCK_TRANSLATIONS[text][targetLang]) {
        const mockTranslation = MOCK_TRANSLATIONS[text][targetLang];
        this.translationCache.set(cacheKey, mockTranslation);
        return mockTranslation;
      }

      // Use Gemini AI for real translation
      console.log(`AI Translating: "${text}" → ${targetLang}`);
      const translatedText = await aiService.translate(text, targetLang);
      
      // Cache the translation for future use
      this.translationCache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to mock or original text
      if (MOCK_TRANSLATIONS[text] && MOCK_TRANSLATIONS[text][targetLang]) {
        return MOCK_TRANSLATIONS[text][targetLang];
      }
      return text;
    }
  }

  // Translate multiple texts at once
  async translateMultiple(texts, targetLang) {
    const translations = {};
    for (const text of texts) {
      translations[text] = await this.translateText(text, targetLang);
    }
    return translations;
  }

  // Get translated text synchronously (for UI elements)
  t(text, targetLang = this.currentLanguage) {
    if (targetLang === 'en' || !targetLang) {
      return text;
    }

    if (MOCK_TRANSLATIONS[text] && MOCK_TRANSLATIONS[text][targetLang]) {
      return MOCK_TRANSLATIONS[text][targetLang];
    }

    return text; // Fallback to original text
  }
}

// Create a singleton instance
const languageService = new LanguageService();

export default languageService;