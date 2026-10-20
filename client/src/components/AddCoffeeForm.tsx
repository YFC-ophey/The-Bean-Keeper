import { useState, useCallback, useLayoutEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload, Loader2, CheckCircle2, ChevronDown, Coffee } from "lucide-react";
import { apiRequest, scanPhotosWithGemini, uploadFile } from "@/lib/queryClient";
import { applyReviewedScanValues, clearAutoFilledValues } from "@/lib/coffeeScan";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import DuplicateConfirmationModal from "@/components/DuplicateConfirmationModal";
import { CoffeeEntry } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface ExtractedData {
  roasterName?: string;
  origin?: string;
  variety?: string;
  processMethod?: string;
  roastLevel?: string;
  roastDate?: string;
  flavorNotes?: string;
  farm?: string;
  roasterWebsite?: string;
}

const GEMINI_FIELDS = [
  'roasterName', 'roasterWebsite', 'farm', 'origin', 'variety',
  'processMethod', 'roastLevel', 'roastDate', 'flavorNotes',
] as const;

interface AddCoffeeFormProps {
  onSubmit: (frontPhotoUrl: string, backPhotoUrl: string | null, data: {
    roasterName: string;
    roasterWebsite?: string;
    farm?: string;
    origin?: string;
    variety?: string;
    processMethod?: string;
    roastLevel?: string;
    roastDate?: string;
    flavorNotes?: string;
    weight?: string;
    price?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function AddCoffeeForm({ onSubmit, onCancel }: AddCoffeeFormProps) {
  const { t } = useTranslation(['forms', 'common', 'coffee']);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [frontPhotoFile, setFrontPhotoFile] = useState<File | null>(null);
  const [frontPhotoPreview, setFrontPhotoPreview] = useState<string>("");
  const [backPhotoFile, setBackPhotoFile] = useState<File | null>(null);
  const [backPhotoPreview, setBackPhotoPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [geminiPreview, setGeminiPreview] = useState<ExtractedData | null>(null);
  const [geminiError, setGeminiError] = useState("");
  const [isGeminiScanning, setIsGeminiScanning] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateEntry, setDuplicateEntry] = useState<CoffeeEntry | null>(null);
  const [pendingSave, setPendingSave] = useState<{
    frontPhotoUrl: string;
    backPhotoUrl: string | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    roasterName: "",
    roasterWebsite: "",
    farm: "",
    origin: "",
    variety: "",
    processMethod: "",
    roastLevel: "",
    roastDate: "",
    flavorNotes: "",
    weight: "",
    price: "",
  });

  const [currency, setCurrency] = useState<string>("USD");
  const autoFilledFields = Object.entries(extractedData)
    .filter(([key, value]) => value && formData[key as keyof typeof formData] === value)
    .map(([key]) => key);

  const formDataRef = useRef(formData);
  const autoFilledRef = useRef<Partial<typeof formData>>({});
  const scanVersionRef = useRef(0);
  const scanInFlightRef = useRef(false);

  useLayoutEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const clearAutoFilledData = () => {
    const cleared = clearAutoFilledValues(formDataRef.current, autoFilledRef.current);
    formDataRef.current = cleared;
    autoFilledRef.current = {};
    setFormData(cleared);
    setExtractedData({});
    setGeminiPreview(null);
    setGeminiError("");
    scanInFlightRef.current = false;
    setIsGeminiScanning(false);
  };

  // Refs for file inputs
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing entries for duplicate detection
  const { data: existingEntries = [] } = useQuery<CoffeeEntry[]>({
    queryKey: ["/api/coffee-entries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/coffee-entries");
      return response.json();
    },
  });

  const { data: scanOptions, isLoading: scanOptionsLoading } = useQuery<{ geminiAvailable: boolean }>({
    queryKey: ["/api/scan-options"],
    queryFn: async () => (await apiRequest("GET", "/api/scan-options")).json(),
  });

  const scanWithGemini = async () => {
    if (!frontPhotoFile || scanInFlightRef.current || isSaving) return;
    const scanVersion = scanVersionRef.current;
    scanInFlightRef.current = true;
    setIsGeminiScanning(true);
    setGeminiError("");
    setGeminiPreview(null);
    try {
      const response = await scanPhotosWithGemini(frontPhotoFile, backPhotoFile);
      const found = await response.json() as Record<string, unknown>;
      if (scanVersion !== scanVersionRef.current) return;
      const preview: ExtractedData = {};
      for (const field of GEMINI_FIELDS) {
        const value = found[field];
        if (field === 'flavorNotes' && Array.isArray(value)) {
          preview.flavorNotes = value.filter((note): note is string => typeof note === 'string')
            .join(', ');
        } else if (typeof value === 'string' && value.trim()) {
          preview[field] = value.trim();
        }
      }
      setGeminiPreview(preview);
    } catch (error) {
      if (scanVersion === scanVersionRef.current) {
        setGeminiError(error instanceof Error ? error.message : t('forms:addCoffee.gemini.failed'));
      }
    } finally {
      if (scanVersion === scanVersionRef.current) {
        scanInFlightRef.current = false;
        setIsGeminiScanning(false);
      }
    }
  };

  const applyGeminiPreview = () => {
    if (!geminiPreview) return;
    const result = applyReviewedScanValues(formDataRef.current, autoFilledRef.current, geminiPreview);
    formDataRef.current = result.form;
    autoFilledRef.current = result.autoFilled;
    setFormData(result.form);
    setExtractedData(result.autoFilled);
    setGeminiPreview(null);
  };

  const onDropFront = useCallback((acceptedFiles: File[]) => {
    if (isSaving) return;
    const file = acceptedFiles[0];
    if (file) {
      scanVersionRef.current += 1;
      clearAutoFilledData();
      setFrontPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setFrontPhotoPreview(preview);
    }
  }, [isSaving]);

  const onDropBack = useCallback((acceptedFiles: File[]) => {
    if (isSaving) return;
    const file = acceptedFiles[0];
    if (file) {
      scanVersionRef.current += 1;
      clearAutoFilledData();
      setBackPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setBackPhotoPreview(preview);
    }
  }, [isSaving]);

  const frontDropzone = useDropzone({
    onDrop: onDropFront,
    disabled: isSaving,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.heif'] },
    multiple: false,
  });

  const backDropzone = useDropzone({
    onDrop: onDropBack,
    disabled: isSaving,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.heif'] },
    multiple: false,
  });

  // Handlers for manual file input (camera vs file browser)
  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSaving) return;
    const file = e.target.files?.[0];
    if (file) {
      scanVersionRef.current += 1;
      clearAutoFilledData();
      setFrontPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setFrontPhotoPreview(preview);
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSaving) return;
    const file = e.target.files?.[0];
    if (file) {
      scanVersionRef.current += 1;
      clearAutoFilledData();
      setBackPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setBackPhotoPreview(preview);
    }
  };

  // Check for duplicate entries
  const checkForDuplicates = () => {
    if (!formData.roasterName.trim()) return null;

    // Find entries with similar roaster name (case-insensitive)
    const roasterLower = formData.roasterName.toLowerCase().trim();
    const duplicate = existingEntries.find(entry =>
      entry.roasterName.toLowerCase().trim() === roasterLower
    );

    return duplicate || null;
  };

  // Proceed with save (called after duplicate check or confirmation)
  const proceedWithSave = async (frontPhotoUrl: string, backPhotoUrl: string | null) => {
    try {
      setIsSaving(true);

      // Call parent handler with both photo URLs and form data
      await onSubmit(frontPhotoUrl, backPhotoUrl, formData);

      // Show success state
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
      setPendingSave(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontPhotoFile || !formData.roasterName.trim()) return;

    setIsSaving(true);

    try {
      // Upload front photo
      const frontUploadResponse = await apiRequest('POST', '/api/upload-url');
      const { uploadURL: frontUploadURL } = await frontUploadResponse.json();

      const frontPhotoUrl = await uploadFile(frontUploadURL, frontPhotoFile);

      let backPhotoUrl = null;

      // Upload back photo if present
      if (backPhotoFile) {
        const backUploadResponse = await apiRequest('POST', '/api/upload-url');
        const { uploadURL: backUploadURL } = await backUploadResponse.json();

        backPhotoUrl = await uploadFile(backUploadURL, backPhotoFile);
      }

      // Check for duplicates before saving
      const duplicate = checkForDuplicates();

      if (duplicate) {
        // Store pending save data and show confirmation
        setPendingSave({ frontPhotoUrl, backPhotoUrl });
        setDuplicateEntry(duplicate);
        setShowDuplicateModal(true);
        setIsSaving(false);
      } else {
        // No duplicate, proceed with save
        await proceedWithSave(frontPhotoUrl, backPhotoUrl);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
      setIsSaving(false);
    }
  };

  // Handle confirmed save (after duplicate warning)
  const handleConfirmedSave = async () => {
    if (pendingSave) {
      await proceedWithSave(pendingSave.frontPhotoUrl, pendingSave.backPhotoUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-add-coffee">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Front Photo */}
        <div>
          <Label className="mb-3 block">{t('forms:addCoffee.frontPhoto')} {t('forms:addCoffee.required')}</Label>
          {!frontPhotoPreview ? (
            <div
              {...frontDropzone.getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                frontDropzone.isDragActive
                  ? 'border-[#8B6F47] bg-[#F5EFE7]/50 scale-[1.02]'
                  : 'border-[#D4C5B0] bg-gradient-to-br from-[#F5EFE7]/30 to-[#E8DCC8]/30'
              }`}
              data-testid="dropzone-front-photo"
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
                    disabled={isSaving}
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
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={frontPhotoPreview}
                  alt={t('forms:addCoffee.frontAlt')}
                  className="w-full h-full object-cover"
                  data-testid="img-front-preview"
                />
              </div>
              <div className="p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => {
                    scanVersionRef.current += 1;
                    clearAutoFilledData();
                    setFrontPhotoPreview("");
                    setFrontPhotoFile(null);
                  }}
                  className="w-full"
                  data-testid="button-change-front-photo"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {t('forms:addCoffee.change')}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Back Photo */}
        <div>
          <Label className="mb-3 block">{t('forms:addCoffee.backPhoto')}</Label>
          {!backPhotoPreview ? (
            <div
              {...backDropzone.getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                backDropzone.isDragActive
                  ? 'border-[#8B6F47] bg-[#F5EFE7]/50 scale-[1.02]'
                  : 'border-[#D4C5B0] bg-gradient-to-br from-[#F5EFE7]/30 to-[#E8DCC8]/30'
              }`}
              data-testid="dropzone-back-photo"
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
                    disabled={isSaving}
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
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={backPhotoPreview}
                  alt={t('forms:addCoffee.backAlt')}
                  className="w-full h-full object-cover"
                  data-testid="img-back-preview"
                />
              </div>
              <div className="p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => {
                    scanVersionRef.current += 1;
                    clearAutoFilledData();
                    setBackPhotoPreview("");
                    setBackPhotoFile(null);
                  }}
                  className="w-full"
                  data-testid="button-change-back-photo"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {t('forms:addCoffee.change')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Gemini fills fields only after the user reviews and applies its suggestions. */}
      {autoFilledFields.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              {autoFilledFields.length} {autoFilledFields.length === 1 ? t('forms:addCoffee.autoFill.field') : t('forms:addCoffee.autoFill.fields')} {t('forms:addCoffee.autoFill.fieldsAutoFilled')}
            </p>
            <p className="text-xs text-green-700 dark:text-green-200 mt-1">
              {autoFilledFields.slice(0, 3).join(', ')}
              {autoFilledFields.length > 3 && ` +${autoFilledFields.length - 3} more`}
            </p>
          </div>
        </div>
      )}

      {frontPhotoFile && (
        <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{t('forms:addCoffee.gemini.title')}</p>
              <p className="text-xs text-muted-foreground">{t('forms:addCoffee.gemini.privacy')}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={scanWithGemini}
              disabled={!scanOptions?.geminiAvailable || isGeminiScanning || isSaving}
              data-testid="button-scan-gemini"
            >
              {isGeminiScanning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isGeminiScanning ? t('forms:addCoffee.gemini.scanning') : t('forms:addCoffee.gemini.scan')}
            </Button>
          </div>
          {!scanOptionsLoading && !scanOptions?.geminiAvailable && (
            <p role="status" className="text-sm text-muted-foreground">{t('forms:addCoffee.gemini.unavailable')}</p>
          )}
          {geminiError && <p role="alert" className="text-sm text-destructive">{geminiError}</p>}
          {geminiPreview && (
            <div className="space-y-2" data-testid="gemini-preview">
              <p className="text-sm font-medium">{t('forms:addCoffee.gemini.review')}</p>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                {GEMINI_FIELDS.filter((field) => geminiPreview[field]).map((field) => (
                  <div key={field} className="rounded border p-2 break-words">
                    <span className="font-medium">{t(`forms:addCoffee.labels.${field}`)}: </span>
                    <span>{geminiPreview[field]}</span>
                    {formData[field] && formData[field] !== geminiPreview[field] && (
                      <p className="text-muted-foreground mt-1">
                        {t('forms:addCoffee.gemini.current')}: {formData[field]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {GEMINI_FIELDS.some((field) => geminiPreview[field]) ? (
                <Button type="button" size="sm" onClick={applyGeminiPreview} disabled={isSaving || isGeminiScanning} data-testid="button-apply-gemini">
                  {t('forms:addCoffee.gemini.apply')}
                </Button>
              ) : <p className="text-sm text-muted-foreground">{t('forms:addCoffee.gemini.noFields')}</p>}
            </div>
          )}
        </div>
      )}

      {/* Essential Fields Group */}
      <div className="space-y-4 p-4 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full" />
          {t('forms:addCoffee.sections.essentialInfo')}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="roasterName">{t('forms:addCoffee.labels.roasterName')} {t('forms:addCoffee.required')}</Label>
            <Input
              id="roasterName"
              required
              value={formData.roasterName}
              onChange={(e) => setFormData({ ...formData, roasterName: e.target.value })}
              data-testid="input-roaster-name"
            />
          </div>
          <div>
            <Label htmlFor="origin">{t('forms:addCoffee.labels.origin')}</Label>
            <Input
              id="origin"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              placeholder={t('forms:addCoffee.placeholders.origin')}
              data-testid="input-origin"
            />
          </div>
        </div>
      </div>

      {/* Optional Details Group - Collapsible on Mobile */}
      <Collapsible defaultOpen={!isMobile} className="space-y-4">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/50 dark:hover:bg-muted/10 rounded-lg transition-colors group">
          <span className="text-sm font-medium flex items-center gap-2">
            {t('forms:addCoffee.sections.additionalDetails')}
            {autoFilledFields.filter(key => !['roasterName', 'origin'].includes(key)).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {autoFilledFields.filter(key => !['roasterName', 'origin'].includes(key)).length} {t('forms:addCoffee.sections.filled')}
              </Badge>
            )}
          </span>
          <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="roasterWebsite">{t('forms:addCoffee.labels.roasterWebsite')}</Label>
              <Input
                id="roasterWebsite"
                value={formData.roasterWebsite}
                onChange={(e) => setFormData({ ...formData, roasterWebsite: e.target.value })}
                placeholder={t('forms:addCoffee.placeholders.roasterWebsite')}
                data-testid="input-roaster-website"
              />
            </div>
            <div>
              <Label htmlFor="farm">{t('forms:addCoffee.labels.farm')}</Label>
              <Input
                id="farm"
                value={formData.farm}
                onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                data-testid="input-farm"
              />
            </div>
            <div>
              <Label htmlFor="variety">{t('forms:addCoffee.labels.variety')}</Label>
              <Input
                id="variety"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                placeholder={t('forms:addCoffee.placeholders.variety')}
                data-testid="input-variety"
              />
            </div>
            <div>
              <Label htmlFor="processMethod">{t('forms:addCoffee.labels.processMethod')}</Label>
              <Input
                id="processMethod"
                value={formData.processMethod}
                onChange={(e) => setFormData({ ...formData, processMethod: e.target.value })}
                placeholder={t('forms:addCoffee.placeholders.processMethod')}
                data-testid="input-process"
              />
            </div>
            <div>
              <Label htmlFor="roastLevel">{t('forms:addCoffee.labels.roastLevel')}</Label>
              <select
                id="roastLevel"
                value={formData.roastLevel}
                onChange={(e) => setFormData({ ...formData, roastLevel: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="select-roast-level"
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
                data-testid="input-roast-date"
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
                data-testid="input-weight"
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
                  data-testid="input-price"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div>
        <Label htmlFor="flavorNotes">{t('forms:addCoffee.labels.flavorNotes')}</Label>
        <Input
          id="flavorNotes"
          value={formData.flavorNotes}
          onChange={(e) => setFormData({ ...formData, flavorNotes: e.target.value })}
          placeholder={t('forms:addCoffee.placeholders.flavorNotes')}
          data-testid="input-flavor-notes"
        />
        <p className="text-xs text-muted-foreground mt-1">{t('forms:addCoffee.flavorNotesHint')}</p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSaving}
          data-testid="button-cancel"
        >
          {t('common:buttons.cancel')}
        </Button>

        <Button
          type="submit"
          disabled={!frontPhotoFile || !formData.roasterName || isSaving || isGeminiScanning}
          className={`flex-1 relative overflow-hidden transition-all duration-300 ${
            saveSuccess
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-600 hover:to-green-700'
              : 'bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] hover:from-[#5D4029] hover:to-[#6F4E37]'
          }`}
          data-testid="button-save-entry"
        >
          {/* Coffee brewing animation background */}
          {isSaving && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          )}

          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSaving ? (
              <>
                <Coffee className="w-4 h-4 animate-bounce" />
                <span>{t('forms:addCoffee.buttons.brewing')}</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('forms:addCoffee.buttons.saved')}</span>
              </>
            ) : (
              <span>{t('forms:addCoffee.buttons.saveEntry')}</span>
            )}
          </span>
        </Button>
      </div>

      {/* Duplicate Confirmation Modal */}
      <DuplicateConfirmationModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setDuplicateEntry(null);
          setPendingSave(null);
        }}
        onConfirm={handleConfirmedSave}
        duplicateEntry={duplicateEntry}
        newRoasterName={formData.roasterName}
      />

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </form>
  );
}
