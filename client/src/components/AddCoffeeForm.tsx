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
  onSubmit: (data: FormData) => void;
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

      // Extract roaster name (usually first or prominent line)
      const potentialRoaster = lines.find(line => 
        line.length > 3 && line.length < 50 && 
        /[A-Z]/.test(line) && 
        !/(washed|natural|honey|ethiopia|colombia|kenya|brazil)/i.test(line)
      );
      if (potentialRoaster) {
        extracted.roasterName = potentialRoaster.trim();
      }

      // Extract origin countries
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

      // Extract process method
      if (lowerText.includes('washed') || lowerText.includes('wet process')) {
        extracted.processMethod = 'Washed';
      } else if (lowerText.includes('natural') || lowerText.includes('dry process')) {
        extracted.processMethod = 'Natural';
      } else if (lowerText.includes('honey') || lowerText.includes('pulped natural')) {
        extracted.processMethod = 'Honey';
      } else if (lowerText.includes('anaerobic')) {
        extracted.processMethod = 'Anaerobic';
      }

      // Extract variety
      const varieties = [
        'Heirloom', 'Bourbon', 'Typica', 'Caturra', 'Catuai', 'Gesha', 'Geisha',
        'SL28', 'SL34', 'Pacamara', 'Villa Sarchi', 'Red Bourbon', 'Yellow Bourbon',
        'Pink Bourbon', 'Mundo Novo', 'Maragogype'
      ];
      for (const variety of varieties) {
        if (lowerText.includes(variety.toLowerCase())) {
          extracted.variety = variety;
          break;
        }
      }

      // Extract farm name
      const farmMatch = text.match(/(?:farm|finca|estate|plantation)[\s:]+([A-Za-z\s]+)/i);
      if (farmMatch) {
        extracted.farm = farmMatch[1].trim();
      }

      // Extract roast date (various formats)
      const datePatterns = [
        /roast(?:ed)?[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
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

      // Extract flavor notes
      const flavorKeywords = [
        'chocolate', 'caramel', 'citrus', 'berry', 'fruity', 'floral', 'nutty',
        'sweet', 'honey', 'vanilla', 'blueberry', 'strawberry', 'cherry',
        'orange', 'lemon', 'apple', 'peach', 'jasmine', 'rose', 'lavender',
        'almond', 'hazelnut', 'walnut', 'brown sugar', 'maple', 'toffee',
        'wine', 'grape', 'tropical', 'mango', 'pineapple', 'coconut',
        'stone fruit', 'red fruit', 'black tea', 'earl grey', 'spice', 'cinnamon'
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

      // Extract location (city, state)
      const locationMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})/);
      if (locationMatch) {
        extracted.roasterLocation = `${locationMatch[1]}, ${locationMatch[2]}`;
      }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    if (photoFile) data.append('photo', photoFile);
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    onSubmit(data);
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
