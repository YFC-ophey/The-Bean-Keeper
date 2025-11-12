import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CoffeeCard from "@/components/CoffeeCard";
import AddCoffeeForm from "@/components/AddCoffeeForm";
import RatingModal from "@/components/RatingModal";
import CoffeeDetail from "@/components/CoffeeDetail";
import FilterBar from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";
import { CoffeeEntry } from "@shared/schema";
import coffeeImage1 from "@assets/generated_images/Craft_coffee_bag_minimal_a5d94523.png";
import coffeeImage2 from "@assets/generated_images/Specialty_coffee_bag_brown_70802fba.png";
import coffeeImage3 from "@assets/generated_images/Artisan_coffee_bag_black_1c1b939c.png";

export default function Dashboard() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CoffeeEntry | null>(null);
  const [pendingEntry, setPendingEntry] = useState<CoffeeEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // todo: remove mock functionality
  const [mockEntries, setMockEntries] = useState<CoffeeEntry[]>([
    {
      id: "1",
      photoUrl: coffeeImage1,
      roasterName: "Blue Bottle Coffee",
      roasterLocation: "Oakland, CA",
      roasterAddress: null,
      roasterWebsite: null,
      farm: "Finca El Puente",
      origin: "Ethiopia",
      variety: "Heirloom",
      processMethod: "Washed",
      roastDate: "2024-01-15",
      flavorNotes: ["Blueberry", "Jasmine", "Citrus"],
      rating: 5,
      tastingNotes: "Bright and complex with amazing floral notes",
      createdAt: new Date("2024-01-20"),
    },
    {
      id: "2",
      photoUrl: coffeeImage2,
      roasterName: "Stumptown Coffee",
      roasterLocation: "Portland, OR",
      roasterAddress: null,
      roasterWebsite: null,
      farm: null,
      origin: "Colombia",
      variety: "Bourbon",
      processMethod: "Washed",
      roastDate: "2024-01-10",
      flavorNotes: ["Chocolate", "Caramel", "Orange"],
      rating: 4,
      tastingNotes: "Rich and balanced with notes of dark chocolate",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "3",
      photoUrl: coffeeImage3,
      roasterName: "Verve Coffee",
      roasterLocation: "Santa Cruz, CA",
      roasterAddress: null,
      roasterWebsite: null,
      farm: null,
      origin: "Kenya",
      variety: "SL28",
      processMethod: "Natural",
      roastDate: "2024-01-05",
      flavorNotes: ["Blackberry", "Wine", "Brown Sugar"],
      rating: 5,
      tastingNotes: "Incredibly complex and fruity",
      createdAt: new Date("2024-01-12"),
    },
  ]);

  const handleAddCoffee = (formData: FormData) => {
    console.log("Adding coffee:", formData);
    // todo: remove mock functionality
    const newEntry: CoffeeEntry = {
      id: String(mockEntries.length + 1),
      photoUrl: coffeeImage1,
      roasterName: formData.get("roasterName") as string,
      roasterLocation: formData.get("roasterLocation") as string || null,
      roasterAddress: null,
      roasterWebsite: null,
      farm: null,
      origin: formData.get("origin") as string || null,
      variety: formData.get("variety") as string || null,
      processMethod: formData.get("processMethod") as string || null,
      roastDate: formData.get("roastDate") as string || null,
      flavorNotes: formData.get("flavorNotes") 
        ? (formData.get("flavorNotes") as string).split(",").map(f => f.trim())
        : [],
      rating: null,
      tastingNotes: null,
      createdAt: new Date(),
    };
    setMockEntries([newEntry, ...mockEntries]);
    setPendingEntry(newEntry);
    setShowAddForm(false);
    setShowRatingModal(true);
  };

  const handleSaveRating = (rating: number, notes: string) => {
    console.log("Saving rating:", rating, notes);
    // todo: remove mock functionality
    if (pendingEntry) {
      setMockEntries(mockEntries.map(entry =>
        entry.id === pendingEntry.id
          ? { ...entry, rating, tastingNotes: notes }
          : entry
      ));
      setPendingEntry(null);
    }
    setShowRatingModal(false);
  };

  const filteredEntries = mockEntries.filter(entry => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        entry.roasterName.toLowerCase().includes(query) ||
        entry.origin?.toLowerCase().includes(query) ||
        entry.variety?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold" data-testid="text-page-title">Coffee Journal</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
                {mockEntries.length} {mockEntries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
            <Button onClick={() => setShowAddForm(true)} data-testid="button-add-coffee">
              <Plus className="w-5 h-5 mr-2" />
              Add Coffee
            </Button>
          </div>
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilters={activeFilters}
            onRemoveFilter={(filter) =>
              setActiveFilters(activeFilters.filter((f) => f !== filter))
            }
            onClearAll={() => setActiveFilters([])}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredEntries.length === 0 && !searchQuery ? (
          <EmptyState onAddClick={() => setShowAddForm(true)} />
        ) : filteredEntries.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No coffees found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-coffee-entries">
            {filteredEntries.map((entry) => (
              <CoffeeCard
                key={entry.id}
                entry={entry}
                onClick={() => setSelectedEntry(entry)}
              />
            ))}
          </div>
        )}
      </main>

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

      <RatingModal
        open={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setPendingEntry(null);
        }}
        onSave={handleSaveRating}
        roasterName={pendingEntry?.roasterName}
      />

      <CoffeeDetail
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}
