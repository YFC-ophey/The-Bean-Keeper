import { HelpCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface HelpButtonProps {
  onClick: () => void;
}

export default function HelpButton({ onClick }: HelpButtonProps) {
  const { t } = useTranslation(['common']);

  return (
    <button
      onClick={onClick}
      className="group fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#6F4E37] to-[#8B6F47] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
      aria-label={t('common:ui.openUserGuide')}
    >
      {/* Pulsing ring effect */}
      <div className="absolute inset-0 rounded-full bg-[#6F4E37]/30 animate-ping" />

      {/* Icon */}
      <HelpCircle className="w-7 h-7 md:w-8 md:h-8 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />

      {/* Tooltip */}
      <div className="absolute right-full mr-3 px-3 py-2 bg-[#2C1810] text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {t('common:ui.quickGuide')}
        {/* Arrow */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-px">
          <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-[#2C1810]" />
        </div>
      </div>

      {/* Decorative coffee bean dots */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F5EFE7] border-2 border-[#6F4E37] animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
    </button>
  );
}
