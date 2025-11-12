import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: string[];
  onRemoveFilter: (filter: string) => void;
  onClearAll: () => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: FilterBarProps) {
  return (
    <div className="space-y-4" data-testid="filter-bar">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by roaster, origin, or variety..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="gap-1 hover-elevate active-elevate-2"
              data-testid={`badge-filter-${filter}`}
            >
              {filter}
              <button
                onClick={() => onRemoveFilter(filter)}
                className="ml-1 rounded-sm hover-elevate"
                data-testid={`button-remove-filter-${filter}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-auto py-1 px-2 text-xs"
            data-testid="button-clear-filters"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
