import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKeys } from '../lib/translations';
import * as Localization from 'expo-localization';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationKeys;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('user_language');
        if (savedLang && (savedLang === 'en' || savedLang === 'so' || savedLang === 'ar')) {
          setLangState(savedLang as Language);
        } else {
          // Detect system language safely using modern API
          const locales = Localization.getLocales();
          const systemLang = locales && locales.length > 0 ? locales[0].languageCode : 'en';
          
          if (systemLang === 'so' || systemLang === 'ar') {
            setLangState(systemLang as Language);
          } else {
            setLangState('en');
          }
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('user_language', lang);
      setLangState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t: translations[language],
      isRTL 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
