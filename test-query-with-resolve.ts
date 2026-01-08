import { queryNotionCoffeeDatabase } from "./server/notion";
import dotenv from "dotenv";

dotenv.config();

const databaseId = "a12cbbbc-b1a4-421d-83f0-2fac3436c39d";

async function test() {
  console.log("🧪 Testing queryNotionCoffeeDatabase with auto-resolve...\n");
  
  try {
    const entries = await queryNotionCoffeeDatabase(databaseId);
    console.log(`✅ Found ${entries.length} entries\n`);
    
    if (entries.length > 0) {
      console.log("📋 First entry:");
      console.log(JSON.stringify(entries[0], null, 2));
    }
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\nStack:", error.stack);
  }
}

test();
