import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface CoffeeFiltersProps {
  activeRoastFilter: string | null;
  activeRatingFilter: number | null;
  activeOriginFilter: string | null;
  sortBy: string;
  origins: string[];
  onRoastFilterChange: (roast: string | null) => void;
  onRatingFilterChange: (rating: number | null) => void;
  onOriginFilterChange: (origin: string | null) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

export default function CoffeeFilters({
  activeRoastFilter,
  activeRatingFilter,
  activeOriginFilter,
  sortBy,
  origins,
  onRoastFilterChange,
  onRatingFilterChange,
  onOriginFilterChange,
  onSortChange,
  onClearFilters,
}: CoffeeFiltersProps) {
  const { t } = useTranslation(['dashboard', 'coffee']);
  const roastLevels = [
    { value: "Light", label: t('coffee:roastLevels.light') },
    { value: "Medium", label: t('coffee:roastLevels.medium') },
    { value: "Dark", label: t('coffee:roastLevels.dark') }
  ];
  const ratings = [5, 4, 3];

  const hasActiveFilters = activeRoastFilter || activeRatingFilter || activeOriginFilter;

  return (
    <div className="mb-6 space-y-4 animate-fade-in">
      {/* Filter section */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-muted-foreground min-h-[44px]">
          <Filter className="w-4 h-4" />
          <span className="font-serif font-medium text-sm">{t('dashboard:filters.all')}:</span>
        </div>

        {/* Filter buttons in grid on mobile */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
          {/* Roast Level Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeRoastFilter ? "default" : "outline"}
                className={`organic-radius font-serif text-sm min-h-[44px] px-4 ${
                  activeRoastFilter
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "border-2 hover:border-primary/50"
                }`}
              >
                {t('dashboard:filters.roastLevel')}: {activeRoastFilter ? roastLevels.find(r => r.value === activeRoastFilter)?.label : t('dashboard:filters.all')}
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent className="organic-radius">
            <DropdownMenuItem onClick={() => onRoastFilterChange(null)}>
              {t('dashboard:filters.all')}
            </DropdownMenuItem>
            {roastLevels.map((roast) => (
              <DropdownMenuItem key={roast.value} onClick={() => onRoastFilterChange(roast.value)}>
                {roast.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

          {/* Rating Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeRatingFilter ? "default" : "outline"}
                className={`organic-radius font-serif text-sm min-h-[44px] px-4 ${
                  activeRatingFilter
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "border-2 hover:border-primary/50"
                }`}
              >
                {t('dashboard:filters.rating')}: {activeRatingFilter ? `${activeRatingFilter}+ ★` : t('dashboard:filters.all')}
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent className="organic-radius">
            <DropdownMenuItem onClick={() => onRatingFilterChange(null)}>
              {t('dashboard:filters.all')}
            </DropdownMenuItem>
            {ratings.map((rating) => (
              <DropdownMenuItem key={rating} onClick={() => onRatingFilterChange(rating)}>
                {rating}+ ★
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

          {/* Origin Filter */}
          {origins.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={activeOriginFilter ? "default" : "outline"}
                  className={`organic-radius font-serif text-sm min-h-[44px] px-4 ${
                    activeOriginFilter
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                      : "border-2 hover:border-primary/50"
                  }`}
                >
                  {t('dashboard:filters.origin')}: {activeOriginFilter || t('dashboard:filters.all')}
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="organic-radius max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => onOriginFilterChange(null)}>
                  {t('dashboard:filters.all')}
                </DropdownMenuItem>
                {origins.map((origin) => (
                  <DropdownMenuItem key={origin} onClick={() => onOriginFilterChange(origin)}>
                    {origin}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Sort moved to separate row on mobile */}
      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
        <span className="font-serif font-medium text-sm text-muted-foreground">{t('dashboard:filters.sortBy')}:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="organic-radius font-serif text-sm min-h-[44px] px-4 border-2">
              {sortBy === "newest" && t('dashboard:filters.newest')}
              {sortBy === "oldest" && t('dashboard:filters.oldest')}
              {sortBy === "highest-rated" && t('dashboard:filters.rating_high')}
              {sortBy === "lowest-rated" && t('dashboard:filters.rating_low')}
              {sortBy === "roaster-az" && t('dashboard:filters.name')}
              <ChevronDown className="w-3 h-3 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="organic-radius">
            <DropdownMenuItem onClick={() => onSortChange("newest")}>
              {t('dashboard:filters.newest')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("oldest")}>
              {t('dashboard:filters.oldest')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("highest-rated")}>
              {t('dashboard:filters.rating_high')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("lowest-rated")}>
              {t('dashboard:filters.rating_low')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("roaster-az")}>
              {t('dashboard:filters.name')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap animate-slide-in-up">
          <span className="text-xs font-serif text-muted-foreground">{t('dashboard:filters.activeFilters')}:</span>

          {activeRoastFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 organic-radius cursor-pointer hover:bg-secondary/80 min-h-[36px] px-3"
              onClick={() => onRoastFilterChange(null)}
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('dashboard:filters.roastLevel')}: {roastLevels.find(r => r.value === activeRoastFilter)?.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}

          {activeRatingFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 organic-radius cursor-pointer hover:bg-secondary/80 min-h-[36px] px-3"
              onClick={() => onRatingFilterChange(null)}
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {activeRatingFilter}+ ★
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}

          {activeOriginFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 organic-radius cursor-pointer hover:bg-secondary/80 min-h-[36px] px-3"
              onClick={() => onOriginFilterChange(null)}
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('dashboard:filters.origin')}: {activeOriginFilter}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-auto py-1 px-2 text-xs font-serif min-h-[36px]"
          >
            {t('dashboard:filters.clearAll')}
          </Button>
        </div>
      )}
    </div>
  );
}
