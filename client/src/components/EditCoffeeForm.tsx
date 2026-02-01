import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CoffeeEntry } from "@shared/schema";
import StarRating from "./StarRating";
import { Heart, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EditCoffeeFormProps {
  entry: CoffeeEntry;
  onSubmit: (data: {
    roasterName: string;
    roasterWebsite?: string;
    farm?: string;
    origin?: string;
    variety?: string;
    processMethod?: string;
    roastLevel?: string;
    roastDate?: string;
    flavorNotes?: string;
    rating?: number;
    tastingNotes?: string;
    weight?: string;
    price?: string;
    purchaseAgain?: boolean;
    frontPhotoUrl?: string | null;
    backPhotoUrl?: string | null;
  }) => void;
  onCancel: () => void;
}

export default function EditCoffeeForm({ entry, onSubmit, onCancel }: EditCoffeeFormProps) {
  const { t } = useTranslation(['forms', 'coffee', 'common']);

  // Detect currency from existing price
  const detectCurrency = (price: string | null) => {
    if (!price) return "USD";
    if (price.includes('€')) return "EUR";
    return "USD"; // Default for $ symbol (could be USD or CAD)
  };

  const [currency, setCurrency] = useState<string>(detectCurrency(entry.price));
  const [formData, setFormData] = useState({
    roasterName: entry.roasterName,
    roasterWebsite: entry.roasterWebsite || "",
    farm: entry.farm || "",
    origin: entry.origin || "",
    variety: entry.variety || "",
    processMethod: entry.processMethod || "",
    roastLevel: entry.roastLevel || "",
    roastDate: entry.roastDate || "",
    flavorNotes: entry.flavorNotes?.join(", ") || "",
    rating: entry.rating || 0,
    tastingNotes: entry.tastingNotes || "",
    weight: entry.weight || "",
    price: entry.price || "",
    purchaseAgain: entry.purchaseAgain ?? false,
  });
  const [frontPhotoUrl, setFrontPhotoUrl] = useState<string | null>(entry.frontPhotoUrl || null);
  const [backPhotoUrl, setBackPhotoUrl] = useState<string | null>(entry.backPhotoUrl || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      frontPhotoUrl,
      backPhotoUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-edit-coffee">
      <div className="space-y-3">
        <Label>{t('forms:editCoffee.photosTitle')}</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('forms:addCoffee.frontPhoto')}</p>
            {frontPhotoUrl ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={frontPhotoUrl}
                  alt={t('forms:addCoffee.frontAlt')}
                  className="w-full h-40 object-cover"
                />
              </div>
            ) : (
              <div className="h-40 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                {t('forms:editCoffee.noPhoto')}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFrontPhotoUrl(null)}
              disabled={!frontPhotoUrl}
              className="w-full"
              data-testid="button-remove-front-photo"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {t('forms:editCoffee.removeFrontPhoto')}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('forms:addCoffee.backPhoto')}</p>
            {backPhotoUrl ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={backPhotoUrl}
                  alt={t('forms:addCoffee.backAlt')}
                  className="w-full h-40 object-cover"
                />
              </div>
            ) : (
              <div className="h-40 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                {t('forms:editCoffee.noPhoto')}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBackPhotoUrl(null)}
              disabled={!backPhotoUrl}
              className="w-full"
              data-testid="button-remove-back-photo"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {t('forms:editCoffee.removeBackPhoto')}
            </Button>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="roasterName">{t('forms:addCoffee.labels.roasterName')} *</Label>
          <Input
            id="roasterName"
            required
            value={formData.roasterName}
            onChange={(e) => setFormData({ ...formData, roasterName: e.target.value })}
            data-testid="input-edit-roaster-name"
          />
        </div>
        <div>
          <Label htmlFor="roasterWebsite">{t('forms:addCoffee.labels.roasterWebsite')}</Label>
          <Input
            id="roasterWebsite"
            value={formData.roasterWebsite}
            onChange={(e) => setFormData({ ...formData, roasterWebsite: e.target.value })}
            placeholder={t('forms:addCoffee.placeholders.roasterWebsite')}
            data-testid="input-edit-roaster-website"
          />
        </div>
        <div>
          <Label htmlFor="farm">{t('forms:addCoffee.labels.farm')}</Label>
          <Input
            id="farm"
            value={formData.farm}
            onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
            data-testid="input-edit-farm"
          />
        </div>
        <div>
          <Label htmlFor="origin">{t('forms:addCoffee.labels.origin')}</Label>
          <Input
            id="origin"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            data-testid="input-edit-origin"
          />
        </div>
        <div>
          <Label htmlFor="variety">{t('forms:addCoffee.labels.variety')}</Label>
          <Input
            id="variety"
            value={formData.variety}
            onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
            data-testid="input-edit-variety"
          />
        </div>
        <div>
          <Label htmlFor="processMethod">{t('forms:addCoffee.labels.processMethod')}</Label>
          <Input
            id="processMethod"
            value={formData.processMethod}
            onChange={(e) => setFormData({ ...formData, processMethod: e.target.value })}
            data-testid="input-edit-process"
          />
        </div>
        <div>
          <Label htmlFor="roastLevel">{t('forms:addCoffee.labels.roastLevel')}</Label>
          <select
            id="roastLevel"
            value={formData.roastLevel}
            onChange={(e) => setFormData({ ...formData, roastLevel: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="select-edit-roast-level"
          >
            <option value="">{t('forms:addCoffee.selectRoastLevel')}</option>
            <option value="Light">{t('coffee:roastLevels.light')}</option>
            <option value="Medium">{t('coffee:roastLevels.medium')}</option>
            <option value="Dark">{t('coffee:roastLevels.dark')}</option>
          </select>
        </div>
        <div>
          <Label htmlFor="roastDate">{t('forms:addCoffee.labels.roastDate')}</Label>
          <Input
            id="roastDate"
            type="date"
            value={formData.roastDate}
            onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
            data-testid="input-edit-roast-date"
          />
        </div>
        <div>
          <Label htmlFor="weight">{t('forms:addCoffee.labels.weight')}</Label>
          <Input
            id="weight"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (value && !value.match(/g|lbs|oz/i)) {
                setFormData({ ...formData, weight: value + 'g' });
              }
            }}
            placeholder={t('forms:addCoffee.placeholders.weight')}
            data-testid="input-edit-weight"
          />
        </div>
        <div>
          <Label htmlFor="price">{t('forms:addCoffee.labels.price')}</Label>
          <div className="flex gap-2">
            <Select
              value={currency}
              onValueChange={(value) => {
                setCurrency(value);
                // Update existing price with new currency symbol
                if (formData.price) {
                  const numericValue = formData.price.replace(/[^0-9.]/g, '');
                  const symbol = value === 'USD' || value === 'CAD' ? '$' : '€';
                  setFormData({ ...formData, price: symbol + numericValue });
                }
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="CAD">$ CAD</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value) {
                  const numericValue = value.replace(/[^0-9.]/g, '');
                  const symbol = currency === 'EUR' ? '€' : '$';
                  if (numericValue) {
                    setFormData({ ...formData, price: symbol + numericValue });
                  }
                }
              }}
              placeholder={currency === 'EUR' ? '€18.99' : '$18.99'}
              data-testid="input-edit-price"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="flavorNotes">{t('forms:addCoffee.labels.flavorNotes')}</Label>
        <Input
          id="flavorNotes"
          value={formData.flavorNotes}
          onChange={(e) => setFormData({ ...formData, flavorNotes: e.target.value })}
          placeholder={t('forms:addCoffee.placeholders.flavorNotes')}
          data-testid="input-edit-flavor-notes"
        />
        <p className="text-xs text-muted-foreground mt-1">{t('forms:addCoffee.flavorNotesHint')}</p>
      </div>

      <div>
        <Label>{t('coffee:fields.rating')}</Label>
        <div className="mt-2">
          <StarRating
            rating={formData.rating}
            onRatingChange={(rating) => setFormData({ ...formData, rating })}
            size="lg"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className={`w-5 h-5 ${formData.purchaseAgain ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          <Label htmlFor="purchaseAgain">{t('forms:addCoffee.labels.purchaseAgain')}</Label>
        </div>
        <Switch
          id="purchaseAgain"
          checked={formData.purchaseAgain}
          onCheckedChange={(checked) => setFormData({ ...formData, purchaseAgain: checked })}
          data-testid="switch-purchase-again"
        />
      </div>

      <div>
        <Label htmlFor="tastingNotes">{t('coffee:fields.tastingNotes')}</Label>
        <Textarea
          id="tastingNotes"
          value={formData.tastingNotes}
          onChange={(e) => setFormData({ ...formData, tastingNotes: e.target.value })}
          placeholder={t('modals:rating.notesPlaceholder')}
          rows={3}
          data-testid="input-edit-tasting-notes"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" data-testid="button-cancel-edit">
          {t('common:buttons.cancel')}
        </Button>
        <Button type="submit" className="flex-1" data-testid="button-save-edit">
          {t('forms:editCoffee.save')}
        </Button>
      </div>
    </form>
  );
}
