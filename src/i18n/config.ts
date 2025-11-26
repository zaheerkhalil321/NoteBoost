import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';
import zh from './zh.json';
import it from './it.json';
import pt from './pt.json';
import ja from './ja.json';
import ko from './ko.json';
import ru from './ru.json';
import hi from './hi.json';
import ar from './ar.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
  it: { translation: it },
  pt: { translation: pt },
  ja: { translation: ja },
  ko: { translation: ko },
  ru: { translation: ru },
  hi: { translation: hi },
  ar: { translation: ar },
};

// Get saved language or default to English
const initLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('app-language');
    return savedLanguage || 'en';
  } catch (error) {
    return 'en';
  }
};

// Initialize with a promise
const setupI18n = async () => {
  const language = await initLanguage();

  // Set RTL for Arabic on app start
  const languageConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
  const isRTL = languageConfig?.isRTL || false;

  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'en',
      compatibilityJSON: 'v4',
      interpolation: {
        escapeValue: false,
      },
    });
};

// Call setup
setupI18n();

export default i18n;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isRTL: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isRTL: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isRTL: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isRTL: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isRTL: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', isRTL: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', isRTL: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', isRTL: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', isRTL: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', isRTL: false },
];

// Save language preference
export const saveLanguagePreference = async (languageCode: string) => {
  try {
    await AsyncStorage.setItem('app-language', languageCode);

    // Handle RTL for Arabic
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    const isRTL = language?.isRTL || false;

    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // Note: App needs to restart for RTL changes to take effect
      // You can add a restart prompt here if needed
    }
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

