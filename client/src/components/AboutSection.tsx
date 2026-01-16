import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Sparkles, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * AboutSection - Vintage coffee roaster label aesthetic with collapsible toggle
 * Introduces The Bean Keeper with warm, editorial style
 */

interface AboutSectionProps {
  onOpenGuide?: () => void;
}

export default function AboutSection({ onOpenGuide }: AboutSectionProps) {
  const { t } = useTranslation(['dashboard']);
  const [isExpanded, setIsExpanded] = useState(true);

  // Collapsed state - shows minimal tab
  if (!isExpanded) {
    return (
      <section className="relative mb-4 animate-in fade-in duration-300">
        <button
          onClick={() => setIsExpanded(true)}
          className="group w-full relative overflow-hidden rounded-xl
            bg-gradient-to-r from-[#F5EFE7] via-[#E8DCC8] to-[#F5EFE7]
            border-2 border-[#D4C5B0]
            shadow-[0_2px_8px_rgba(111,78,55,0.1)]
            hover:shadow-[0_4px_12px_rgba(111,78,55,0.15)]
            transition-all duration-300
            hover:-translate-y-0.5
            px-4 py-3"
        >
          <div className="flex items-center justify-between">
            {/* Left: Coffee bean + Title */}
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#6F4E37] shrink-0">
                <ellipse cx="12" cy="12" rx="7" ry="10" fill="currentColor" opacity="0.3" transform="rotate(-25 12 12)" />
                <path d="M7 12 Q12 10, 17 12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              </svg>
              <span
                className="text-sm md:text-base font-bold text-[#6F4E37] tracking-tight"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {t('dashboard:about.title')}
              </span>
            </div>

            {/* Right: Expand hint */}
            <div className="flex items-center gap-2 text-[#6F4E37]/60 group-hover:text-[#6F4E37] transition-colors">
              <span className="text-xs font-serif hidden sm:inline">{t('dashboard:about.clickToExpand')}</span>
              <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Decorative fold line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B6F47]/30 to-transparent" />
        </button>
      </section>
    );
  }

  // Expanded state - full content
  return (
    <section className="relative mb-8 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-600">
      {/* Main container with vintage paper texture - Mobile optimized padding */}
      <div className="relative overflow-visible rounded-xl md:rounded-2xl bg-gradient-to-br from-[#F5EFE7] via-[#E8DCC8] to-[#F5EFE7] p-4 sm:p-6 md:p-8 pb-10 sm:pb-12 shadow-[0_4px_20px_rgba(111,78,55,0.15)] border-2 border-[#D4C5B0]">

        {/* Decorative coffee stain watermark */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#6F4E37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8B6F47]/5 rounded-full blur-3xl" />

        {/* Quick Guide Floating Card - Responsive Positioning */}
        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="group absolute top-2 left-2 sm:top-3 sm:left-3 z-10"
            aria-label="Open Quick Guide"
          >
            <div className="relative flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2
              bg-gradient-to-br from-white via-[#F5EFE7] to-[#E8DCC8]
              rounded-lg sm:rounded-xl
              border-2 border-[#8B6F47]/30
              shadow-[0_4px_12px_rgba(111,78,55,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)]
              group-hover:shadow-[0_6px_16px_rgba(111,78,55,0.3),inset_0_1px_3px_rgba(255,255,255,0.9)]
              transition-all duration-300
              group-hover:-translate-y-0.5
              active:translate-y-0">

              {/* Coffee cup icon - compact, smaller on mobile */}
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <clipPath id="cupShapeSmall">
                      <path d="M20 30 L25 85 Q50 90 75 85 L80 30 Z" />
                    </clipPath>
                    <linearGradient id="coffeeGradientSmall" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#8B6F47', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#6F4E37', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>

                  {/* Coffee fill */}
                  <rect
                    x="20"
                    y="85"
                    width="60"
                    height="60"
                    fill="url(#coffeeGradientSmall)"
                    clipPath="url(#cupShapeSmall)"
                    className="transition-all duration-500 ease-out group-hover:translate-y-[-45px]"
                  />

                  {/* Cup outline */}
                  <path
                    d="M20 30 L25 85 Q50 90 75 85 L80 30 Z"
                    fill="none"
                    stroke="#6F4E37"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Cup handle */}
                  <path
                    d="M80 40 Q95 45 95 55 Q95 65 80 70"
                    fill="none"
                    stroke="#6F4E37"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Steam wisps */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-1">
                  <svg width="4" height="12" className="animate-[steam_2s_ease-in-out_infinite]">
                    <path d="M2 12 Q1 9 2 6 Q3 3 2 0" stroke="#8B6F47" strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />
                  </svg>
                  <svg width="4" height="12" className="animate-[steam_2s_ease-in-out_0.3s_infinite]">
                    <path d="M2 12 Q3 9 2 6 Q1 3 2 0" stroke="#8B6F47" strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Text content - Show coffee cup only on smallest screens */}
              <div className="hidden min-[400px]:flex flex-col items-start">
                <span
                  className="text-[9px] sm:text-[10px] text-[#6F4E37] font-bold leading-tight tracking-wide"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {t('dashboard:about.quickGuide')}
                </span>
                <span className="text-[8px] sm:text-[9px] text-[#6F4E37]/60 font-serif leading-tight">
                  {t('dashboard:about.steps')}
                </span>
              </div>

              {/* Arrow hint - Hidden on mobile */}
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                className="hidden sm:block text-[#8B6F47] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 shrink-0"
              >
                <path
                  d="M6 12L10 8L6 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* "NEW" badge - Smaller on mobile */}
              <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5
                bg-gradient-to-br from-[#C4A57B] to-[#8B6F47]
                px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full
                shadow-[0_2px_6px_rgba(111,78,55,0.3)]
                rotate-12
                group-hover:rotate-6
                transition-all duration-200">
                <span className="text-white text-[7px] sm:text-[8px] font-bold tracking-wide"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {t('dashboard:about.new')}
                </span>
              </div>
            </div>

            {/* CSS for steam animation */}
            <style>{`
              @keyframes steam {
                0%, 100% {
                  transform: translateY(0) translateX(0);
                  opacity: 0.4;
                }
                50% {
                  transform: translateY(-4px) translateX(1px);
                  opacity: 0.1;
                }
              }
            `}</style>
          </button>
        )}

        {/* Content */}
        <div className="relative">
          {/* Header with decorative border - Mobile optimized */}
          <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Left coffee bean - Hide on small screens */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="hidden min-[400px]:block sm:w-5 sm:h-5 text-[#6F4E37] opacity-60">
                <ellipse cx="12" cy="12" rx="7" ry="10" fill="currentColor" opacity="0.3" transform="rotate(-25 12 12)" />
                <path d="M7 12 Q12 10, 17 12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              </svg>

              <h2
                className="text-lg min-[400px]:text-xl sm:text-2xl md:text-3xl font-bold text-[#6F4E37] tracking-tight text-center"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {t('dashboard:about.title')}
              </h2>

              {/* Right coffee bean - Hide on small screens */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="hidden min-[400px]:block sm:w-5 sm:h-5 text-[#6F4E37] opacity-60">
                <ellipse cx="12" cy="12" rx="7" ry="10" fill="currentColor" opacity="0.3" transform="rotate(25 12 12)" />
                <path d="M7 12 Q12 10, 17 12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              </svg>
            </div>
          </div>

          {/* Introduction text - Mobile optimized */}
          <p className="text-center text-[#6F4E37]/80 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed font-serif">
            {t('dashboard:about.intro')}
            <span className="block mt-1 font-medium text-[#6F4E37]">
              {t('dashboard:about.tagline')}
            </span>
          </p>

          {/* Three-step process - Mobile optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            {/* Step 1 - Capture - Mobile optimized */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6F4E37]/5 to-transparent rounded-lg sm:rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 border border-[#D4C5B0]/50 hover:border-[#8B6F47] transition-all duration-300 hover:shadow-md min-h-[120px] sm:min-h-0">
                <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#6F4E37] to-[#8B6F47] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#6F4E37] mb-1 text-base sm:text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      {t('dashboard:about.step1.title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6F4E37]/70 font-serif leading-snug">
                      {t('dashboard:about.step1.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 - Extract - Mobile optimized */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B6F47]/5 to-transparent rounded-lg sm:rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 border border-[#D4C5B0]/50 hover:border-[#8B6F47] transition-all duration-300 hover:shadow-md min-h-[120px] sm:min-h-0">
                <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#8B6F47] to-[#C4A57B] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#6F4E37] mb-1 text-base sm:text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      {t('dashboard:about.step2.title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6F4E37]/70 font-serif leading-snug">
                      {t('dashboard:about.step2.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 - Remember - Mobile optimized */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C4A57B]/5 to-transparent rounded-lg sm:rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 border border-[#D4C5B0]/50 hover:border-[#8B6F47] transition-all duration-300 hover:shadow-md min-h-[120px] sm:min-h-0">
                <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#C4A57B] to-[#6F4E37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#6F4E37] mb-1 text-base sm:text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      {t('dashboard:about.step3.title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6F4E37]/70 font-serif leading-snug">
                      {t('dashboard:about.step3.description')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#6F4E37]/50 font-serif mt-1 italic">
                      Build your coffee story and Sync to your Notion Database
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer tagline */}
          <div className="text-center">
            <p className="text-[#6F4E37]/60 text-xs md:text-sm italic font-serif">
              {t('dashboard:about.footer')}
            </p>
          </div>
        </div>

        {/* Decorative corner stamps */}
        <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-[#6F4E37]/20 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-[#6F4E37]/20 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-[#6F4E37]/20 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-[#6F4E37]/20 rounded-br-lg" />

        {/* Collapse toggle button - bottom center (arrow only) */}
        <button
          onClick={() => setIsExpanded(false)}
          className="group absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20
            w-10 h-10
            bg-gradient-to-br from-[#6F4E37] to-[#8B6F47]
            hover:from-[#8B6F47] hover:to-[#6F4E37]
            rounded-full
            flex items-center justify-center
            shadow-[0_4px_12px_rgba(111,78,55,0.3)]
            hover:shadow-[0_6px_20px_rgba(111,78,55,0.5)]
            transition-all duration-300
            hover:scale-110
            active:scale-95
            border-2 border-white"
          aria-label="Collapse section"
        >
          <ChevronUp className="w-5 h-5 text-white group-hover:-translate-y-0.5 transition-transform duration-200" />
        </button>
      </div>
    </section>
  );
}
