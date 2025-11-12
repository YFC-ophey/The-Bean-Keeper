import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle2 } from "lucide-react";
import Tesseract from "tesseract.js";

interface ExtractedData {
  roasterName?: string;
  origin?: string;
  variety?: string;
  processMethod?: string;
  roastDate?: string;
  flavorNotes?: string;
  farm?: string;
  roasterLocation?: string;
}

interface AddCoffeeFormProps {
  onSubmit: (photoUrl: string, data: {
    roasterName: string;
    roasterLocation?: string;
    farm?: string;
    origin?: string;
    variety?: string;
    processMethod?: string;
    roastDate?: string;
    flavorNotes?: string;
  }) => void;
  onCancel: () => void;
}

export default function AddCoffeeForm({ onSubmit, onCancel }: AddCoffeeFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [formData, setFormData] = useState({
    roasterName: "",
    roasterLocation: "",
    farm: "",
    origin: "",
    variety: "",
    processMethod: "",
    roastDate: "",
    flavorNotes: "",
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreview(preview);
      await performOCR(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.heif'] },
    multiple: false,
  });

  const performOCR = async (file: File) => {
    setIsScanning(true);
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => console.log(m),
      });

      const text = result.data.text;
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
      // Exclude descriptor words that aren't part of the roaster name
      const excludeWords = /^(roasted|locally|sourced|fresh|organic|single|origin|direct|trade|imported|premium|specialty|craft|artisan|small|batch|hand|selected|estate|grown|fair|sustainable|this|a|an|the)\s+/i;
      
      const roasterPatterns = [
        // Pattern for "Name Coffee Roasters" or "Name Roasters" (must start line or be capitalized)
        /^([A-Z][A-Za-z\s&'-]{2,50}(?:Coffee|Roasters?))/im,
        /\n([A-Z][A-Za-z\s&'-]{2,50}(?:Coffee|Roasters?))/i,
      ];
      
      for (const pattern of roasterPatterns) {
        const matches = text.matchAll(new RegExp(pattern.source, 'gim'));
        for (const match of matches) {
          let name = match[1].trim().replace(/\s+/g, ' ');
          
          // Skip if it starts with descriptor words
          if (excludeWords.test(name)) {
            continue;
          }
          
          // Skip if it contains label field markers
          if (/(farm|origin|variety|process|flavou?rs?|roast(?:ed)?\s*(?:date|on)?)\s*:/i.test(name)) {
            continue;
          }
          
          // Skip if surrounded by lowercase text (likely part of a sentence)
          const fullMatch = match[0];
          const beforeMatch = text.substring(Math.max(0, match.index! - 20), match.index!);
          if (/[a-z]\s*$/.test(beforeMatch)) {
            // Has lowercase letter right before - likely part of sentence
            continue;
          }
          
          // Prefer names with multiple capital words (proper nouns)
          const capitalWords = name.match(/[A-Z][a-z]+/g);
          if (capitalWords && capitalWords.length >= 2 && name.length > 5 && name.length < 60) {
            extracted.roasterName = name;
            break;
          }
        }
        if (extracted.roasterName) break;
      }

      // If no roaster found with patterns, look in first 10 lines for prominent brand name
      if (!extracted.roasterName) {
        const earlyLines = lines.slice(0, 10);
        const potentialRoaster = earlyLines.find(line => {
          const trimmed = line.trim();
          
          // Must have reasonable length
          if (trimmed.length < 5 || trimmed.length > 50) return false;
          
          // Must start with capital letter
          if (!/^[A-Z]/.test(trimmed)) return false;
          
          // Skip descriptor words
          if (excludeWords.test(trimmed)) return false;
          
          // Skip field labels and common coffee terms
          if (/(washed|natural|honey|farm|origin|variety|process|roasted|flavou?rs?|direct|trade|sourced|wpg|300g|gram)/i.test(trimmed)) return false;
          
          // Prefer lines with multiple capital words (brand names)
          const capitalWords = trimmed.match(/[A-Z][a-z]+/g);
          return capitalWords && capitalWords.length >= 2;
        });
        
        if (potentialRoaster) {
          extracted.roasterName = potentialRoaster.trim();
        }
      }

      // Extract location (city, state)
      const locationMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})/);
      if (locationMatch) {
        extracted.roasterLocation = `${locationMatch[1]}, ${locationMatch[2]}`;
      }

      console.log('Full OCR text:', text);
      console.log('Extracted data:', extracted);
      setExtractedData(extracted);
      setFormData((prev) => ({
        ...prev,
        ...extracted,
      }));
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photoFile) return;

    setIsScanning(true);
    try {
      // Get upload URL from backend
      const uploadResponse = await fetch('/api/upload-url', {
        method: 'POST',
      });
      const { uploadURL } = await uploadResponse.json();

      // Upload photo to object storage
      await fetch(uploadURL, {
        method: 'PUT',
        body: photoFile,
        headers: {
          'Content-Type': photoFile.type,
        },
      });

      // Call parent handler with photo URL and form data
      onSubmit(uploadURL.split('?')[0], formData);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-add-coffee">
      <div>
        <Label className="mb-3 block">Coffee Bag Photo</Label>
        {!photoPreview ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors hover-elevate ${
              isDragActive ? 'border-primary bg-accent' : 'border-border'
            }`}
            data-testid="dropzone-photo"
          >
            <input {...getInputProps()} accept="image/*" capture="environment" />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Camera className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium mb-1">
                  {isDragActive ? 'Drop photo here' : 'Take or upload photo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tap to use camera or select from library
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="relative aspect-square">
              <img
                src={photoPreview}
                alt="Coffee bag preview"
                className="w-full h-full object-cover"
                data-testid="img-preview"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Scanning label...</p>
                  </div>
                </div>
              )}
              {!isScanning && Object.keys(extractedData).length > 0 && (
                <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {Object.keys(extractedData).length} fields auto-filled
                </Badge>
              )}
            </div>
            <div className="p-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPhotoPreview("");
                  setPhotoFile(null);
                  setExtractedData({});
                }}
                data-testid="button-change-photo"
              >
                <Upload className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            </div>
          </Card>
        )}
      </div>

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
          <Label htmlFor="roasterLocation">Roaster Location</Label>
          <Input
            id="roasterLocation"
            value={formData.roasterLocation}
            onChange={(e) => setFormData({ ...formData, roasterLocation: e.target.value })}
            placeholder="City, State"
            data-testid="input-roaster-location"
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
        <Button type="submit" disabled={!photoFile || !formData.roasterName} className="flex-1" data-testid="button-save-entry">
          Save Entry
        </Button>
      </div>
    </form>
  );
}
