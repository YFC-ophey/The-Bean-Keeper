import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle2, ScanText } from "lucide-react";
import Tesseract from "tesseract.js";

interface ExtractedData {
  roasterName?: string;
  origin?: string;
  variety?: string;
  processMethod?: string;
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
    roastDate?: string;
    flavorNotes?: string;
    weight?: string;
    price?: string;
  }) => void;
  onCancel: () => void;
}

export default function AddCoffeeForm({ onSubmit, onCancel }: AddCoffeeFormProps) {
  const [frontPhotoFile, setFrontPhotoFile] = useState<File | null>(null);
  const [frontPhotoPreview, setFrontPhotoPreview] = useState<string>("");
  const [backPhotoFile, setBackPhotoFile] = useState<File | null>(null);
  const [backPhotoPreview, setBackPhotoPreview] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [formData, setFormData] = useState({
    roasterName: "",
    roasterWebsite: "",
    farm: "",
    origin: "",
    variety: "",
    processMethod: "",
    roastDate: "",
    flavorNotes: "",
    weight: "",
    price: "",
  });

  const isOCRRunningRef = useRef(false);
  const pendingOCRRef = useRef(false);

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
    try {
      let combinedText = "";
      
      // Run OCR on front photo
      if (frontPhotoFile) {
        const frontResult = await Tesseract.recognize(frontPhotoFile, 'eng', {
          logger: (m) => console.log('Front:', m),
        });
        combinedText += frontResult.data.text + "\n\n";
      }
      
      // Run OCR on back photo
      if (backPhotoFile) {
        const backResult = await Tesseract.recognize(backPhotoFile, 'eng', {
          logger: (m) => console.log('Back:', m),
        });
        combinedText += backResult.data.text;
      }

      if (!combinedText.trim()) {
        setIsScanning(false);
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
      try {
        const aiResponse = await fetch('/api/extract-coffee-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        
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
        } else {
          setExtractedData(extracted);
          setFormData((prev) => ({
            ...prev,
            ...extracted,
          }));
        }
      } catch (aiError) {
        console.error('AI extraction error, using basic extraction:', aiError);
        setExtractedData(extracted);
        setFormData((prev) => ({
          ...prev,
          ...extracted,
        }));
      }
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setIsScanning(false);
      isOCRRunningRef.current = false;

      // If files changed during OCR, rerun
      if (pendingOCRRef.current) {
        pendingOCRRef.current = false;
        performOCR();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!frontPhotoFile) return;

    setIsScanning(true);
    try {
      // Upload front photo
      const frontUploadResponse = await fetch('/api/upload-url', {
        method: 'POST',
      });
      const { uploadURL: frontUploadURL } = await frontUploadResponse.json();

      await fetch(frontUploadURL, {
        method: 'PUT',
        body: frontPhotoFile,
        headers: {
          'Content-Type': frontPhotoFile.type,
        },
      });

      let backPhotoUrl = null;
      
      // Upload back photo if present
      if (backPhotoFile) {
        const backUploadResponse = await fetch('/api/upload-url', {
          method: 'POST',
        });
        const { uploadURL: backUploadURL } = await backUploadResponse.json();

        await fetch(backUploadURL, {
          method: 'PUT',
          body: backPhotoFile,
          headers: {
            'Content-Type': backPhotoFile.type,
          },
        });
        
        backPhotoUrl = backUploadURL.split('?')[0];
      }

      // Call parent handler with both photo URLs and form data
      onSubmit(frontUploadURL.split('?')[0], backPhotoUrl, formData);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-add-coffee">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Front Photo */}
        <div>
          <Label className="mb-3 block">Front Photo *</Label>
          {!frontPhotoPreview ? (
            <div
              {...frontDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover-elevate ${
                frontDropzone.isDragActive ? 'border-primary bg-accent' : 'border-border'
              }`}
              data-testid="dropzone-front-photo"
            >
              <input {...frontDropzone.getInputProps()} accept="image/*" capture="environment" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">Front of bag</p>
                <p className="text-xs text-muted-foreground">
                  {frontDropzone.isDragActive ? 'Drop here' : 'Tap to capture'}
                </p>
              </div>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={frontPhotoPreview}
                  alt="Front of coffee bag"
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
                  Change
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Back Photo */}
        <div>
          <Label className="mb-3 block">Back Photo (Optional)</Label>
          {!backPhotoPreview ? (
            <div
              {...backDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover-elevate ${
                backDropzone.isDragActive ? 'border-primary bg-accent' : 'border-border'
              }`}
              data-testid="dropzone-back-photo"
            >
              <input {...backDropzone.getInputProps()} accept="image/*" capture="environment" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">Back of bag</p>
                <p className="text-xs text-muted-foreground">
                  {backDropzone.isDragActive ? 'Drop here' : 'Tap to capture'}
                </p>
              </div>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={backPhotoPreview}
                  alt="Back of coffee bag"
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
                  Change
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Scanning status */}
      {isScanning && (
        <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Scanning photos and extracting information...</span>
        </div>
      )}

      {/* Auto-fill badge */}
      {!isScanning && Object.keys(extractedData).length > 0 && (
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {Object.keys(extractedData).length} fields auto-filled
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={performOCR}
            disabled={isScanning || (!frontPhotoFile && !backPhotoFile)}
            data-testid="button-rescan"
          >
            <ScanText className="w-4 h-4 mr-2" />
            Rescan Text
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="roasterName">Roaster Name *</Label>
          <Input
            id="roasterName"
            required
            value={formData.roasterName}
            onChange={(e) => setFormData({ ...formData, roasterName: e.target.value })}
            data-testid="input-roaster-name"
          />
        </div>
        <div>
          <Label htmlFor="roasterWebsite">Roaster Website</Label>
          <Input
            id="roasterWebsite"
            value={formData.roasterWebsite}
            onChange={(e) => setFormData({ ...formData, roasterWebsite: e.target.value })}
            placeholder="https://example.com"
            data-testid="input-roaster-website"
          />
        </div>
        <div>
          <Label htmlFor="farm">Farm / Estate</Label>
          <Input
            id="farm"
            value={formData.farm}
            onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
            data-testid="input-farm"
          />
        </div>
        <div>
          <Label htmlFor="origin">Origin</Label>
          <Input
            id="origin"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            data-testid="input-origin"
          />
        </div>
        <div>
          <Label htmlFor="variety">Variety</Label>
          <Input
            id="variety"
            value={formData.variety}
            onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
            data-testid="input-variety"
          />
        </div>
        <div>
          <Label htmlFor="processMethod">Process Method</Label>
          <Input
            id="processMethod"
            value={formData.processMethod}
            onChange={(e) => setFormData({ ...formData, processMethod: e.target.value })}
            data-testid="input-process"
          />
        </div>
        <div>
          <Label htmlFor="roastDate">Roast Date</Label>
          <Input
            id="roastDate"
            type="date"
            value={formData.roastDate}
            onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
            data-testid="input-roast-date"
          />
        </div>
        <div>
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="e.g., 250g, 12oz"
            data-testid="input-weight"
          />
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="e.g., $15.99"
            data-testid="input-price"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="flavorNotes">Flavor Notes</Label>
        <Input
          id="flavorNotes"
          value={formData.flavorNotes}
          onChange={(e) => setFormData({ ...formData, flavorNotes: e.target.value })}
          placeholder="e.g., Chocolate, Citrus, Caramel"
          data-testid="input-flavor-notes"
        />
        <p className="text-xs text-muted-foreground mt-1">Separate multiple flavors with commas</p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={!frontPhotoFile || !formData.roasterName} className="flex-1" data-testid="button-save-entry">
          Save Entry
        </Button>
      </div>
    </form>
  );
}
