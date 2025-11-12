import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import emptyStateImage from "@assets/generated_images/Coffee_cup_empty_state_d67d5918.png";

interface EmptyStateProps {
  onAddClick: () => void;
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4" data-testid="empty-state">
      <div className="w-32 h-32 mb-6 opacity-50">
        <img
          src={emptyStateImage}
          alt="Empty coffee journal"
          className="w-full h-full object-contain"
        />
      </div>
      <h2 className="text-2xl font-semibold mb-2" data-testid="text-empty-title">
        Start Your Coffee Journey
      </h2>
      <p className="text-muted-foreground text-center mb-6 max-w-md" data-testid="text-empty-description">
        Track your favorite coffees, discover new roasters, and keep notes on every cup you try.
      </p>
      <Button onClick={onAddClick} size="lg" data-testid="button-add-first-coffee">
        <Plus className="w-5 h-5 mr-2" />
        Add Your First Coffee
      </Button>
    </div>
  );
}
