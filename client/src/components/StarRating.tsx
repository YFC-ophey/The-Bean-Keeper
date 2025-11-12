import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ rating, onRatingChange, readonly = false, size = "md" }: StarRatingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8"
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover-elevate active-elevate-2'} rounded-sm transition-transform ${!readonly && 'active:scale-95'}`}
          data-testid={`star-${star}`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'fill-primary text-primary'
                : 'fill-none text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
