import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Camera, Upload, Loader2, CheckCircle2, ScanText, ChevronDown, Image, Coffee } from "lucide-react";
import Tesseract from "tesseract.js";
import { apiRequest } from "@/lib/queryClient";
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
  }) => void;
  onCancel: () => void;
}

export default function AddCoffeeForm({ onSubmit, onCancel }: AddCoffeeFormProps) {
  const { t } = useTranslation(['forms', 'common', 'coffee']);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [frontPhotoFile, setFrontPhotoFile] = useState<File | null>(null);
  const [frontPhotoPreview, setFrontPhotoPreview] = useState<string>("");
  const [backPhotoFile, setBackPhotoFile] = useState<File | null>(null);
  const [backPhotoPreview, setBackPhotoPreview] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scanStage, setScanStage] = useState<'ocr' | 'ai' | 'upload' | null>(null);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
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

  const isOCRRunningRef = useRef(false);
  const pendingOCRRef = useRef(false);

  // Refs for file inputs
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing entries for duplicate detection
  const { data: existingEntries = [] } = useQuery<CoffeeEntry[]>({
    queryKey: ["/api/coffee-entries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/coffee-entries");
      return response.json();
    },
  });

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

  // Trigger OCR when photo files change
  useEffect(() => {
    // Skip if no files are uploaded
    if (!frontPhotoFile && !backPhotoFile) {
      return;
    }

    // If OCR is already running, mark as pending
    if (isOCRRunningRef.current) {
      pendingOCRRef.current = true;
      return;
    }

    performOCR();
  }, [frontPhotoFile, backPhotoFile]);

  const performOCR = async () => {
    // Prevent concurrent OCR runs
    if (isOCRRunningRef.current) {
      return;
    }

    isOCRRunningRef.current = true;
    setIsScanning(true);
    setScanStage('ocr');
    setProgress(0);
    try {
      let combinedText = "";

      // Run OCR on front photo
      if (frontPhotoFile) {
        setProgress(10);
        const frontResult = await Tesseract.recognize(frontPhotoFile, 'eng', {
          logger: (m) => console.log('Front:', m),
        });
        combinedText += frontResult.data.text + "\n\n";
        setProgress(30);
      }

      // Run OCR on back photo
      if (backPhotoFile) {
        setProgress(40);
        const backResult = await Tesseract.recognize(backPhotoFile, 'eng', {
          logger: (m) => console.log('Back:', m),
        });
        combinedText += backResult.data.text;
        setProgress(60);
      }

      if (!combinedText.trim()) {
        setIsScanning(false);
        setScanStage(null);
        setProgress(0);
        return;
      }

      // Clean OCR text to remove artifacts and special characters
      const cleanText = (rawText: string): string => {
        return rawText
          .split('\n')
          .map(line => {
            return line
              // Remove common OCR artifacts (but keep legitimate apostrophes)
              .replace(/[«»`´""]/g, '')
              // Remove non-printable characters and control characters
              .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
              // Remove OCR artifacts at end of lines: mixed-case gibberish like "| il aE", "| Il a3"
              // Only remove if it's mixed case or has unusual pattern (not valid words)
              .replace(/\s*\|\s*[a-z]{1,2}\s+[a-zA-Z]{1,3}\s*$/g, '')
              // Clean up multiple spaces within the line
              .replace(/\s+/g, ' ')
              .trim();
          })
          .join('\n')
          .trim();
      };

      const text = cleanText(combinedText);
      const lowerText = text.toLowerCase();
      const lines = text.split('\n').filter(line => line.trim());
      
      const extracted: ExtractedData = {};

      // Extract structured label fields (FARM:, ORIGIN:, etc.)
      const farmMatch = text.match(/(?:FARM|Farm)[\s:]+([^\n]+)/i);
      if (farmMatch) {
        extracted.farm = farmMatch[1].trim();
      }

      const originMatch = text.match(/(?:ORIGIN|Origin)[\s:]+([^\n]+)/i);
      if (originMatch) {
        extracted.origin = originMatch[1].trim();
      } else {
        // Fallback: Extract origin countries
        const origins = [
          'Ethiopia', 'Colombia', 'Kenya', 'Brazil', 'Guatemala', 'Costa Rica',
          'Peru', 'Honduras', 'Rwanda', 'Burundi', 'Tanzania', 'Uganda',
          'El Salvador', 'Nicaragua', 'Panama', 'Mexico', 'Yemen', 'Indonesia',
          'Papua New Guinea', 'India', 'Vietnam', 'Thailand'
        ];
        for (const origin of origins) {
          if (lowerText.includes(origin.toLowerCase())) {
            extracted.origin = origin;
            break;
          }
        }
      }

      const varietyMatch = text.match(/(?:VARIETY|Variety)[\s:]+([^\n]+)/i);
      if (varietyMatch) {
        extracted.variety = varietyMatch[1].trim();
      } else {
        // Fallback: Extract variety keywords
        const varieties = [
          'Heirloom', 'Bourbon', 'Typica', 'Caturra', 'Catuai', 'Gesha', 'Geisha',
          'SL28', 'SL34', 'Ruiru', 'Pacamara', 'Villa Sarchi', 'Red Bourbon', 
          'Yellow Bourbon', 'Pink Bourbon', 'Mundo Novo', 'Maragogype'
        ];
        const foundVarieties: string[] = [];
        for (const variety of varieties) {
          if (lowerText.includes(variety.toLowerCase())) {
            foundVarieties.push(variety);
          }
        }
        if (foundVarieties.length > 0) {
          extracted.variety = foundVarieties.join(', ');
        }
      }

      const processMatch = text.match(/(?:PROCESS|Process)[\s:]+([^\n]+)/i);
      if (processMatch) {
        extracted.processMethod = processMatch[1].trim();
      } else {
        // Fallback: Extract process method keywords
        if (lowerText.includes('fully washed') || lowerText.includes('washed') || lowerText.includes('wet process')) {
          extracted.processMethod = 'Washed';
        } else if (lowerText.includes('natural') || lowerText.includes('dry process')) {
          extracted.processMethod = 'Natural';
        } else if (lowerText.includes('honey') || lowerText.includes('pulped natural')) {
          extracted.processMethod = 'Honey';
        } else if (lowerText.includes('anaerobic')) {
          extracted.processMethod = 'Anaerobic';
        }
      }

      const flavorMatch = text.match(/(?:FLAVOU?RS?|Flavou?rs?)[\s:]+([^\n]+)/i);
      if (flavorMatch) {
        extracted.flavorNotes = flavorMatch[1].trim();
      } else {
        // Fallback: Extract flavor keywords
        const flavorKeywords = [
          'chocolate', 'caramel', 'citrus', 'berry', 'fruity', 'floral', 'nutty',
          'sweet', 'honey', 'vanilla', 'blueberry', 'strawberry', 'cherry',
          'orange', 'lemon', 'apple', 'peach', 'jasmine', 'rose', 'lavender',
          'almond', 'hazelnut', 'walnut', 'brown sugar', 'maple', 'toffee',
          'wine', 'grape', 'tropical', 'mango', 'pineapple', 'coconut',
          'stone fruit', 'red fruit', 'black tea', 'earl grey', 'spice', 'cinnamon',
          'raspberry'
        ];
        const foundFlavors: string[] = [];
        for (const flavor of flavorKeywords) {
          if (lowerText.includes(flavor)) {
            foundFlavors.push(flavor.charAt(0).toUpperCase() + flavor.slice(1));
          }
        }
        if (foundFlavors.length > 0) {
          extracted.flavorNotes = foundFlavors.slice(0, 5).join(', ');
        }
      }

      const roastedMatch = text.match(/(?:ROAST(?:ED)?|Roast(?:ed)?)[\s:]+([^\n]+)/i);
      if (roastedMatch) {
        extracted.roastDate = roastedMatch[1].trim();
      } else {
        // Fallback: Extract various date formats
        const datePatterns = [
          /(\w+ \d{1,2},? \d{4})/,  // October 6, 2025
          /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
          /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
        ];
        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            extracted.roastDate = match[1];
            break;
          }
        }
      }

      // Extract roaster name - look for prominent text with "Coffee" or "Roasters"
      const excludeWords = /^(roasted|locally|sourced|fresh|organic|single|origin|direct|trade|imported|premium|specialty|craft|artisan|small|batch|hand|selected|estate|grown|fair|sustainable|this|a|an|the)\s+/i;
      
      const roasterPatterns = [
        /^([A-Z][A-Za-z\s&'-]{2,50}(?:Coffee|Roasters?))/im,
        /\n([A-Z][A-Za-z\s&'-]{2,50}(?:Coffee|Roasters?))/i,
      ];
      
      for (const pattern of roasterPatterns) {
        const regex = new RegExp(pattern.source, 'gim');
        const matches = Array.from(text.matchAll(regex));
        for (const match of matches) {
          let name = match[1].trim().replace(/\s+/g, ' ');
          
          if (excludeWords.test(name)) {
            continue;
          }
          
          if (/(farm|origin|variety|process|flavou?rs?|roast(?:ed)?\s*(?:date|on)?)\s*:/i.test(name)) {
            continue;
          }
          
          const fullMatch = match[0];
          const beforeMatch = text.substring(Math.max(0, match.index! - 20), match.index!);
          if (/[a-z]\s*$/.test(beforeMatch)) {
            continue;
          }
          
          const capitalWords = name.match(/[A-Z][a-z]+/g);
          if (capitalWords && capitalWords.length >= 2 && name.length > 5 && name.length < 60) {
            extracted.roasterName = name;
            break;
          }
        }
        if (extracted.roasterName) break;
      }

      if (!extracted.roasterName) {
        const earlyLines = lines.slice(0, 10);
        const potentialRoaster = earlyLines.find(line => {
          const trimmed = line.trim();
          
          if (trimmed.length < 5 || trimmed.length > 50) return false;
          if (!/^[A-Z]/.test(trimmed)) return false;
          if (excludeWords.test(trimmed)) return false;
          if (/(washed|natural|honey|farm|origin|variety|process|roasted|flavou?rs?|direct|trade|sourced|wpg|300g|gram)/i.test(trimmed)) return false;
          
          const capitalWords = trimmed.match(/[A-Z][a-z]+/g);
          return capitalWords && capitalWords.length >= 2;
        });
        
        if (potentialRoaster) {
          extracted.roasterName = potentialRoaster.trim();
        }
      }

      // Extract website URL
      const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/i);
      if (urlMatch) {
        extracted.roasterWebsite = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
      }

      console.log('Combined OCR text from both photos:', text);
      console.log('Basic extracted data:', extracted);

      // Use AI to optimize extraction (better than regex patterns)
      setScanStage('ai');
      setProgress(70);
      try {
        const aiResponse = await apiRequest('POST', '/api/extract-coffee-info', { text });
        setProgress(90);

        if (aiResponse.ok) {
          const aiExtracted = await aiResponse.json();
          console.log('AI-enhanced extracted data:', aiExtracted);
          
          // Clean AI-extracted values to remove any remaining artifacts
          const cleanValue = (value: string | undefined): string | undefined => {
            if (!value) return value;
            return value
              .replace(/[«»`´""]/g, '')
              .replace(/\s*\|\s*[a-zA-Z0-9]{1,3}(\s+[a-zA-Z0-9]{1,3})*\s*$/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          };
          
          // Merge AI results with basic extraction, preferring AI results when available
          const mergedData: ExtractedData = {
            roasterName: cleanValue(aiExtracted.roasterName) || extracted.roasterName,
            roasterWebsite: cleanValue(aiExtracted.roasterWebsite) || extracted.roasterWebsite,
            farm: cleanValue(aiExtracted.farm) || extracted.farm,
            origin: cleanValue(aiExtracted.origin) || extracted.origin,
            variety: cleanValue(aiExtracted.variety) || extracted.variety,
            processMethod: cleanValue(aiExtracted.processMethod) || extracted.processMethod,
            roastLevel: cleanValue(aiExtracted.roastLevel) || extracted.roastLevel,
            roastDate: cleanValue(aiExtracted.roastDate) || extracted.roastDate,
            flavorNotes: aiExtracted.flavorNotes ? aiExtracted.flavorNotes.map(cleanValue).filter(Boolean).join(', ') : extracted.flavorNotes,
          };
          
          // Fallback: If no roaster name found but we have a website, extract from website
          if (!mergedData.roasterName && mergedData.roasterWebsite) {
            let websiteName = mergedData.roasterWebsite
              .replace(/^https?:\/\/(www\.)?/, '')
              .split(/[/.]/)[0]
              .split(/[-_]/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            // Remove redundant "Coffee" or "Roasters" suffix if domain already contains it
            const lowerName = websiteName.toLowerCase();
            if (lowerName.includes('coffee') || lowerName.includes('roaster')) {
              mergedData.roasterName = websiteName;
            } else {
              mergedData.roasterName = websiteName + ' Coffee';
            }
          }
          
          setExtractedData(mergedData);
          setFormData((prev) => ({
            ...prev,
            ...mergedData,
          }));
          setProgress(100);
        } else {
          setExtractedData(extracted);
          setFormData((prev) => ({
            ...prev,
            ...extracted,
          }));
          setProgress(100);
        }
      } catch (aiError) {
        console.error('AI extraction error, using basic extraction:', aiError);
        setExtractedData(extracted);
        setFormData((prev) => ({
          ...prev,
          ...extracted,
        }));
        setProgress(100);
      }
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanStage(null);
        setProgress(0);
      }, 500);
      isOCRRunningRef.current = false;

      // If files changed during OCR, rerun
      if (pendingOCRRef.current) {
        pendingOCRRef.current = false;
        performOCR();
      }
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
      setScanStage('upload');

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
      setScanStage(null);
      setPendingSave(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontPhotoFile || !formData.roasterName.trim()) return;

    setIsScanning(true);
    setIsSaving(true);
    setScanStage('upload');

    try {
      // Upload front photo
      const frontUploadResponse = await apiRequest('POST', '/api/upload-url');
      const { uploadURL: frontUploadURL } = await frontUploadResponse.json();

      const frontUploadResult = await fetch(frontUploadURL, {
        method: 'PUT',
        body: frontPhotoFile,
        headers: {
          'Content-Type': frontPhotoFile.type,
        },
      });

      const { url: frontPhotoUrl } = await frontUploadResult.json();

      let backPhotoUrl = null;

      // Upload back photo if present
      if (backPhotoFile) {
        const backUploadResponse = await apiRequest('POST', '/api/upload-url');
        const { uploadURL: backUploadURL } = await backUploadResponse.json();

        const backUploadResult = await fetch(backUploadURL, {
          method: 'PUT',
          body: backPhotoFile,
          headers: {
            'Content-Type': backPhotoFile.type,
          },
        });

        const { url: backPhotoUrlResponse } = await backUploadResult.json();
        backPhotoUrl = backPhotoUrlResponse;
      }

      // Check for duplicates before saving
      const duplicate = checkForDuplicates();

      if (duplicate) {
        // Store pending save data and show confirmation
        setPendingSave({ frontPhotoUrl, backPhotoUrl });
        setDuplicateEntry(duplicate);
        setShowDuplicateModal(true);
        setIsScanning(false);
        setIsSaving(false);
        setScanStage(null);
      } else {
        // No duplicate, proceed with save
        await proceedWithSave(frontPhotoUrl, backPhotoUrl);
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
      setIsScanning(false);
      setIsSaving(false);
      setScanStage(null);
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

              {/* Manual file inputs */}
              <input
                ref={frontCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFrontFileChange}
                className="hidden"
              />
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

                {/* Two option buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Take Photo Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      frontCameraInputRef.current?.click();
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
                        <p className="font-semibold text-sm">{t('forms:addCoffee.takePhoto')}</p>
                        <p className="text-xs text-white/80 mt-0.5">{t('forms:addCoffee.useCamera')}</p>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  </button>

                  {/* Choose from Device Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      frontFileInputRef.current?.click();
                    }}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#E8DCC8] to-[#D4C5B0] p-4 text-[#6F4E37] shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-h-[110px] flex flex-col items-center justify-center gap-2 border-2 border-[#D4C5B0]"
                  >
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h20v20H0z\" fill=\"none\"/%3E%3Cpath d=\"M10 0v20M0 10h20\" stroke=\"%236F4E37\" stroke-width=\"0.5\" opacity=\"0.05\"/%3E%3C/svg%3E')" }} />

                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/80 transition-colors">
                        <Image className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t('forms:addCoffee.choosePhoto')}</p>
                        <p className="text-xs text-[#6F4E37]/70 mt-0.5">{t('forms:addCoffee.fromDevice')}</p>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
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
                  onClick={() => {
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

              {/* Manual file inputs */}
              <input
                ref={backCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleBackFileChange}
                className="hidden"
              />
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

                {/* Two option buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Take Photo Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      backCameraInputRef.current?.click();
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
                        <p className="font-semibold text-sm">{t('forms:addCoffee.takePhoto')}</p>
                        <p className="text-xs text-white/80 mt-0.5">{t('forms:addCoffee.useCamera')}</p>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  </button>

                  {/* Choose from Device Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      backFileInputRef.current?.click();
                    }}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#E8DCC8] to-[#D4C5B0] p-4 text-[#6F4E37] shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-h-[110px] flex flex-col items-center justify-center gap-2 border-2 border-[#D4C5B0]"
                  >
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h20v20H0z\" fill=\"none\"/%3E%3Cpath d=\"M10 0v20M0 10h20\" stroke=\"%236F4E37\" stroke-width=\"0.5\" opacity=\"0.05\"/%3E%3C/svg%3E')" }} />

                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/80 transition-colors">
                        <Image className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t('forms:addCoffee.choosePhoto')}</p>
                        <p className="text-xs text-[#6F4E37]/70 mt-0.5">{t('forms:addCoffee.fromDevice')}</p>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
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
                  onClick={() => {
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

      {/* Scanning status */}
      {isScanning && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {scanStage === 'ocr' && t('forms:addCoffee.scanning.readingText')}
                {scanStage === 'ai' && t('forms:addCoffee.scanning.aiAnalyzing')}
                {scanStage === 'upload' && t('forms:addCoffee.scanning.uploadingPhotos')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-200 mt-0.5">{t('forms:addCoffee.scanning.thisMayTake')}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Auto-fill badge */}
      {!isScanning && Object.keys(extractedData).length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              {Object.keys(extractedData).length} {Object.keys(extractedData).length === 1 ? t('forms:addCoffee.autoFill.field') : t('forms:addCoffee.autoFill.fields')} {t('forms:addCoffee.autoFill.fieldsAutoFilled')}
            </p>
            <p className="text-xs text-green-700 dark:text-green-200 mt-1">
              {Object.keys(extractedData).slice(0, 3).join(', ')}
              {Object.keys(extractedData).length > 3 && ` +${Object.keys(extractedData).length - 3} more`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={performOCR}
            disabled={isScanning || (!frontPhotoFile && !backPhotoFile)}
            className="ml-auto"
            data-testid="button-rescan"
          >
            <ScanText className="w-4 h-4 mr-2" />
            {t('forms:addCoffee.autoFill.rescan')}
          </Button>
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
            {Object.keys(extractedData).filter(key => !['roasterName', 'origin'].includes(key)).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {Object.keys(extractedData).filter(key => !['roasterName', 'origin'].includes(key)).length} {t('forms:addCoffee.sections.filled')}
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
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && !value.startsWith('$')) {
                    setFormData({ ...formData, price: '$' + value });
                  }
                }}
                placeholder={t('forms:addCoffee.placeholders.price')}
                data-testid="input-price"
              />
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
          disabled={!frontPhotoFile || !formData.roasterName || isSaving || isScanning}
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
