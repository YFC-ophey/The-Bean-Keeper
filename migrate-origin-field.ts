import { notion } from "./server/notion";
import dotenv from "dotenv";

dotenv.config();

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!;

async function migrateOriginField() {
  console.log("🔄 Migrating Origin field from Select to Text...");
  console.log(`Database ID: ${NOTION_DATABASE_ID}`);

  try {
    // Update the database schema
    await notion.databases.update({
      database_id: NOTION_DATABASE_ID,
      properties: {
        "Origin": {
          rich_text: {}  // Change from select to rich_text
        }
      }
    });

    console.log("✅ Origin field migrated successfully!");
    console.log("You can now save entries with comma-separated origins like 'Brazil, Rwanda'");
    console.log("\nNext steps:");
    console.log("1. Try editing an existing coffee entry");
    console.log("2. Change Origin to something like 'Brazil, Rwanda'");
    console.log("3. Save - it should work without errors now!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("\nTroubleshooting:");
    console.error("1. Verify NOTION_DATABASE_ID in .env is correct");
    console.error("2. Ensure Notion integration has edit permissions");
    console.error("3. Check that the database is shared with your integration");
    throw error;
  }
}

migrateOriginField().catch(console.error);
