import './i18next.d.ts';
import i18n from 'i18next';
import * as RNLocalize from 'react-native-localize';

import en from './en.json';
import it from './it.json';
import { initReactI18next } from 'react-i18next';
// Import your other language file here

const resources = {
  en: { translation: en },
  it: { translation: it}
};

// Find the best available language from the phone settings
const locales = RNLocalize.getLocales();
const deviceLanguage = locales[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage, // Active language
    fallbackLng: 'en',    // Fallback if device language isn't supported
    interpolation: {
      escapeValue: false, // Not needed for react
    },
  });

export default i18n;
