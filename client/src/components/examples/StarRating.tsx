import { useState } from "react";
import StarRating from "../StarRating";

export default function StarRatingExample() {
  const [rating, setRating] = useState(4);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Interactive (large)</p>
        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Readonly (medium)</p>
        <StarRating rating={3} readonly size="md" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Small</p>
        <StarRating rating={5} readonly size="sm" />
      </div>
    </div>
  );
}
