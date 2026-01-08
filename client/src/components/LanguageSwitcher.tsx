import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '繁體中文' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-[#2C1810]/10 hover:border-[#2C1810]/20 transition-all duration-200 shadow-sm hover:shadow-md group"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-[#6F4E37] group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-sm font-medium text-[#2C1810] hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <svg
          className={`w-4 h-4 text-[#6F4E37] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-[#2C1810]/10 shadow-xl overflow-hidden z-50 animate-slide-down">
          {/* Decorative header */}
          <div className="h-1 bg-gradient-to-r from-[#6F4E37] via-[#8B6F47] to-[#6F4E37]" />

          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-[#F5EFE7] transition-colors duration-150 ${
                currentLanguage.code === language.code ? 'bg-[#F5EFE7]/50' : ''
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-[#2C1810]">{language.nativeName}</span>
                <span className="text-xs text-[#2C1810]/60">{language.name}</span>
              </div>
              {currentLanguage.code === language.code && (
                <svg
                  className="w-5 h-5 text-[#6F4E37]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
