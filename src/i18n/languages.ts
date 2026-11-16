export type LanguageCode =
  | 'en'
  | 'te'
  | 'hi'
  | 'ta'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'mr'
  | 'gu'
  | 'pa';

export interface LanguageOption {
  code: LanguageCode;
  englishName: string;
  nativeName: string;
  intlLocale: string;
  scriptName: string;
  isDefault?: boolean;
}

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const LANGUAGE_STORAGE_KEY = 'maata_preferred_lang';

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  {
    code: 'en',
    englishName: 'English',
    nativeName: 'English',
    intlLocale: 'en-IN',
    scriptName: 'Latin',
    isDefault: true,
  },
  {
    code: 'te',
    englishName: 'Telugu',
    nativeName: 'తెలుగు',
    intlLocale: 'te-IN',
    scriptName: 'Telugu',
  },
  {
    code: 'hi',
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    intlLocale: 'hi-IN',
    scriptName: 'Devanagari',
  },
  {
    code: 'ta',
    englishName: 'Tamil',
    nativeName: 'தமிழ்',
    intlLocale: 'ta-IN',
    scriptName: 'Tamil',
  },
  {
    code: 'kn',
    englishName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    intlLocale: 'kn-IN',
    scriptName: 'Kannada',
  },
  {
    code: 'ml',
    englishName: 'Malayalam',
    nativeName: 'മലയാളം',
    intlLocale: 'ml-IN',
    scriptName: 'Malayalam',
  },
  {
    code: 'bn',
    englishName: 'Bengali',
    nativeName: 'বাংলা',
    intlLocale: 'bn-IN',
    scriptName: 'Bengali',
  },
  {
    code: 'mr',
    englishName: 'Marathi',
    nativeName: 'मराठी',
    intlLocale: 'mr-IN',
    scriptName: 'Devanagari',
  },
  {
    code: 'gu',
    englishName: 'Gujarati',
    nativeName: 'ગુજરાતી',
    intlLocale: 'gu-IN',
    scriptName: 'Gujarati',
  },
  {
    code: 'pa',
    englishName: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    intlLocale: 'pa-IN',
    scriptName: 'Gurmukhi',
  },
] as const;

export const TRANSLATION_TARGET_LANGUAGES = SUPPORTED_LANGUAGES.filter(
  (l) => l.code !== 'en'
);

export const SUPPORTED_LANGUAGE_CODES: readonly LanguageCode[] = SUPPORTED_LANGUAGES.map(
  (l) => l.code
);

export function isSupportedLanguage(value: string | null | undefined): value is LanguageCode {
  if (!value) return false;
  return SUPPORTED_LANGUAGE_CODES.includes(value as LanguageCode);
}

export function getLanguageOption(code: LanguageCode): LanguageOption {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
}
