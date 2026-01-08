import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Star as StarIcon } from "lucide-react";
import StarRating from "./StarRating";
import { CoffeeEntry } from "@shared/schema";
import { format } from "date-fns";
import { useState, memo } from "react";

interface CoffeeCardProps {
  entry: CoffeeEntry;
  onClick?: () => void;
  isHighestRated?: boolean;
  isRecent?: boolean;
}

function CoffeeCard({ entry, onClick, isHighestRated, isRecent }: CoffeeCardProps) {
  const [isFavorite, setIsFavorite] = useState(entry.purchaseAgain || false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Persist favorite status to backend
  };

  return (
    <Card
      className="group overflow-hidden cursor-pointer paper-card organic-radius card-float"
      onClick={onClick}
      data-testid={`card-coffee-${entry.id}`}
    >
      <div className="relative aspect-square sm:aspect-[3/4] overflow-hidden">
        <img
          src={entry.frontPhotoUrl}
          alt={`${entry.roasterName} coffee bag`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          style={{ willChange: 'transform' }}
          data-testid={`img-coffee-${entry.id}`}
        />
        {/* Enhanced gradient overlay with warmth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810]/90 via-[#2C1810]/30 to-transparent" />

        {/* Content overlay - Compact on mobile */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 space-y-1.5 sm:space-y-2">
          <h3
            className="text-white font-serif font-semibold text-base sm:text-xl mb-1 sm:mb-1.5 leading-tight tracking-tight drop-shadow-lg line-clamp-2"
            data-testid={`text-roaster-${entry.id}`}
          >
            {entry.roasterName}
          </h3>

          {/* Origin badges - split multi-country origins - Smaller on mobile */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center" data-testid={`text-origin-${entry.id}`}>
            {entry.origin && entry.origin.split(',').slice(0, 2).map((origin, i) => (
              <Badge
                key={i}
                className="bg-white/15 backdrop-blur-md border border-white/30 text-white font-medium text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shadow-lg hover:bg-white/25 transition-colors"
              >
                {origin.trim()}
              </Badge>
            ))}
            {entry.variety && (
              <>
                <span className="text-white/60 text-xs sm:text-sm">·</span>
                <Badge
                  className="bg-white/10 backdrop-blur-md border border-white/25 text-white/90 font-light text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shadow-lg"
                >
                  {entry.variety}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Date badge - top left corner - Smaller on mobile */}
        {entry.createdAt && (
          <Badge
            variant="secondary"
            className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-[#F5EFE7]/95 text-[#2C1810] backdrop-blur-sm border-0 shadow-lg font-medium text-[10px] sm:text-xs px-1.5 sm:px-2.5"
            data-testid={`badge-date-${entry.id}`}
          >
            <Calendar className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1 sm:mr-1.5" />
            {format(new Date(entry.createdAt), 'MMM d')}
          </Badge>
        )}

        {/* Special badges - top right corner - Compact on mobile */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1 sm:gap-2">
          {isHighestRated && (
            <Badge className="bg-[#D4AF37] hover:bg-[#D4AF37] text-white border-0 shadow-lg font-semibold text-[10px] sm:text-xs animate-scale-in px-1.5 sm:px-2.5">
              <StarIcon className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-0.5 sm:mr-1 fill-current" />
              Top
            </Badge>
          )}
          {isRecent && (
            <Badge className="bg-[#3D5A40] hover:bg-[#3D5A40] text-white border-0 shadow-lg font-semibold text-[10px] sm:text-xs animate-scale-in px-1.5 sm:px-2.5">
              New
            </Badge>
          )}
        </div>

        {/* Favorite button - appears on hover */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-[#2C1810]"
            }`}
          />
        </button>

        {/* Decorative corner accent - bottom right */}
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Card footer with enhanced styling and touch targets - Compact on mobile */}
      <div className="p-2.5 sm:p-4 bg-white min-h-[50px] sm:min-h-[60px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 sm:justify-between">
          {/* Star rating with touch padding */}
          <div className="min-h-[44px] flex items-center">
            {entry.rating ? (
              <StarRating rating={entry.rating} readonly size="sm" />
            ) : (
              <span className="text-sm text-muted-foreground font-light italic">Not yet rated</span>
            )}
          </div>
          {/* Badges with better spacing */}
          <div className="flex flex-wrap gap-2 min-h-[44px] items-center">
            {entry.roastLevel && (
              <Badge
                variant="outline"
                className="text-xs font-medium border-[#3D5A40] text-[#3D5A40] bg-[#3D5A40]/5 px-3 py-1"
                data-testid={`badge-roast-level-${entry.id}`}
              >
                {entry.roastLevel}
              </Badge>
            )}
            {entry.processMethod && (
              <Badge
                variant="outline"
                className="text-xs font-medium border-[#6F4E37] text-[#6F4E37] bg-[#6F4E37]/5 px-3 py-1"
                data-testid={`badge-process-${entry.id}`}
              >
                {entry.processMethod}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default memo(CoffeeCard, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.isHighestRated === nextProps.isHighestRated &&
    prevProps.isRecent === nextProps.isRecent
  );
});
