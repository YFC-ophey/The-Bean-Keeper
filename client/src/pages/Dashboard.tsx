import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import EditCoffeeForm from "@/components/EditCoffeeForm";
import RatingModal from "@/components/RatingModal";
import CoffeeDetail from "@/components/CoffeeDetail";
import FilterBar from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";
import { CoffeeEntry } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CoffeeEntry | null>(null);
  const [editEntry, setEditEntry] = useState<CoffeeEntry | null>(null);
  const [pendingEntry, setPendingEntry] = useState<CoffeeEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: entries = [], isLoading } = useQuery<CoffeeEntry[]>({
    queryKey: ["/api/coffee-entries"],
  });

  const handleAddCoffee = async (frontPhotoUrl: string, backPhotoUrl: string | null, data: {
    roasterName: string;
    roasterLocation?: string;
    farm?: string;
    origin?: string;
    variety?: string;
    processMethod?: string;
    roastDate?: string;
    flavorNotes?: string;
  }) => {
    try {
      const response = await apiRequest("POST", "/api/coffee-entries", {
        frontPhotoUrl,
        backPhotoUrl,
        roasterName: data.roasterName,
        roasterLocation: data.roasterLocation || null,
        farm: data.farm || null,
        origin: data.origin || null,
        variety: data.variety || null,
        processMethod: data.processMethod || null,
        roastDate: data.roastDate || null,
        flavorNotes: data.flavorNotes
          ? data.flavorNotes.split(",").map(f => f.trim()).filter(f => f.length > 0)
          : null,
        roasterAddress: null,
        roasterWebsite: null,
        rating: null,
        tastingNotes: null,
      });

      const newEntry = await response.json() as CoffeeEntry;
      await queryClient.invalidateQueries({ queryKey: ["/api/coffee-entries"] });
      
      setPendingEntry(newEntry);
      setShowAddForm(false);
      setShowRatingModal(true);

      toast({
        title: "Coffee added!",
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

  const handleSaveRating = async (rating: number, notes: string) => {
    if (!pendingEntry) return;

    try {
      await apiRequest("PATCH", `/api/coffee-entries/${pendingEntry.id}`, {
        rating,
        tastingNotes: notes || null,
      });

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
    roasterLocation?: string;
    farm?: string;
    origin?: string;
    variety?: string;
    processMethod?: string;
    roastDate?: string;
    flavorNotes?: string;
    rating?: number;
    tastingNotes?: string;
  }) => {
    if (!editEntry) return;

    try {
      await apiRequest("PATCH", `/api/coffee-entries/${editEntry.id}`, {
        roasterName: data.roasterName,
        roasterLocation: data.roasterLocation || null,
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

  const filteredEntries = entries.filter(entry => {
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
              <h1 className="text-2xl font-semibold" data-testid="text-page-title">Coffee Bean Tracker</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
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
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your coffee tracker...</p>
          </div>
        ) : filteredEntries.length === 0 && !searchQuery ? (
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
    </div>
  );
}
