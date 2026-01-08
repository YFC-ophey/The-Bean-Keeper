import { extractCoffeeInfoWithAI } from './server/groq.ts';

const testOcr = `HAPPY GOAT COFFEE CO.
happygoat.ca

ETHIOPIA YIRGACHEFFE
Natural Process

Tasting Notes: Blueberry, Strawberry, Dark Chocolate
`;

console.log('Testing Happy Goat Coffee with .ca domain...\n');
console.log('OCR Text:');
console.log(testOcr);

const result = await extractCoffeeInfoWithAI(testOcr);
console.log('\nExtracted with location inference:');
console.log(JSON.stringify(result, null, 2));

if (result.roasterLocation) {
  console.log('\n✅ Location successfully extracted/inferred:', result.roasterLocation);
} else {
  console.log('\n❌ Location not extracted');
}
