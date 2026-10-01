import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'te', label: 'తెలుగు', name: 'Telugu' },
  { code: 'en', label: 'English', name: 'English' },
  { code: 'hi', label: 'हिन्दी', name: 'Hindi' }
];

export const LanguageSelector = ({ variant = 'default' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 bg-emerald-950/20 p-1 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
      <Globe className="w-4 h-4 text-emerald-400 ml-1.5" />
      <div className="flex items-center gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
              language === lang.code
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-900/40 scale-105'
                : 'text-emerald-100/80 hover:text-white hover:bg-emerald-800/40'
            }`}
            title={lang.name}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
