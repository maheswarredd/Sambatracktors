import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../translations/en.json';
import te from '../translations/te.json';
import hi from '../translations/hi.json';

const translations = { en, te, hi };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('samba_language') || 'te'; // Telugu default as requested
  });

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('samba_language', lang);
    }
  };

  // Helper function to get translation by nested key e.g. t('nav.home')
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let result = translations[language];

    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return key; // return raw key if missing
          }
        }
        result = fallback;
        break;
      }
    }

    if (typeof result === 'string') {
      let formatted = result;
      Object.keys(params).forEach((paramKey) => {
        formatted = formatted.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
      });
      return formatted;
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
