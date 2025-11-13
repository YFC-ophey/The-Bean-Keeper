import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StarRating from "./StarRating";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rating: number, notes: string, purchaseAgain: boolean) => void;
  roasterName?: string;
  initialRating?: number;
  initialNotes?: string;
  initialPurchaseAgain?: boolean;
}

export default function RatingModal({ 
  open, 
  onClose, 
  onSave, 
  roasterName,
  initialRating = 0,
  initialNotes = "",
  initialPurchaseAgain = false
}: RatingModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [notes, setNotes] = useState(initialNotes);
  const [purchaseAgain, setPurchaseAgain] = useState(initialPurchaseAgain);

  // Sync state when modal opens with new initial values
  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setNotes(initialNotes);
      setPurchaseAgain(initialPurchaseAgain);
    }
  }, [open, initialRating, initialNotes, initialPurchaseAgain]);

  const handleSave = () => {
    // Allow saving if either rating is given OR purchaseAgain is toggled
    if (rating > 0 || purchaseAgain) {
      onSave(rating, notes, purchaseAgain);
      // Don't reset state here - let parent close modal and useEffect will reset on next open
    }
  };

  const handleSkip = () => {
    onClose();
    // Don't reset state here - useEffect will reset when modal reopens
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
          <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Heart className={`w-5 h-5 ${purchaseAgain ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              <Label htmlFor="purchaseAgain" className="cursor-pointer">Purchase Again?</Label>
            </div>
            <Switch
              id="purchaseAgain"
              checked={purchaseAgain}
              onCheckedChange={setPurchaseAgain}
              data-testid="switch-purchase-again-rating"
            />
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
            disabled={rating === 0 && !purchaseAgain}
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
