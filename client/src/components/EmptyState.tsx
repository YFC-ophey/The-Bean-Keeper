import { Button } from "@/components/ui/button";
import { Plus, Coffee } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  onAddClick: () => void;
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  const { t } = useTranslation('dashboard');
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 relative" data-testid="empty-state">
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
        className="organic-radius px-8 py-6 gap-2.5 shadow-lg hover:shadow-xl transition-all duration-300 font-serif font-semibold text-lg animate-scale-in bg-primary hover:bg-primary/90"
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
    </div>
  );
}
