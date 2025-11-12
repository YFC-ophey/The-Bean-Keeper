import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import StarRating from "./StarRating";
import { CoffeeEntry } from "@shared/schema";
import { format } from "date-fns";

interface CoffeeCardProps {
  entry: CoffeeEntry;
  onClick?: () => void;
}

export default function CoffeeCard({ entry, onClick }: CoffeeCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-transform active:scale-[0.98]"
      onClick={onClick}
      data-testid={`card-coffee-${entry.id}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={entry.photoUrl}
          alt={`${entry.roasterName} coffee bag`}
          className="w-full h-full object-cover"
          data-testid={`img-coffee-${entry.id}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg mb-1" data-testid={`text-roaster-${entry.id}`}>
            {entry.roasterName}
          </h3>
          <p className="text-white/90 text-sm" data-testid={`text-origin-${entry.id}`}>
            {entry.origin}{entry.variety && ` • ${entry.variety}`}
          </p>
        </div>
        {entry.createdAt && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 bg-white/90 text-foreground"
            data-testid={`badge-date-${entry.id}`}
          >
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(entry.createdAt), 'MMM d')}
          </Badge>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {entry.rating ? (
            <StarRating rating={entry.rating} readonly size="sm" />
          ) : (
            <span className="text-sm text-muted-foreground">Not rated</span>
          )}
          {entry.processMethod && (
            <Badge variant="outline" className="text-xs" data-testid={`badge-process-${entry.id}`}>
              {entry.processMethod}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
