import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const dataSourceId = "760ac643-0839-4f77-92e1-3da11d258d4a";

async function checkDataSource() {
  try {
    console.log("🔍 Retrieving data source...\n");
    const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
    
    console.log("✅ Data source found!");
    console.log("\n📋 Full data source object:");
    console.log(JSON.stringify(dataSource, null, 2));
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\nCode:", error.code);
  }
}

checkDataSource();
