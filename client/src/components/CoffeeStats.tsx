import { Coffee, Globe, MapPin, Star, ChevronDown, ChevronUp } from "lucide-react";
import { CoffeeEntry } from "@shared/schema";
import { useState, useMemo } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslation } from "react-i18next";

interface CoffeeStatsProps {
  entries: CoffeeEntry[];
}

export default function CoffeeStats({ entries }: CoffeeStatsProps) {
  const { t } = useTranslation('dashboard');
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Calculate statistics (memoized for performance)
  const stats = useMemo(() => {
    const totalBeans = entries.length;

    // Extract unique countries/origins
    const origins = entries
      .map(e => e.origin)
      .filter((origin): origin is string => !!origin);
    const uniqueOrigins = new Set(origins);
    const countriesCount = uniqueOrigins.size;

    // Find most common origin (favorite region)
    const originCounts: Record<string, number> = {};
    origins.forEach(origin => {
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });
    const favoriteRegion = Object.entries(originCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || "—";

    // Calculate average rating
    const ratedEntries = entries.filter(e => e.rating !== null);
    const avgRating = ratedEntries.length > 0
      ? (ratedEntries.reduce((sum, e) => sum + (e.rating || 0), 0) / ratedEntries.length).toFixed(1)
      : "—";

    return { totalBeans, countriesCount, favoriteRegion, avgRating };
  }, [entries]);

  if (stats.totalBeans === 0) return null;

  // Mobile: Compact summary view
  if (isMobile && !isExpanded) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 bg-gradient-to-r from-[#6F4E37] to-[#4A3020] rounded-2xl text-white flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <Coffee className="w-5 h-5" />
            <div className="text-left">
              <p className="font-serif font-semibold text-base">
                {stats.totalBeans} {t('stats.beans')} · {stats.countriesCount} {t('stats.countries')}
              </p>
              <p className="text-xs text-white/70 font-serif">
                {stats.avgRating !== "—" && `★ ${stats.avgRating}`}
              </p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 flex-shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Mobile: Collapse button */}
      {isMobile && isExpanded && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setIsExpanded(false)}
            className="text-sm text-[#2C1810]/60 hover:text-[#2C1810] flex items-center gap-1 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            {t('common:buttons.back', { defaultValue: 'Show less' })}
          </button>
        </div>
      )}

      {/* Editorial Section Header */}
      <div className="mb-6 border-b border-[#2C1810]/10 pb-4">
        <h2 className="text-2xl font-serif font-bold text-[#2C1810] tracking-tight flex items-center gap-3">
          {t('stats.journey')}
          <span className="inline-block w-12 h-[2px] bg-gradient-to-r from-[#6F4E37] to-transparent"></span>
        </h2>
        <p className="text-sm text-[#2C1810]/60 font-serif italic mt-1">
          {t('stats.subtitle')}
        </p>
      </div>

      {/* Asymmetric Editorial Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Featured Stat - Total Beans (Large Card) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 stat-card-editorial stat-card-large group">
          <div className="relative overflow-hidden h-full bg-gradient-to-br from-[#6F4E37] to-[#4A3020] rounded-2xl p-6 md:p-8 shadow-2xl">
            {/* Decorative coffee bean pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <ellipse cx="100" cy="100" rx="45" ry="65" fill="currentColor" className="text-white" transform="rotate(-25 100 100)"/>
                <path d="M 100 60 Q 85 100 100 140" stroke="currentColor" strokeWidth="3" fill="none" className="text-white/40"/>
              </svg>
            </div>

            <div className="relative z-10">
              <Coffee className="w-8 h-8 text-white/80 mb-4" strokeWidth={1.5} />
              <p className="text-white/70 text-xs font-serif uppercase tracking-[0.2em] mb-3">{t('stats.totalCollection')}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl md:text-7xl font-serif font-bold text-white leading-none tracking-tight">
                  {stats.totalBeans}
                </span>
                <span className="text-lg md:text-xl font-serif text-white/60">{t('stats.beans')}</span>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-white/50 text-xs font-serif italic">
                  {stats.totalBeans > 10 ? t('stats.connoisseur') : t('stats.building')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 grid grid-cols-2 gap-4">
          {/* Countries */}
          <div className="stat-card-editorial bg-white rounded-2xl p-6 shadow-lg border border-[#2C1810]/5 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col h-full">
              <div className="mb-auto">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#3D5A40]/10 mb-4">
                  <Globe className="w-6 h-6 text-[#3D5A40]" strokeWidth={1.5} />
                </div>
                <p className="text-[#2C1810]/50 text-[10px] font-serif uppercase tracking-[0.2em] mb-2">{t('stats.originsExplored')}</p>
              </div>
              <div>
                <div className="text-3xl md:text-5xl font-serif font-bold text-[#3D5A40] leading-none mb-1">
                  {stats.countriesCount}
                </div>
                <p className="text-xs text-[#2C1810]/40 font-serif">{t('stats.countries')}</p>
              </div>
            </div>
          </div>

          {/* Favorite Region */}
          <div className="stat-card-editorial bg-gradient-to-br from-[#F5EFE7] to-[#E8DCC8] rounded-2xl p-6 shadow-lg border border-[#C4A57B]/20 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col h-full">
              <div className="mb-auto">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/60 mb-4">
                  <MapPin className="w-6 h-6 text-[#6F4E37]" strokeWidth={1.5} />
                </div>
                <p className="text-[#2C1810]/50 text-[10px] font-serif uppercase tracking-[0.2em] mb-2">{t('stats.mostLoved')}</p>
              </div>
              <div>
                <div className="text-2xl font-serif font-bold text-[#6F4E37] leading-tight mb-1 line-clamp-2">
                  {stats.favoriteRegion}
                </div>
                <p className="text-xs text-[#2C1810]/40 font-serif">{t('stats.topOrigin')}</p>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="col-span-2 stat-card-editorial bg-white rounded-2xl p-6 shadow-lg border border-[#2C1810]/5 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10">
                  <Star className="w-7 h-7 text-[#D4AF37] fill-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[#2C1810]/50 text-[10px] font-serif uppercase tracking-[0.2em] mb-2">{t('stats.averageQuality')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-5xl font-serif font-bold text-[#D4AF37] leading-none">
                      {stats.avgRating === "—" ? "—" : stats.avgRating}
                    </span>
                    {stats.avgRating !== "—" && (
                      <>
                        <span className="text-2xl text-[#D4AF37]/60">/</span>
                        <span className="text-xl text-[#D4AF37]/60">5.0</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      stats.avgRating !== "—" && parseFloat(stats.avgRating) >= star
                        ? "text-[#D4AF37] fill-[#D4AF37]"
                        : "text-[#2C1810]/10"
                    }`}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative divider */}
      <div className="mt-8 flex items-center gap-3 opacity-20">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#2C1810] to-transparent" />
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6F4E37]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#3D5A40]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#C4A57B]" />
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#2C1810] to-transparent" />
      </div>
    </div>
  );
}
