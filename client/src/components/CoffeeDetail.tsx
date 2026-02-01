import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, ExternalLink, Pencil, Trash2, Heart } from "lucide-react";
import StarRating from "./StarRating";
import { CoffeeEntry } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CoffeeDetailProps {
  entry: CoffeeEntry | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isGuest?: boolean;
}

export default function CoffeeDetail({ entry, open, onClose, onEdit, onDelete, isGuest = false }: CoffeeDetailProps) {
  const { t } = useTranslation(['coffee', 'common', 'modals']);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  if (!entry) return null;

  // Build precise Google Maps search query
  // Priority: roasterAddress > roasterName + roasterLocation > roasterName + website domain
  const getMapSearchQuery = () => {
    // Use quotes around roaster name for EXACT matching (not prefix/fuzzy match)
    const quotedName = `"${entry.roasterName}"`;

    // Extract domain from website for additional context
    const websiteDomain = entry.roasterWebsite
      ? entry.roasterWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
      : null;

    // Priority 1: Full address with exact name match
    if (entry.roasterAddress) {
      return `${quotedName} ${entry.roasterAddress}`;
    }

    // Priority 2: Name + location with website domain for disambiguation
    if (entry.roasterLocation) {
      return websiteDomain
        ? `${quotedName} ${websiteDomain} ${entry.roasterLocation}`
        : `${quotedName} ${entry.roasterLocation}`;
    }

    // Priority 3: Name + website domain + country from TLD
    if (websiteDomain) {
      const tldMatch = websiteDomain.match(/\.([a-z]{2})$/);
      let locationHint = '';

      if (tldMatch && tldMatch[1] !== 'com') {
        const tldToCountry: Record<string, string> = {
          'ca': 'Canada',
          'uk': 'United Kingdom',
          'au': 'Australia',
          'nz': 'New Zealand',
          'de': 'Germany',
          'fr': 'France',
          'it': 'Italy',
          'es': 'Spain',
        };
        locationHint = tldToCountry[tldMatch[1]] || '';
      }

      return locationHint
        ? `${quotedName} ${websiteDomain} ${locationHint}`
        : `${quotedName} ${websiteDomain}`;
    }

    // Fallback: quoted name only for exact match
    return quotedName;
  };

  const mapSearchQuery = getMapSearchQuery();

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-coffee-detail">
          <DialogHeader>
            {/* Roaster name - first row */}
            <DialogTitle className="text-2xl font-semibold pr-8" data-testid="text-detail-roaster">
              {entry.roasterName}
            </DialogTitle>

            {/* Edit/Delete buttons - second row under roaster name */}
            {(onEdit || onDelete) && (
              <div className="flex items-center justify-center gap-2 mt-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isGuest ? undefined : onEdit}
                    disabled={isGuest}
                    className={isGuest ? "opacity-50 cursor-not-allowed" : undefined}
                    data-testid="button-edit-entry"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    {t('common:buttons.edit')}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isGuest ? undefined : () => setShowDeleteConfirm(true)}
                    disabled={isGuest}
                    className={isGuest ? "opacity-50 cursor-not-allowed" : undefined}
                    data-testid="button-delete-entry"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common:buttons.delete')}
                  </Button>
                )}
              </div>
            )}
          </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Photo grid - show both front and back if available */}
            {entry.backPhotoUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => setEnlargedPhoto(entry.frontPhotoUrl)}>
                  <img
                    src={entry.frontPhotoUrl}
                    alt={`Front of ${entry.roasterName} coffee bag`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    data-testid="img-detail-front-photo"
                  />
                </div>
                <div className="aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => setEnlargedPhoto(entry.backPhotoUrl)}>
                  <img
                    src={entry.backPhotoUrl}
                    alt={`Back of ${entry.roasterName} coffee bag`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    data-testid="img-detail-back-photo"
                  />
                </div>
              </div>
            ) : (
              <div className="aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => setEnlargedPhoto(entry.frontPhotoUrl)}>
                <img
                  src={entry.frontPhotoUrl}
                  alt={`${entry.roasterName} coffee bag`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                  data-testid="img-detail-photo"
                />
              </div>
            )}

            {/* Roaster Website and Maps */}
            {(entry.roasterWebsite || entry.roasterName) && (
              <Card className="overflow-hidden">
                {/* Embedded Google Maps with API key */}
                <div className="aspect-video bg-muted relative">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/search?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(mapSearchQuery)}`}
                    title="Roaster location map"
                  />
                </div>
                <div className="p-4 space-y-3">
                  {entry.roasterWebsite && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t('coffee:fields.website')}</p>
                      <a
                        href={entry.roasterWebsite.startsWith('http') ? entry.roasterWebsite : `https://${entry.roasterWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center"
                        data-testid="link-roaster-website"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {entry.roasterWebsite.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild data-testid="button-view-map">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {t('coffee:details.viewMap')}
                    </a>
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('coffee:details.coffeeDetails')}</h3>
              <div className="space-y-3">
                {entry.origin && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('coffee:fields.origin')}</span>
                    <div className="flex flex-wrap gap-1.5 justify-end" data-testid="text-detail-origin">
                      {entry.origin.split(',').map((origin, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs border-[#C4A57B] text-[#C4A57B] bg-[#C4A57B]/5"
                        >
                          {origin.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {entry.variety && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('coffee:fields.variety')}</span>
                    <span className="text-sm font-medium" data-testid="text-detail-variety">{entry.variety}</span>
                  </div>
                )}
                {entry.processMethod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('coffee:fields.process')}</span>
                    <Badge variant="outline" data-testid="badge-detail-process">{entry.processMethod}</Badge>
                  </div>
                )}
                {entry.roastLevel && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('coffee:fields.roastLevel')}</span>
                    <Badge variant="outline" data-testid="badge-detail-roast-level">{entry.roastLevel}</Badge>
                  </div>
                )}
                {entry.roastDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('coffee:fields.roastDate')}</span>
                    <span className="text-sm font-medium" data-testid="text-detail-roast-date">{entry.roastDate}</span>
                  </div>
                )}
                {entry.weight && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('coffee:fields.weight')}</span>
                    <span className="text-sm font-medium" data-testid="text-detail-weight">
                      {entry.weight.match(/g|lbs|oz/i) ? entry.weight : entry.weight + 'g'}
                    </span>
                  </div>
                )}
                {entry.price && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('coffee:fields.price')}</span>
                    <span className="text-sm font-medium" data-testid="text-detail-price">
                      {entry.price.startsWith('$') ? entry.price : '$' + entry.price}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {entry.flavorNotes && entry.flavorNotes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('coffee:fields.flavorNotes')}</h3>
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

            {(entry.rating || entry.purchaseAgain) && (
              <>
                <Separator />
                <div>
                  {entry.rating && (
                    <>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('coffee:details.myRating')}</h3>
                      <StarRating rating={entry.rating} readonly size="lg" />
                    </>
                  )}
                  {entry.purchaseAgain && (
                    <div className={`flex items-center gap-2 text-sm ${entry.rating ? 'mt-3' : ''}`}>
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      <span className="text-muted-foreground" data-testid="text-purchase-again">{t('coffee:details.purchaseAgain')}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {entry.tastingNotes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('coffee:fields.tastingNotes')}</h3>
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
                    {t('coffee:details.addedOn')} {format(new Date(entry.createdAt), 'MMMM d, yyyy')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Photo Enlargement Dialog */}
    <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
      <DialogPortal>
        <DialogOverlay className="z-[100]" />
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none z-[100]">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={enlargedPhoto || ''}
              alt={t('coffee:details.enlargedPhoto')}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent data-testid="dialog-delete-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('modals:delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('modals:delete.message')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">{t('modals:delete.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
            {t('modals:delete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
