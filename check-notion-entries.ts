import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = "a12cbbbc-b1a4-421d-83f0-2fac3436c39d";
const dataSourceId = "760ac643-0839-4f77-92e1-3da11d258d4a";

async function checkEntries() {
  try {
    console.log("🔍 Querying data source for entries...\n");
    
    const response: any = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    });
    
    console.log(`✅ Found ${response.results.length} entries\n`);
    
    if (response.results.length > 0) {
      console.log("📋 First entry:");
      console.log(JSON.stringify(response.results[0], null, 2));
    }
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:", JSON.stringify(error, null, 2));
  }
}

checkEntries();
