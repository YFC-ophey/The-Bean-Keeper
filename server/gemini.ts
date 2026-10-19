import type { ExtractedCoffeeInfo } from "./groq";

export const GEMINI_SCAN_MODEL = "gemini-3.5-flash-lite";
export const MAX_GEMINI_IMAGE_BYTES = 12 * 1024 * 1024;

export interface ScanImage {
  buffer: Buffer;
  mimetype: string;
}

const fields = [
  "roasterName", "roasterWebsite", "farm", "origin", "variety",
  "processMethod", "roastLevel", "roastDate", "flavorNotes",
] as const;

const responseSchema = {
  type: "object",
  properties: Object.fromEntries(fields.map((field) => [field,
    field === "flavorNotes"
      ? { type: "array", items: { type: "string" } }
      : { type: "string" },
  ])),
};

export class GeminiScanError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

/** Extract only label-visible facts from up to two coffee bag photos. */
export async function extractCoffeeInfoFromPhotos(
  front: ScanImage,
  back: ScanImage | undefined,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<ExtractedCoffeeInfo> {
  const images = [front, back].filter((image): image is ScanImage => Boolean(image));
  if (images.reduce((total, image) => total + image.buffer.length, 0) > MAX_GEMINI_IMAGE_BYTES) {
    throw new GeminiScanError("Photos are too large for the Gemini trial (12 MB combined).", 413);
  }

  const parts = [
    { text: `Read these front and back photos of one coffee bag and extract coffee details as JSON.
Only include facts legible on the bag. Do not invent a roaster, origin, date, website, or roast level.
Use an empty string or empty array for a field you cannot read. The origin is where the coffee was grown, not the roaster location.
roastLevel must be Light, Medium, Dark, or empty. roastDate must be YYYY-MM-DD when the date is unambiguous, otherwise empty.
flavorNotes must be an array of individual tasting notes.
Return roasterName, roasterWebsite, farm, origin, variety, processMethod, roastLevel, roastDate, and flavorNotes.` },
    ...images.map((image) => ({ inlineData: {
      mimeType: image.mimetype === "image/jpg" ? "image/jpeg" : image.mimetype,
      data: image.buffer.toString("base64"),
    } })),
  ];

  let response: Response;
  try {
    response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_SCAN_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0,
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );
  } catch {
    throw new GeminiScanError("Gemini is unavailable. Please try again later.", 502);
  }

  if (!response.ok) {
    throw new GeminiScanError(
      response.status === 429 ? "Gemini's free quota is busy. Please try again later." : "Gemini could not scan these photos.",
      response.status === 429 ? 429 : 502,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
    if (!content) throw new Error("Empty response");
    parsed = JSON.parse(content) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid response");
  } catch {
    throw new GeminiScanError("Gemini returned an unreadable result. Please try again.", 502);
  }

  const result: ExtractedCoffeeInfo = {};
  for (const field of fields) {
    const value = parsed[field];
    if (field === "flavorNotes") {
      if (Array.isArray(value)) {
        result.flavorNotes = value.filter((note): note is string => typeof note === "string")
          .map((note) => note.trim()).filter(Boolean).slice(0, 12);
      }
    } else if (typeof value === "string" && value.trim()) {
      result[field] = value.trim().slice(0, 300);
    }
  }
  if (result.roastLevel && !["Light", "Medium", "Dark"].includes(result.roastLevel)) {
    delete result.roastLevel;
  }
  return result;
}
