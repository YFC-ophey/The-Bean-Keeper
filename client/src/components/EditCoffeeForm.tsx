import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
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
import { Camera, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
  const isMobile = useMediaQuery('(max-width: 768px)');

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
  const [frontPhotoFile, setFrontPhotoFile] = useState<File | null>(null);
  const [frontPhotoPreview, setFrontPhotoPreview] = useState<string>("");
  const [backPhotoFile, setBackPhotoFile] = useState<File | null>(null);
  const [backPhotoPreview, setBackPhotoPreview] = useState<string>("");

  // Refs for file inputs
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const onDropFront = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFrontPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setFrontPhotoPreview(preview);
    }
  }, []);

  const onDropBack = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setBackPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setBackPhotoPreview(preview);
    }
  }, []);

  const frontDropzone = useDropzone({
    onDrop: onDropFront,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.heif'] },
    multiple: false,
  });

  const backDropzone = useDropzone({
    onDrop: onDropBack,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.heif'] },
    multiple: false,
  });

  // Handlers for manual file input (camera vs file browser)
  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setFrontPhotoPreview(preview);
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setBackPhotoPreview(preview);
    }
  };

  const uploadPhoto = async (file: File) => {
    const uploadResponse = await apiRequest('POST', '/api/upload-url');
    const { uploadURL } = await uploadResponse.json();

    const uploadResult = await fetch(uploadURL, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    const { url } = await uploadResult.json();
    return url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let nextFrontPhotoUrl = frontPhotoUrl;
      let nextBackPhotoUrl = backPhotoUrl;

      if (frontPhotoFile) {
        nextFrontPhotoUrl = await uploadPhoto(frontPhotoFile);
      }

      if (backPhotoFile) {
        nextBackPhotoUrl = await uploadPhoto(backPhotoFile);
      }

      onSubmit({
        ...formData,
        frontPhotoUrl: nextFrontPhotoUrl,
        backPhotoUrl: nextBackPhotoUrl,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const hasFrontPhoto = Boolean(frontPhotoPreview || frontPhotoUrl);
  const hasBackPhoto = Boolean(backPhotoPreview || backPhotoUrl);
  const frontImageSrc = frontPhotoPreview || frontPhotoUrl || "";
  const backImageSrc = backPhotoPreview || backPhotoUrl || "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-edit-coffee">
      <div className="space-y-3">
        <Label>{t('forms:editCoffee.photosTitle')}</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('forms:addCoffee.frontPhoto')}</p>
            {!hasFrontPhoto ? (
              <div
                {...frontDropzone.getRootProps()}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                  frontDropzone.isDragActive
                    ? 'border-[#8B6F47] bg-[#F5EFE7]/50 scale-[1.02]'
                    : 'border-[#D4C5B0] bg-gradient-to-br from-[#F5EFE7]/30 to-[#E8DCC8]/30'
                }`}
                data-testid="dropzone-edit-front-photo"
              >
                {/* Hidden inputs for drag-and-drop */}
                <input {...frontDropzone.getInputProps()} style={{ display: 'none' }} />

                {/* Manual file input */}
                <input
                  ref={frontFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFrontFileChange}
                  className="hidden"
                />

                <div className="space-y-3">
                  {/* Header */}
                  <div className="text-center pb-2 border-b border-[#D4C5B0]/40">
                    <p className="font-serif font-medium text-sm text-[#6F4E37]">{t('forms:addCoffee.frontOfBag')}</p>
                    {frontDropzone.isDragActive && (
                      <p className="text-xs text-[#8B6F47] mt-1 animate-pulse">{t('forms:addCoffee.dropPhotoHere')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        frontFileInputRef.current?.click();
                      }}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#6F4E37] to-[#5D4029] p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-h-[110px] flex flex-col items-center justify-center gap-2"
                    >
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h20v20H0z\" fill=\"none\"/%3E%3Cpath d=\"M10 0v20M0 10h20\" stroke=\"%23ffffff\" stroke-width=\"0.5\" opacity=\"0.1\"/%3E%3C/svg%3E')" }} />

                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t('forms:addCoffee.takeOrChoosePhoto')}</p>
                          <p className="text-xs text-white/80 mt-0.5">{t('forms:addCoffee.cameraOrLibrary')}</p>
                        </div>
                      </div>

                      {/* Hover shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    </button>
                  </div>

                  {/* Drag and drop hint (desktop only) */}
                  {!isMobile && (
                    <p className="text-center text-xs text-[#8B6F47]/60 pt-1 border-t border-[#D4C5B0]/30">
                      {t('forms:addCoffee.dragAndDrop')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={frontImageSrc}
                  alt={t('forms:addCoffee.frontAlt')}
                  className="w-full h-40 object-cover"
                />
                <div className="p-2">
                  <input
                    ref={frontFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFrontFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => frontFileInputRef.current?.click()}
                    className="w-full"
                    data-testid="button-change-front-photo"
                  >
                    {t('forms:addCoffee.change')}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('forms:addCoffee.backPhoto')}</p>
            {!hasBackPhoto ? (
              <div
                {...backDropzone.getRootProps()}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                  backDropzone.isDragActive
                    ? 'border-[#8B6F47] bg-[#F5EFE7]/50 scale-[1.02]'
                    : 'border-[#D4C5B0] bg-gradient-to-br from-[#F5EFE7]/30 to-[#E8DCC8]/30'
                }`}
                data-testid="dropzone-edit-back-photo"
              >
                {/* Hidden inputs for drag-and-drop */}
                <input {...backDropzone.getInputProps()} style={{ display: 'none' }} />

                {/* Manual file input */}
                <input
                  ref={backFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackFileChange}
                  className="hidden"
                />

                <div className="space-y-3">
                  {/* Header */}
                  <div className="text-center pb-2 border-b border-[#D4C5B0]/40">
                    <p className="font-serif font-medium text-sm text-[#6F4E37]">{t('forms:addCoffee.backOfBag')}</p>
                    {backDropzone.isDragActive && (
                      <p className="text-xs text-[#8B6F47] mt-1 animate-pulse">{t('forms:addCoffee.dropPhotoHere')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        backFileInputRef.current?.click();
                      }}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#6F4E37] to-[#5D4029] p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-h-[110px] flex flex-col items-center justify-center gap-2"
                    >
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h20v20H0z\" fill=\"none\"/%3E%3Cpath d=\"M10 0v20M0 10h20\" stroke=\"%23ffffff\" stroke-width=\"0.5\" opacity=\"0.1\"/%3E%3C/svg%3E')" }} />

                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t('forms:addCoffee.takeOrChoosePhoto')}</p>
                          <p className="text-xs text-white/80 mt-0.5">{t('forms:addCoffee.cameraOrLibrary')}</p>
                        </div>
                      </div>

                      {/* Hover shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    </button>
                  </div>

                  {/* Drag and drop hint (desktop only) */}
                  {!isMobile && (
                    <p className="text-center text-xs text-[#8B6F47]/60 pt-1 border-t border-[#D4C5B0]/30">
                      {t('forms:addCoffee.dragAndDrop')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={backImageSrc}
                  alt={t('forms:addCoffee.backAlt')}
                  className="w-full h-40 object-cover"
                />
                <div className="p-2">
                  <input
                    ref={backFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => backFileInputRef.current?.click()}
                    className="w-full"
                    data-testid="button-change-back-photo"
                  >
                    {t('forms:addCoffee.change')}
                  </Button>
                </div>
              </div>
            )}
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
