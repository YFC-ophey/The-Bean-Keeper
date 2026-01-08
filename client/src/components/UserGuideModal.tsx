import { X, ChevronLeft, ChevronRight, Camera, Sparkles, CheckCircle2, Coffee } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const { t } = useTranslation('guide');
  const [currentSlide, setCurrentSlide] = useState(0);

  const guideSteps = [
    {
      step: 1,
      title: t('steps.1.title'),
      description: t('steps.1.description'),
      icon: Camera,
      color: "from-[#8B4513] to-[#6F4E37]",
      imagePlaceholder: "📸",
      details: t('steps.1.details'),
    },
    {
      step: 2,
      title: t('steps.2.title'),
      description: t('steps.2.description'),
      icon: Sparkles,
      color: "from-[#D4A574] to-[#B8860B]",
      imagePlaceholder: "✨",
      details: t('steps.2.details'),
    },
    {
      step: 3,
      title: t('steps.3.title'),
      description: t('steps.3.description'),
      icon: CheckCircle2,
      color: "from-[#CD853F] to-[#8B6F47]",
      imagePlaceholder: "🗺️",
      details: t('steps.3.details'),
    },
    {
      step: 4,
      title: t('steps.4.title'),
      description: t('steps.4.description'),
      icon: Coffee,
      color: "from-[#6F4E37] to-[#4B2E24]",
      imagePlaceholder: "☕",
      details: t('steps.4.details'),
    },
  ];

  if (!isOpen) return null;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % guideSteps.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + guideSteps.length) % guideSteps.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop with coffee tint */}
      <div className="absolute inset-0 bg-[#2C1810]/70 backdrop-blur-md" />

      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl animate-slide-up"
      >
        {/* Decorative coffee stains */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#6F4E37]/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#8B6F47]/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

        {/* Modal Card - Coffee Book Aesthetic */}
        <div className="relative bg-gradient-to-br from-[#F5EFE7] via-[#F0E6D2] to-[#E8DCC8] rounded-3xl shadow-2xl overflow-hidden border-4 border-[#D4C5B0]">
          {/* Vintage paper texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px'
            }}
          />

          {/* Decorative top border - vintage book spine */}
          <div className="h-3 bg-gradient-to-r from-[#6F4E37] via-[#8B6F47] via-[#A0826D] to-[#6F4E37]" />

          {/* Coffee stain rings decoration */}
          <div className="absolute top-8 right-12 w-16 h-16 rounded-full border-4 border-[#8B6F47]/20 opacity-40" />
          <div className="absolute top-10 right-14 w-12 h-12 rounded-full border-3 border-[#6F4E37]/15 opacity-30" />

          {/* Header */}
          <div className="relative p-6 md:p-8 border-b-2 border-[#D4C5B0]/60">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center rounded-full bg-[#6F4E37]/10 hover:bg-[#6F4E37]/20 transition-all duration-300 group shadow-md hover:shadow-lg"
              aria-label="Close guide"
            >
              <X className="w-5 h-5 text-[#6F4E37] group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <div className="pr-14">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2C1810] mb-3 tracking-tight">
                {t('header.title')}
              </h2>
              <p className="text-[#6F4E37] font-serif italic text-base md:text-lg">
                {t('header.subtitle')}
              </p>
            </div>
          </div>

          {/* Carousel Section */}
          <div className="p-6 md:p-8 lg:p-10">
            <div className="relative">
              {/* Main carousel container */}
              <div className="relative overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {guideSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.step}
                        className="w-full flex-shrink-0"
                      >
                        <div className="bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-[#D4C5B0]/50 shadow-lg overflow-hidden">
                          {/* Step Image/Visual Area */}
                          <div className={`relative aspect-[16/9] bg-gradient-to-br ${step.color} flex items-center justify-center overflow-hidden`}>
                            {/* Decorative elements */}
                            <div className="absolute inset-0 opacity-10">
                              <div className="absolute top-4 left-4 w-32 h-32 border-2 border-white rounded-full" />
                              <div className="absolute bottom-4 right-4 w-40 h-40 border-2 border-white rounded-full" />
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-full" />
                            </div>

                            {/* Vintage coffee stamp background */}
                            <div className="absolute inset-0 opacity-5" style={{
                              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
                            }} />

                            {/* Main icon/placeholder */}
                            <div className="relative z-10 text-center">
                              <div className="mb-6 transform hover:scale-110 transition-transform duration-500">
                                <Icon className="w-32 h-32 md:w-40 md:h-40 text-white/90 mx-auto drop-shadow-2xl" strokeWidth={1.5} />
                              </div>

                              {/* Large emoji placeholder for visual interest */}
                              <div className="text-8xl md:text-9xl opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                {step.imagePlaceholder}
                              </div>
                            </div>

                            {/* Step number badge - vintage stamp style */}
                            <div className="absolute top-4 left-4 md:top-6 md:left-6">
                              <div className="relative">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl border-3 border-white/50 transform -rotate-12">
                                  <span className="text-2xl md:text-3xl font-bold text-[#6F4E37] font-serif">
                                    {step.step}
                                  </span>
                                </div>
                                {/* Stamp texture overlay */}
                                <div className="absolute inset-0 rounded-full" style={{
                                  backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 50%)`
                                }} />
                              </div>
                            </div>
                          </div>

                          {/* Step Content */}
                          <div className="p-6 md:p-8">
                            <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#2C1810] mb-3 tracking-tight">
                              {step.title}
                            </h3>
                            <p className="text-[#6F4E37] text-base md:text-lg mb-4 leading-relaxed">
                              {step.description}
                            </p>
                            <p className="text-[#8B6F47] text-sm md:text-base leading-relaxed border-l-4 border-[#D4C5B0] pl-4 italic">
                              {step.details}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Arrows - Vintage Book Page Style */}
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#F5EFE7] to-[#E8DCC8] border-3 border-[#D4C5B0] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group z-10"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-[#6F4E37] group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#F5EFE7] to-[#E8DCC8] border-3 border-[#D4C5B0] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group z-10"
                aria-label="Next step"
              >
                <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-[#6F4E37] group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>

              {/* Navigation Dots - Coffee Beans */}
              <div className="flex justify-center gap-3 mt-6 md:mt-8">
                {guideSteps.map((step, index) => (
                  <button
                    key={step.step}
                    onClick={() => goToSlide(index)}
                    className={`group transition-all duration-300 ${
                      currentSlide === index ? 'scale-100' : 'scale-75 opacity-50'
                    }`}
                    aria-label={`Go to step ${step.step}`}
                  >
                    {/* Coffee bean shaped indicator */}
                    <div className="relative">
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                        currentSlide === index
                          ? 'bg-gradient-to-br from-[#6F4E37] to-[#8B6F47] shadow-lg'
                          : 'bg-[#D4C5B0]/60 group-hover:bg-[#D4C5B0]'
                      }`}>
                        {/* Coffee bean center line */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px ${
                          currentSlide === index ? 'bg-white/30' : 'bg-[#8B6F47]/30'
                        }`} />
                      </div>

                      {/* Step number inside bean */}
                      <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold ${
                        currentSlide === index ? 'text-white' : 'text-[#6F4E37]/70'
                      }`}>
                        {step.step}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-[#F5EFE7] via-[#F0E6D2] to-[#E8DCC8] border-t-2 border-[#D4C5B0]/60">
            <div className="flex items-center justify-between gap-4">
              {/* Progress indicator */}
              <div className="hidden md:flex items-center gap-2 text-sm text-[#6F4E37]/70 font-medium">
                <Coffee className="w-4 h-4" />
                <span>{t('footer.progress', { current: currentSlide + 1, total: guideSteps.length })}</span>
              </div>

              {/* CTA Button */}
              <button
                onClick={onClose}
                className="flex-1 md:flex-initial py-3 md:py-4 px-8 md:px-12 bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] text-white font-bold text-base md:text-lg rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg border-2 border-[#5D4029]/20"
              >
                {currentSlide === guideSteps.length - 1 ? t('footer.startTracking') : t('footer.gotIt')}
              </button>
            </div>
          </div>

          {/* Decorative bottom border */}
          <div className="h-2 bg-gradient-to-r from-transparent via-[#6F4E37]/40 to-transparent" />
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Smooth carousel transitions */
        @media (prefers-reduced-motion: reduce) {
          .transition-transform {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
