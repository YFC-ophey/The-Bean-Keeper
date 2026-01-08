import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = "a12cbbbcb1a4421d83f02fac3436c39d";

async function checkDatabase() {
  try {
    console.log("🔍 Retrieving database...\n");
    const database = await notion.databases.retrieve({ database_id: databaseId });
    
    console.log("✅ Database found!");
    console.log("\n📋 Full database object:");
    console.log(JSON.stringify(database, null, 2));
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\nCode:", error.code);
  }
}

checkDatabase();
