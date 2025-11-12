import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, ExternalLink, X, Pencil } from "lucide-react";
import StarRating from "./StarRating";
import { CoffeeEntry } from "@shared/schema";
import { format } from "date-fns";

interface CoffeeDetailProps {
  entry: CoffeeEntry | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function CoffeeDetail({ entry, open, onClose, onEdit }: CoffeeDetailProps) {
  if (!entry) return null;

  const mapEmbedUrl = entry.roasterLocation
    ? `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(entry.roasterLocation)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-coffee-detail">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-2xl font-semibold" data-testid="text-detail-roaster">
              {entry.roasterName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-edit-entry">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-detail">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Photo grid - show both front and back if available */}
            {entry.backPhotoUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={entry.frontPhotoUrl}
                    alt={`Front of ${entry.roasterName} coffee bag`}
                    className="w-full h-full object-cover"
                    data-testid="img-detail-front-photo"
                  />
                </div>
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={entry.backPhotoUrl}
                    alt={`Back of ${entry.roasterName} coffee bag`}
                    className="w-full h-full object-cover"
                    data-testid="img-detail-back-photo"
                  />
                </div>
              </div>
            ) : (
              <div className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={entry.frontPhotoUrl}
                  alt={`${entry.roasterName} coffee bag`}
                  className="w-full h-full object-cover"
                  data-testid="img-detail-photo"
                />
              </div>
            )}

            {mapEmbedUrl && (
              <Card className="overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                  <p className="ml-2 text-sm text-muted-foreground">Map placeholder</p>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium mb-1">{entry.roasterLocation}</p>
                  {entry.roasterAddress && (
                    <p className="text-sm text-muted-foreground mb-3">{entry.roasterAddress}</p>
                  )}
                  <Button variant="outline" size="sm" asChild data-testid="button-view-map">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.roasterLocation || entry.roasterName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </a>
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Coffee Details</h3>
              <div className="space-y-3">
                {entry.origin && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Origin</span>
                    <span className="text-sm font-medium" data-testid="text-detail-origin">{entry.origin}</span>
                  </div>
                )}
                {entry.variety && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Variety</span>
                    <span className="text-sm font-medium" data-testid="text-detail-variety">{entry.variety}</span>
                  </div>
                )}
                {entry.processMethod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Process</span>
                    <Badge variant="outline" data-testid="badge-detail-process">{entry.processMethod}</Badge>
                  </div>
                )}
                {entry.roastDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Roast Date</span>
                    <span className="text-sm font-medium" data-testid="text-detail-roast-date">{entry.roastDate}</span>
                  </div>
                )}
              </div>
            </div>

            {entry.flavorNotes && entry.flavorNotes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Flavor Notes</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.flavorNotes.map((flavor, index) => (
                      <Badge key={index} variant="secondary" data-testid={`badge-flavor-${index}`}>
                        {flavor}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {entry.rating && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">My Rating</h3>
                  <StarRating rating={entry.rating} readonly size="lg" />
                </div>
              </>
            )}

            {entry.tastingNotes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Tasting Notes</h3>
                  <p className="text-sm" data-testid="text-detail-notes">{entry.tastingNotes}</p>
                </div>
              </>
            )}

            {entry.createdAt && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span data-testid="text-detail-created">
                    Added {format(new Date(entry.createdAt), 'MMMM d, yyyy')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
