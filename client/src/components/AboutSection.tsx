import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Sparkles, BookOpen, X } from 'lucide-react';

/**
 * AboutSection - Vintage coffee roaster label aesthetic
 * Introduces The Bean Keeper with warm, editorial style
 */

export default function AboutSection() {
  const { t } = useTranslation(['dashboard']);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('beankeeper_about_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('beankeeper_about_dismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <section className="relative mb-8 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-600">
      {/* Main container with vintage paper texture */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F5EFE7] via-[#E8DCC8] to-[#F5EFE7] p-6 md:p-8 shadow-[0_4px_20px_rgba(111,78,55,0.15)] border-2 border-[#D4C5B0]">

        {/* Decorative coffee stain watermark */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#6F4E37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8B6F47]/5 rounded-full blur-3xl" />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[#6F4E37]/10 transition-colors duration-200 group"
          aria-label="Dismiss about section"
        >
          <X className="w-4 h-4 text-[#6F4E37]/60 group-hover:text-[#6F4E37]" />
        </button>

        {/* Content */}
        <div className="relative">
          {/* Header with decorative border */}
          <div className="flex items-center justify-center mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              {/* Left coffee bean */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#6F4E37] opacity-60">
                <ellipse cx="12" cy="12" rx="7" ry="10" fill="currentColor" opacity="0.3" transform="rotate(-25 12 12)" />
                <path d="M7 12 Q12 10, 17 12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              </svg>

              <h2
                className="text-2xl md:text-3xl font-bold text-[#6F4E37] tracking-tight"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                About The Bean Keeper
              </h2>

              {/* Right coffee bean */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#6F4E37] opacity-60">
                <ellipse cx="12" cy="12" rx="7" ry="10" fill="currentColor" opacity="0.3" transform="rotate(25 12 12)" />
                <path d="M7 12 Q12 10, 17 12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              </svg>
            </div>
          </div>

          {/* Introduction text */}
          <p className="text-center text-[#6F4E37]/80 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed font-serif">
            Your personal coffee journal powered by AI.
            <span className="block mt-1 font-medium text-[#6F4E37]">
              Capture, remember, and celebrate every roast that tells your story.
            </span>
          </p>

          {/* Three-step process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            {/* Step 1 - Capture */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6F4E37]/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-[#D4C5B0]/50 hover:border-[#8B6F47] transition-all duration-300 hover:shadow-md">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6F4E37] to-[#8B6F47] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#6F4E37] mb-1 text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      1. Capture
                    </h3>
                    <p className="text-sm text-[#6F4E37]/70 font-serif leading-snug">
                      Snap photos of your coffee bags
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 - Extract */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B6F47]/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-[#D4C5B0]/50 hover:border-[#8B6F47] transition-all duration-300 hover:shadow-md">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B6F47] to-[#C4A57B] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#6F4E37] mb-1 text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      2. Extract
                    </h3>
                    <p className="text-sm text-[#6F4E37]/70 font-serif leading-snug">
                      AI reads roaster, origin, notes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 - Remember */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C4A57B]/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-[#D4C5B0]/50 hover:border-[#8B6F47] transition-all duration-300 hover:shadow-md">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4A57B] to-[#6F4E37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#6F4E37] mb-1 text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      3. Remember
                    </h3>
                    <p className="text-sm text-[#6F4E37]/70 font-serif leading-snug">
                      Build your coffee story
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer tagline */}
          <div className="text-center">
            <p className="text-[#6F4E37]/60 text-xs md:text-sm italic font-serif">
              Every great coffee deserves to be remembered
            </p>
          </div>
        </div>

        {/* Decorative corner stamps */}
        <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-[#6F4E37]/20 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-[#6F4E37]/20 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-[#6F4E37]/20 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-[#6F4E37]/20 rounded-br-lg" />
      </div>
    </section>
  );
}
