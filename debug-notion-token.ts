import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🔍 Debug Notion Token\n");

const apiKey = process.env.NOTION_API_KEY;

if (!apiKey) {
  console.log("❌ NOTION_API_KEY is not set");
} else {
  console.log("✅ NOTION_API_KEY is set");
  console.log(`Length: ${apiKey.length} characters`);
  console.log(`Starts with: ${apiKey.substring(0, 10)}...`);
  console.log(`Ends with: ...${apiKey.substring(apiKey.length - 10)}`);

  // Check for common issues
  if (apiKey.includes(' ')) {
    console.log("⚠️  WARNING: Token contains spaces!");
  }
  if (apiKey.includes('\n')) {
    console.log("⚠️  WARNING: Token contains newlines!");
  }
  if (apiKey !== apiKey.trim()) {
    console.log("⚠️  WARNING: Token has leading/trailing whitespace!");
  }

  console.log("\n📋 Full token (for verification):");
  console.log(apiKey);
}
