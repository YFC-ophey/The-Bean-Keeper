import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
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
  roastDate?: string;
  flavorNotes?: string[];
}

/**
 * Uses GPT-5 to intelligently extract structured coffee information from raw OCR text
 * This is much more accurate than regex patterns for parsing coffee bag labels
 */
export async function extractCoffeeInfoWithAI(ocrText: string): Promise<ExtractedCoffeeInfo> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
- roasterLocation: City, state, or country of the roaster (only if clearly stated)
- roasterAddress: Full address if available
- farm: Farm or estate name (clean text only, no OCR artifacts)
- origin: Country or region where coffee was grown (clean text only, no special characters)
- variety: Coffee variety/varietal (e.g., "Bourbon", "Typica", "Gesha") - clean text only
- processMethod: Processing method (e.g., "Washed", "Natural", "Honey") - clean text only
- roastDate: Roast date if mentioned - look for dates near words like "ROAST", "ROASTED", "ROAST DATE", or standalone dates. Return in clean format like "MM/DD/YYYY" or "Month DD, YYYY"
- flavorNotes: Array of flavor descriptors (e.g., ["chocolate", "citrus", "caramel"])

Important: Return only clean text without OCR artifacts like special characters, pipe symbols, or gibberish. For dates, look carefully for any date format including MM/DD/YYYY, DD/MM/YYYY, or written formats like "January 15, 2025".`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
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
      result.origin = parsed.origin.trim();
    }
    if (parsed.variety && typeof parsed.variety === 'string') {
      result.variety = parsed.variety.trim();
    }
    if (parsed.processMethod && typeof parsed.processMethod === 'string') {
      result.processMethod = parsed.processMethod.trim();
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
    console.error('Error extracting coffee info with AI:', error);
    return {};
  }
}
