import { config } from "dotenv";
import { extractCoffeeInfoWithAI } from "./server/groq";

// Load environment variables
config();

// Sample OCR text from a coffee bag
const sampleOCRText = `
BLUE BOTTLE COFFEE
bluebottlecoffee.com
Oakland, California

ETHIOPIA YIRGACHEFFE
Single Origin

Farm: Koke Washing Station
Region: Gedeb, Yirgacheffe
Variety: Heirloom Ethiopian Varieties
Process: Washed
Altitude: 1900-2000 MASL

ROAST DATE: 12/01/2025

TASTING NOTES:
Blueberry, Jasmine, Black Tea

Net Weight: 12 oz (340g)
`;

async function testGroqExtraction() {
  console.log("Testing Groq AI coffee data extraction...\n");
  console.log("Sample OCR Text:");
  console.log("=".repeat(50));
  console.log(sampleOCRText);
  console.log("=".repeat(50));
  console.log("\nExtracting coffee information...\n");

  try {
    const result = await extractCoffeeInfoWithAI(sampleOCRText);

    console.log("Extracted Information:");
    console.log("=".repeat(50));
    console.log(JSON.stringify(result, null, 2));
    console.log("=".repeat(50));

    // Verify expected fields
    console.log("\nVerification:");
    console.log(`✓ Roaster Name: ${result.roasterName || 'NOT FOUND'}`);
    console.log(`✓ Website: ${result.roasterWebsite || 'NOT FOUND'}`);
    console.log(`✓ Origin: ${result.origin || 'NOT FOUND'}`);
    console.log(`✓ Farm: ${result.farm || 'NOT FOUND'}`);
    console.log(`✓ Variety: ${result.variety || 'NOT FOUND'}`);
    console.log(`✓ Process: ${result.processMethod || 'NOT FOUND'}`);
    console.log(`✓ Roast Date: ${result.roastDate || 'NOT FOUND'}`);
    console.log(`✓ Flavor Notes: ${result.flavorNotes?.join(', ') || 'NOT FOUND'}`);

    console.log("\n✅ Groq AI extraction test completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during extraction:", error);
    process.exit(1);
  }
}

testGroqExtraction();
