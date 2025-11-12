import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "./StarRating";
import { useState } from "react";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rating: number, notes: string) => void;
  roasterName?: string;
}

export default function RatingModal({ open, onClose, onSave, roasterName }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (rating > 0) {
      onSave(rating, notes);
      setRating(0);
      setNotes("");
    }
  };

  const handleSkip = () => {
    onClose();
    setRating(0);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-rating">
        <DialogHeader>
          <DialogTitle data-testid="text-rating-title">Rate Your Coffee</DialogTitle>
          <DialogDescription data-testid="text-rating-description">
            {roasterName ? `How was ${roasterName}?` : "How was this coffee?"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          </div>
          <div>
            <label htmlFor="notes" className="text-sm font-medium mb-2 block">
              Tasting Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="What flavors did you taste? Any thoughts?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={100}
              className="resize-none h-20"
              data-testid="input-tasting-notes"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {notes.length}/100 characters
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
            data-testid="button-skip-rating"
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSave}
            disabled={rating === 0}
            className="flex-1"
            data-testid="button-save-rating"
          >
            Save Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
