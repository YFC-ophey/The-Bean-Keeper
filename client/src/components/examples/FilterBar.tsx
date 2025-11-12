import { useState } from "react";
import FilterBar from "../FilterBar";

export default function FilterBarExample() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(["Ethiopia", "Washed", "5 stars"]);

  return (
    <FilterBar
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activeFilters={filters}
      onRemoveFilter={(filter) => setFilters(filters.filter((f) => f !== filter))}
      onClearAll={() => setFilters([])}
    />
  );
}
