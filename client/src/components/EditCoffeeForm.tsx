import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoffeeEntry } from "@shared/schema";
import StarRating from "./StarRating";

interface EditCoffeeFormProps {
  entry: CoffeeEntry;
  onSubmit: (data: {
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
  }) => void;
  onCancel: () => void;
}

export default function EditCoffeeForm({ entry, onSubmit, onCancel }: EditCoffeeFormProps) {
  const [formData, setFormData] = useState({
    roasterName: entry.roasterName,
    roasterLocation: entry.roasterLocation || "",
    farm: entry.farm || "",
    origin: entry.origin || "",
    variety: entry.variety || "",
    processMethod: entry.processMethod || "",
    roastDate: entry.roastDate || "",
    flavorNotes: entry.flavorNotes?.join(", ") || "",
    rating: entry.rating || 0,
    tastingNotes: entry.tastingNotes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-edit-coffee">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="roasterName">Roaster Name *</Label>
          <Input
            id="roasterName"
            required
            value={formData.roasterName}
            onChange={(e) => setFormData({ ...formData, roasterName: e.target.value })}
            data-testid="input-edit-roaster-name"
          />
        </div>
        <div>
          <Label htmlFor="roasterLocation">Roaster Location</Label>
          <Input
            id="roasterLocation"
            value={formData.roasterLocation}
            onChange={(e) => setFormData({ ...formData, roasterLocation: e.target.value })}
            placeholder="City, State"
            data-testid="input-edit-roaster-location"
          />
        </div>
        <div>
          <Label htmlFor="farm">Farm / Estate</Label>
          <Input
            id="farm"
            value={formData.farm}
            onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
            data-testid="input-edit-farm"
          />
        </div>
        <div>
          <Label htmlFor="origin">Origin</Label>
          <Input
            id="origin"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            data-testid="input-edit-origin"
          />
        </div>
        <div>
          <Label htmlFor="variety">Variety</Label>
          <Input
            id="variety"
            value={formData.variety}
            onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
            data-testid="input-edit-variety"
          />
        </div>
        <div>
          <Label htmlFor="processMethod">Process Method</Label>
          <Input
            id="processMethod"
            value={formData.processMethod}
            onChange={(e) => setFormData({ ...formData, processMethod: e.target.value })}
            data-testid="input-edit-process"
          />
        </div>
        <div>
          <Label htmlFor="roastDate">Roast Date</Label>
          <Input
            id="roastDate"
            type="date"
            value={formData.roastDate}
            onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
            data-testid="input-edit-roast-date"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="flavorNotes">Flavor Notes</Label>
        <Input
          id="flavorNotes"
          value={formData.flavorNotes}
          onChange={(e) => setFormData({ ...formData, flavorNotes: e.target.value })}
          placeholder="e.g., Chocolate, Citrus, Caramel"
          data-testid="input-edit-flavor-notes"
        />
        <p className="text-xs text-muted-foreground mt-1">Separate multiple flavors with commas</p>
      </div>

      <div>
        <Label>Rating</Label>
        <div className="mt-2">
          <StarRating 
            rating={formData.rating} 
            onRatingChange={(rating) => setFormData({ ...formData, rating })}
            size="lg"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tastingNotes">Tasting Notes</Label>
        <Textarea
          id="tastingNotes"
          value={formData.tastingNotes}
          onChange={(e) => setFormData({ ...formData, tastingNotes: e.target.value })}
          placeholder="Your thoughts on this coffee..."
          rows={3}
          data-testid="input-edit-tasting-notes"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" data-testid="button-cancel-edit">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" data-testid="button-save-edit">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
