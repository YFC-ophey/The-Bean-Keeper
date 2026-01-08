import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import CoffeeCard from "@/components/CoffeeCard";
import AddCoffeeForm from "@/components/AddCoffeeForm";
import EditCoffeeForm from "@/components/EditCoffeeForm";
import RatingModal from "@/components/RatingModal";
import CoffeeDetail from "@/components/CoffeeDetail";
import EmptyState from "@/components/EmptyState";
import CoffeeStats from "@/components/CoffeeStats";
import CoffeeFilters from "@/components/CoffeeFilters";
import ScrollSidebar from "@/components/ScrollSidebar";
import UserGuideModal from "@/components/UserGuideModal";
import HelpButton from "@/components/HelpButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotionButton from "@/components/NotionButton";
import AboutSection from "@/components/AboutSection";
import { CoffeeEntry } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CoffeeEntry | null>(null);
  const [editEntry, setEditEntry] = useState<CoffeeEntry | null>(null);
  const [pendingEntry, setPendingEntry] = useState<CoffeeEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeRoastFilter, setActiveRoastFilter] = useState<string | null>(null);
  const [activeRatingFilter, setActiveRatingFilter] = useState<number | null>(null);
  const [activeOriginFilter, setActiveOriginFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const { toast } = useToast();

  // Scroll-aware header state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const ticking = useRef(false);

  // Handle scroll to show/hide header (throttled with requestAnimationFrame)
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const lastScrollY = lastScrollYRef.current;

          // Only update state when visibility CHANGES
          if (currentScrollY < 10) {
            if (!isHeaderVisible) setIsHeaderVisible(true);
          } else if (currentScrollY < lastScrollY) {
            if (!isHeaderVisible) setIsHeaderVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
            if (isHeaderVisible) setIsHeaderVisible(false);
          }

          lastScrollYRef.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHeaderVisible]);

  const { data: entries = [], isLoading } = useQuery<CoffeeEntry[]>({
    queryKey: ["/api/coffee-entries"],
  });

  const handleAddCoffee = async (frontPhotoUrl: string, backPhotoUrl: string | null, data: {
    roasterName: string;
    roasterWebsite?: string;
    farm?: string;
    origin?: string;
    variety?: string;
    processMethod?: string;
    roastDate?: string;
    flavorNotes?: string;
    weight?: string;
    price?: string;
  }) => {
    try {
      const response = await apiRequest("POST", "/api/coffee-entries", {
        frontPhotoUrl,
        backPhotoUrl,
        roasterName: data.roasterName,
        roasterLocation: null,
        farm: data.farm || null,
        origin: data.origin || null,
        variety: data.variety || null,
        processMethod: data.processMethod || null,
        roastDate: data.roastDate || null,
        flavorNotes: data.flavorNotes
          ? data.flavorNotes.split(",").map(f => f.trim()).filter(f => f.length > 0)
          : null,
        roasterAddress: null,
        roasterWebsite: data.roasterWebsite || null,
        rating: null,
        tastingNotes: null,
        weight: data.weight || null,
        price: data.price || null,
      });

      const newEntry = await response.json() as CoffeeEntry;
      await queryClient.invalidateQueries({ queryKey: ["/api/coffee-entries"] });
      
      setPendingEntry(newEntry);
      setShowAddForm(false);
      setShowRatingModal(true);

      toast({
        title: (
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.724 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#fff"/>
            </svg>
            <span>Coffee added to Notion!</span>
          </div>
        ),
        description: "Now rate your coffee experience.",
      });
    } catch (error) {
      console.error("Error adding coffee:", error);
      toast({
        title: "Error",
        description: "Failed to add coffee entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveRating = async (rating: number, notes: string, purchaseAgain: boolean) => {
    if (!pendingEntry) return;

    try {
      // Build update payload - only include fields that have changed
      const updates: {
        rating?: number | null;
        tastingNotes?: string | null;
        purchaseAgain: boolean;
      } = {
        purchaseAgain,
      };

      // Update rating only if user provided one
      if (rating > 0) {
        updates.rating = rating;
        // Only include notes if user typed something (empty means don't change)
        if (notes) {
          updates.tastingNotes = notes;
        }
      } else if (pendingEntry.rating) {
        // Preserve existing rating if user didn't change it
        updates.rating = pendingEntry.rating;
        // Only include notes if user typed something
        if (notes) {
          updates.tastingNotes = notes;
        }
      } else {
        // No existing rating and no new rating - that's fine for purchaseAgain-only updates
        // Only include notes if user typed something
        if (notes) {
          updates.tastingNotes = notes;
        }
      }

      await apiRequest("PATCH", `/api/coffee-entries/${pendingEntry.id}`, updates);

      await queryClient.invalidateQueries({ queryKey: ["/api/coffee-entries"] });
      setPendingEntry(null);
      setShowRatingModal(false);

      toast({
        title: "Rating saved!",
        description: "Your coffee has been rated.",
      });
    } catch (error) {
      console.error("Error saving rating:", error);
      toast({
        title: "Error",
        description: "Failed to save rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditCoffee = async (data: {
    roasterName: string;
    roasterWebsite?: string;
    farm?: string;
    origin?: string;
    variety?: string;
    processMethod?: string;
    roastDate?: string;
    flavorNotes?: string;
    rating?: number;
    tastingNotes?: string;
    weight?: string;
    price?: string;
    purchaseAgain?: boolean;
  }) => {
    if (!editEntry) return;

    try {
      await apiRequest("PATCH", `/api/coffee-entries/${editEntry.id}`, {
        roasterName: data.roasterName,
        roasterWebsite: data.roasterWebsite || null,
        farm: data.farm || null,
        origin: data.origin || null,
        variety: data.variety || null,
        processMethod: data.processMethod || null,
        roastDate: data.roastDate || null,
        flavorNotes: data.flavorNotes
          ? data.flavorNotes.split(",").map(f => f.trim()).filter(f => f.length > 0)
          : null,
        rating: data.rating || null,
        tastingNotes: data.tastingNotes || null,
        weight: data.weight || null,
        price: data.price || null,
        purchaseAgain: data.purchaseAgain ?? false,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/coffee-entries"] });
      setEditEntry(null);
      setShowEditForm(false);
      setSelectedEntry(null);

      toast({
        title: "Changes saved!",
        description: "Your coffee entry has been updated.",
      });
    } catch (error) {
      console.error("Error editing coffee:", error);
      toast({
        title: "Error",
        description: "Failed to update coffee entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoffee = async (entryId: string) => {
    try {
      await apiRequest("DELETE", `/api/coffee-entries/${entryId}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/coffee-entries"] });
      setSelectedEntry(null);

      toast({
        title: "Coffee deleted",
        description: "Your coffee entry has been removed.",
      });
    } catch (error) {
      console.error("Error deleting coffee:", error);
      toast({
        title: "Error",
        description: "Failed to delete coffee entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get unique origins for filter dropdown - split comma-separated origins
  const uniqueOrigins = useMemo(() =>
    Array.from(
      new Set(
        entries
          .map(e => e.origin)
          .filter((origin): origin is string => !!origin)
          .flatMap(origin => origin.split(',').map(o => o.trim()))
      )
    ).sort(),
    [entries]
  );

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() =>
    entries
      .filter(entry => {
        // Search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            entry.roasterName.toLowerCase().includes(query) ||
            entry.origin?.toLowerCase().includes(query) ||
            entry.variety?.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        // Roast level filter
        if (activeRoastFilter && entry.roastLevel !== activeRoastFilter) {
          return false;
        }

        // Rating filter
        if (activeRatingFilter && (!entry.rating || entry.rating < activeRatingFilter)) {
          return false;
        }

        // Origin filter - supports comma-separated origins (e.g., "Brazil, Rwanda")
        if (activeOriginFilter && entry.origin) {
          const origins = entry.origin.split(',').map(o => o.trim());
          if (!origins.includes(activeOriginFilter)) {
            return false;
          }
        } else if (activeOriginFilter && !entry.origin) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "highest-rated":
            return (b.rating || 0) - (a.rating || 0);
          case "lowest-rated":
            return (a.rating || 0) - (b.rating || 0);
          case "roaster-az":
            return a.roasterName.localeCompare(b.roasterName);
          default:
            return 0;
        }
      }),
    [entries, searchQuery, activeRoastFilter, activeRatingFilter, activeOriginFilter, sortBy]
  );

  // Identify special entries
  const highestRating = useMemo(() =>
    Math.max(...entries.map(e => e.rating || 0)),
    [entries]
  );

  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);

  const handleClearFilters = () => {
    setActiveRoastFilter(null);
    setActiveRatingFilter(null);
    setActiveOriginFilter(null);
  };

  return (
    <div className="min-h-screen bg-background coffee-texture">
      <header
        className={`sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-transform duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          {/* Logo and Title Section - Compact on mobile */}
          <div className="flex flex-col items-center mb-6 md:mb-8 relative">
            {/* Language Switcher & Notion Button - Top Right */}
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <NotionButton />
              <LanguageSwitcher />
            </div>

            <div className="relative mb-3 md:mb-4">
              <img
                src="/logo.jpeg"
                alt="The Bean Keeper"
                className="h-20 w-20 md:h-32 md:w-32 object-cover rounded-full shadow-xl ring-2 md:ring-4 ring-white ring-offset-1 md:ring-offset-2 ring-offset-background transition-all duration-300"
              />
              {/* Decorative coffee stain behind logo */}
              <div className="absolute -top-2 md:-top-4 -right-2 md:-right-4 w-16 md:w-24 h-16 md:h-24 bg-[#6F4E37]/10 rounded-full blur-2xl -z-10" />
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground tracking-tight mb-1">
              {t('dashboard:header.title')}
            </h1>
            <p className="text-muted-foreground font-light text-xs md:text-sm tracking-wide">
              Your artisan coffee journal
            </p>
          </div>

          {/* Search and Add Button Row - Compact on mobile */}
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('dashboard:header.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-11 pr-3 md:pr-4 py-3 md:py-6 border-2 border-border bg-white focus-visible:ring-primary focus-visible:border-primary organic-radius shadow-sm font-serif text-sm md:text-base transition-all duration-200 focus-coffee"
                data-testid="input-search"
              />
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              data-testid="button-add-coffee"
              className="shrink-0 organic-radius px-4 md:px-6 py-3 md:py-6 gap-1.5 md:gap-2 whitespace-nowrap font-serif font-semibold text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5" />
              <span className="hidden sm:inline">{t('dashboard:header.addCoffee')}</span>
              <span className="sm:hidden">{t('common:buttons.add')}</span>
            </Button>
          </div>

          {/* Active filters display */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground font-serif font-medium">Active Filters:</span>
              {activeFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="gap-1.5 hover-elevate active-elevate-2 organic-radius font-medium"
                  data-testid={`badge-filter-${filter}`}
                >
                  {filter}
                  <button
                    onClick={() => setActiveFilters(activeFilters.filter((f) => f !== filter))}
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
                onClick={() => setActiveFilters([])}
                className="h-auto py-1 px-3 text-xs font-serif"
                data-testid="button-clear-filters"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About Section - Introduction for new users */}
        <AboutSection />

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground font-serif text-lg">{t('common:loading.brewing')}</p>
          </div>
        ) : filteredAndSortedEntries.length === 0 && !searchQuery && !activeRoastFilter && !activeRatingFilter && !activeOriginFilter ? (
          <EmptyState onAddClick={() => setShowAddForm(true)} />
        ) : (
          <div>
            {/* Coffee Statistics Summary Bar */}
            <CoffeeStats entries={entries} />

            {/* Filter Bar */}
            {entries.length > 0 && (
              <CoffeeFilters
                activeRoastFilter={activeRoastFilter}
                activeRatingFilter={activeRatingFilter}
                activeOriginFilter={activeOriginFilter}
                sortBy={sortBy}
                origins={uniqueOrigins}
                onRoastFilterChange={setActiveRoastFilter}
                onRatingFilterChange={setActiveRatingFilter}
                onOriginFilterChange={setActiveOriginFilter}
                onSortChange={setSortBy}
                onClearFilters={handleClearFilters}
              />
            )}

            {filteredAndSortedEntries.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <Search className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-serif font-semibold mb-2">No coffees found</h3>
                <p className="text-muted-foreground font-serif">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : "No coffees match your current filters"}
                </p>
              </div>
            ) : (
              <>
                {/* Section header with count */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-serif font-semibold text-foreground">
                      Your Collection
                    </h2>
                    <p className="text-muted-foreground font-serif text-sm mt-1">
                      {filteredAndSortedEntries.length} {filteredAndSortedEntries.length === 1 ? 'coffee' : 'coffees'} found
                    </p>
                  </div>
                </div>

                {/* Coffee grid with staggered animations - Magazine layout */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6" data-testid="grid-coffee-entries">
                  {filteredAndSortedEntries.map((entry, index) => {
                    const isHighestRated = entry.rating === highestRating && highestRating >= 4;
                    const isRecent = new Date(entry.createdAt) > sevenDaysAgo;

                    return (
                      <div
                        key={entry.id}
                        className={`animate-slide-in-up opacity-0 stagger-${Math.min(index % 9 + 1, 9)}`}
                      >
                        <CoffeeCard
                          entry={entry}
                          onClick={() => setSelectedEntry(entry)}
                          isHighestRated={isHighestRated}
                          isRecent={isRecent}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Decorative footer */}
      <footer className="mt-20 border-t border-border/50 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#6F4E37]/30" />
                <div className="w-2 h-2 rounded-full bg-[#3D5A40]/30" />
                <div className="w-2 h-2 rounded-full bg-[#C4A57B]/30" />
              </div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
            </div>

            <p className="text-muted-foreground font-serif text-sm mb-2">
              Crafted with care for coffee enthusiasts
            </p>
            <p className="text-muted-foreground/60 font-serif text-xs">
              © 2025 The Bean Keeper · Track, taste, remember
            </p>
          </div>
        </div>
      </footer>

      {isMobile ? (
        <Drawer open={showAddForm} onOpenChange={setShowAddForm}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="relative">
              <DrawerTitle data-testid="text-add-coffee-title">Add Coffee</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              <AddCoffeeForm
                onSubmit={handleAddCoffee}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-add-coffee-title">Add Coffee</DialogTitle>
            </DialogHeader>
            <AddCoffeeForm
              onSubmit={handleAddCoffee}
              onCancel={() => setShowAddForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {isMobile ? (
        <Drawer open={showEditForm} onOpenChange={setShowEditForm}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="relative">
              <DrawerTitle data-testid="text-edit-coffee-title">Edit Coffee</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              {editEntry && (
                <EditCoffeeForm
                  entry={editEntry}
                  onSubmit={handleEditCoffee}
                  onCancel={() => {
                    setShowEditForm(false);
                    setEditEntry(null);
                  }}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-edit-coffee-title">Edit Coffee</DialogTitle>
            </DialogHeader>
            {editEntry && (
              <EditCoffeeForm
                entry={editEntry}
                onSubmit={handleEditCoffee}
                onCancel={() => {
                  setShowEditForm(false);
                  setEditEntry(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      <RatingModal
        open={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setPendingEntry(null);
        }}
        onSave={handleSaveRating}
        roasterName={pendingEntry?.roasterName}
        initialRating={pendingEntry?.rating ?? 0}
        initialNotes={pendingEntry?.tastingNotes ?? ""}
        initialPurchaseAgain={pendingEntry?.purchaseAgain ?? false}
      />

      <CoffeeDetail
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onEdit={() => {
          if (selectedEntry) {
            setEditEntry(selectedEntry);
            setShowEditForm(true);
            setSelectedEntry(null);
          }
        }}
        onDelete={() => {
          if (selectedEntry) {
            handleDeleteCoffee(selectedEntry.id);
          }
        }}
      />

      {/* Scroll Sidebar Navigation */}
      <ScrollSidebar />

      {/* Help Button */}
      <HelpButton onClick={() => setShowGuideModal(true)} />

      {/* User Guide Modal */}
      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}
