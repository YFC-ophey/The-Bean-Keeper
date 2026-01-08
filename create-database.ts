import dotenv from "dotenv";
import { createCoffeeDatabase } from "./server/notion";

// Load environment variables
dotenv.config();

async function createDatabase() {
  const parentPageId = process.argv[2];

  if (!parentPageId) {
    console.error("❌ Error: Parent page ID is required\n");
    console.log("Usage: npx tsx create-database.ts <parent-page-id>\n");
    console.log("Example: npx tsx create-database.ts 1234567890abcdef1234567890abcdef\n");
    console.log("📝 How to get your parent page ID:");
    console.log("1. Create a page in Notion");
    console.log("2. Share it with 'The Bean Keeper' integration");
    console.log("3. Copy the page URL");
    console.log("4. Extract the 32-character ID from the URL\n");
    console.log("Example URL:");
    console.log("https://notion.so/My-Coffee-Collection-1234567890abcdef1234567890abcdef");
    console.log("                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    console.log("                                     This is your page ID");
    process.exit(1);
  }

  // Clean up the page ID (remove dashes if present)
  const cleanPageId = parentPageId.replace(/-/g, '');

  if (cleanPageId.length !== 32) {
    console.error(`❌ Error: Invalid page ID length (${cleanPageId.length} characters)`);
    console.log("Page ID should be exactly 32 characters (without dashes)\n");
    process.exit(1);
  }

  console.log("🚀 Creating Coffee Database in Notion...\n");
  console.log(`Parent Page ID: ${cleanPageId}\n`);

  try {
    const databaseId = await createCoffeeDatabase(cleanPageId);

    console.log("✅ Database created successfully!\n");
    console.log("📋 Database ID:", databaseId);
    console.log("\n💾 Save this database ID - you'll need it for the frontend!\n");
    console.log("🔧 Add it to your .env file:");
    console.log(`NOTION_DATABASE_ID=${databaseId}\n`);
    console.log("📱 Or send it in the header from your frontend:");
    console.log(`X-Notion-Database-Id: ${databaseId}\n`);
    console.log("🎉 You're all set! Start the dev server:");
    console.log("npm run dev\n");

  } catch (error: any) {
    console.error("❌ Failed to create database\n");
    console.error("Error:", error.message);

    if (error.code === "object_not_found") {
      console.log("\n📝 The page was not found. Make sure:");
      console.log("1. The page exists in your Notion workspace");
      console.log("2. You've shared it with 'The Bean Keeper' integration");
      console.log("3. The page ID is correct (32 characters)");
    } else if (error.code === "unauthorized") {
      console.log("\n📝 Authorization failed. Check that:");
      console.log("1. Your NOTION_API_KEY in .env is correct");
      console.log("2. The integration has access to the page");
    }

    process.exit(1);
  }
}

createDatabase().catch(console.error);
