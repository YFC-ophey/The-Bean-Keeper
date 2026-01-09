import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Coffee, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  onAddClick: () => void;
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  const { t } = useTranslation('dashboard');
  const [isExpanded, setIsExpanded] = useState(true);

  // Collapsed state - shows compact CTA
  if (!isExpanded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[20vh] px-4 relative animate-in fade-in duration-300">
        <button
          onClick={() => setIsExpanded(true)}
          className="group w-full max-w-2xl relative overflow-hidden rounded-xl
            bg-gradient-to-r from-[#F5EFE7] via-[#E8DCC8] to-[#F5EFE7]
            border-2 border-[#D4C5B0]
            shadow-[0_2px_8px_rgba(111,78,55,0.1)]
            hover:shadow-[0_4px_12px_rgba(111,78,55,0.15)]
            transition-all duration-300
            hover:-translate-y-0.5
            px-6 py-4"
        >
          <div className="flex items-center justify-between">
            {/* Left: Coffee icon + Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F5EFE7] to-white shadow-md border-2 border-[#D4C5B0]">
                <Coffee className="w-6 h-6 text-[#6F4E37]" strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <h3
                  className="text-base md:text-lg font-bold text-[#6F4E37] tracking-tight"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {t('empty.title')}
                </h3>
                <p className="text-xs text-[#6F4E37]/60 font-serif">
                  Click to start your journey
                </p>
              </div>
            </div>

            {/* Right: Expand hint */}
            <div className="flex items-center gap-2 text-[#6F4E37]/60 group-hover:text-[#6F4E37] transition-colors">
              <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Decorative fold line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B6F47]/30 to-transparent" />
        </button>
      </div>
    );
  }

  // Expanded state - full empty state
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 relative animate-in fade-in slide-in-from-bottom-4 duration-600" data-testid="empty-state">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C4A57B]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#3D5A40]/10 rounded-full blur-3xl -z-10" />

      {/* Coffee icon with decorative ring */}
      <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4A57B]/20 to-[#3D5A40]/20 rounded-full blur-xl" />
        <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F5EFE7] to-white shadow-xl border-4 border-white">
          <Coffee className="w-16 h-16 text-[#6F4E37]" strokeWidth={1.5} />
        </div>
      </div>

      {/* Text content */}
      <h2 className="text-3xl md:text-4xl font-serif font-bold mb-3 text-foreground tracking-tight text-center" data-testid="text-empty-title">
        {t('empty.title')}
      </h2>
      <p className="text-muted-foreground text-center mb-2 max-w-lg font-serif text-lg leading-relaxed" data-testid="text-empty-description">
        {t('empty.subtitle')}
      </p>
      <p className="text-muted-foreground/80 text-center mb-10 max-w-md font-serif text-sm italic">
        {t('empty.description')}
      </p>

      {/* Call to action button */}
      <Button
        onClick={onAddClick}
        size="lg"
        className="organic-radius px-8 py-6 gap-2.5 shadow-lg hover:shadow-xl transition-all duration-300 font-serif font-semibold text-lg animate-scale-in bg-primary hover:bg-primary/90 mb-12"
        data-testid="button-add-first-coffee"
      >
        <Plus className="w-5 h-5" />
        {t('empty.action')}
      </Button>

      {/* Decorative coffee beans */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 opacity-20">
        <div className="w-3 h-3 rounded-full bg-[#6F4E37]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#6F4E37] mt-1" />
        <div className="w-3.5 h-3.5 rounded-full bg-[#6F4E37] -mt-1" />
      </div>

      {/* Collapse toggle button - bottom center (arrow only) */}
      <button
        onClick={() => setIsExpanded(false)}
        className="group absolute bottom-4 left-1/2 -translate-x-1/2
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
  );
}
