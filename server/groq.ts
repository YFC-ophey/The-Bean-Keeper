import Groq from "groq-sdk";

// Initialize Groq client with API key from environment
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export interface ExtractedCoffeeInfo {
  roasterName?: string;
  roasterLocation?: string;
  roasterAddress?: string;
  roasterWebsite?: string;
  farm?: string;
  origin?: string;
  variety?: string;
  processMethod?: string;
  roastLevel?: string;
  roastDate?: string;
  flavorNotes?: string[];
}

/**
 * Uses Groq's Llama 3.1 8B model to intelligently extract structured coffee information from raw OCR text
 * This is much more accurate than regex patterns for parsing coffee bag labels
 * Groq provides ultra-fast inference using their LPU architecture
 */
export async function extractCoffeeInfoWithAI(ocrText: string): Promise<ExtractedCoffeeInfo> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Fast model with JSON mode support
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting structured coffee information from text found on coffee bag labels. Extract all available information and return it as JSON. Be precise and only extract information that is clearly present in the text.`
        },
        {
          role: "user",
          content: `Extract coffee information from this text found on a coffee bag:

${ocrText}

Return a JSON object with these fields (use null for missing fields):
- roasterName: The coffee roaster/brand name
- roasterWebsite: Website URL if mentioned (prioritize this - look for URLs, domain names, or web addresses)
- roasterLocation: City and country/state of the roaster. Look for location information in multiple ways:
  1. Explicit location text (e.g., "Seattle, WA", "Ottawa, Canada", "Melbourne, Australia")
  2. If you find a website domain, infer the country from the top-level domain:
     - .ca = Canada (e.g., "Ottawa, Canada" or "Canada")
     - .uk or .co.uk = United Kingdom
     - .au = Australia
     - .nz = New Zealand
     - .de = Germany
     - .fr = France
     - .it = Italy
     - .es = Spain
  3. Look for city names, state/province abbreviations, or country names anywhere on the bag
  Return in format "City, Country" or "City, State" or just "Country" if city is unknown
- roasterAddress: Full street address if available
- farm: Farm or estate name (clean text only, no OCR artifacts)
- origin: Country or region where coffee was grown (clean text only, no special characters). For blends from multiple countries, use comma-separated format like "Brazil, Rwanda"
- variety: Coffee variety/varietal (e.g., "Bourbon", "Typica", "Gesha") - clean text only
- processMethod: Processing method (e.g., "Washed", "Natural", "Honey") - clean text only
- roastLevel: Roast level (one of: "Light", "Medium", "Dark") - look for indicators like "light roast", "medium roast", "dark roast", color descriptions, or roast degree mentions. If unclear, leave null.
- roastDate: Roast date if mentioned - look for dates near words like "ROAST", "ROASTED", "ROAST DATE", or standalone dates. Return in clean format like "MM/DD/YYYY" or "Month DD, YYYY"
- flavorNotes: Array of flavor descriptors (e.g., ["chocolate", "citrus", "caramel"])

Important: Return only clean text without OCR artifacts like special characters, pipe symbols, or gibberish. For dates, look carefully for any date format including MM/DD/YYYY, DD/MM/YYYY, or written formats like "January 15, 2025".`
        }
      ],
      response_format: { type: "json_object" }, // Enforce JSON response
      max_tokens: 1000, // Note: Groq uses max_tokens instead of max_completion_tokens
      temperature: 0, // Deterministic output for consistent extraction
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return {};
    }

    const parsed = JSON.parse(content);

    // Clean up the extracted data
    const result: ExtractedCoffeeInfo = {};

    if (parsed.roasterName && typeof parsed.roasterName === 'string') {
      result.roasterName = parsed.roasterName.trim();
    }
    if (parsed.roasterLocation && typeof parsed.roasterLocation === 'string') {
      result.roasterLocation = parsed.roasterLocation.trim();
    }
    if (parsed.roasterAddress && typeof parsed.roasterAddress === 'string') {
      result.roasterAddress = parsed.roasterAddress.trim();
    }
    if (parsed.roasterWebsite && typeof parsed.roasterWebsite === 'string') {
      result.roasterWebsite = parsed.roasterWebsite.trim();
    }
    if (parsed.farm && typeof parsed.farm === 'string') {
      result.farm = parsed.farm.trim();
    }
    if (parsed.origin && typeof parsed.origin === 'string') {
      // Normalize spacing around commas for multi-country origins
      result.origin = parsed.origin
        .split(',')
        .map(o => o.trim())
        .filter(o => o.length > 0)
        .join(', ');
    }
    if (parsed.variety && typeof parsed.variety === 'string') {
      result.variety = parsed.variety.trim();
    }
    if (parsed.processMethod && typeof parsed.processMethod === 'string') {
      result.processMethod = parsed.processMethod.trim();
    }
    if (parsed.roastLevel && typeof parsed.roastLevel === 'string') {
      result.roastLevel = parsed.roastLevel.trim();
    }
    if (parsed.roastDate && typeof parsed.roastDate === 'string') {
      result.roastDate = parsed.roastDate.trim();
    }
    if (Array.isArray(parsed.flavorNotes)) {
      result.flavorNotes = parsed.flavorNotes
        .filter((note: any) => typeof note === 'string')
        .map((note: string) => note.trim())
        .filter((note: string) => note.length > 0);
    }

    return result;
  } catch (error) {
    console.error('Error extracting coffee info with Groq AI:', error);
    return {};
  }
}
