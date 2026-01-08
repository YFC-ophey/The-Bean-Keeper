import dotenv from "dotenv";
import { Client } from "@notionhq/client";

// Load environment variables
dotenv.config();

async function testNotionSetup() {
  console.log("🧪 Testing Notion Integration Setup...\n");

  // Check if API key is set
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey || apiKey === "secret_your_integration_token_here") {
    console.error("❌ Error: NOTION_API_KEY not set in .env file");
    console.log("\n📝 Please follow these steps:");
    console.log("1. Go to https://www.notion.so/my-integrations");
    console.log("2. Click '+ New integration'");
    console.log("3. Name it 'The Bean Keeper'");
    console.log("4. Copy the Internal Integration Token");
    console.log("5. Update .env file: NOTION_API_KEY=secret_xxxxx");
    process.exit(1);
  }

  console.log("✅ NOTION_API_KEY is set\n");

  // Initialize Notion client
  const notion = new Client({ auth: apiKey });

  // Test connection by searching for pages
  try {
    console.log("🔗 Testing Notion API connection...");
    const response = await notion.search({
      filter: {
        property: "object",
        value: "page",
      },
      page_size: 1,
    });

    console.log("✅ Successfully connected to Notion API");
    console.log(`📄 Found ${response.results.length > 0 ? 'pages' : 'no pages'} in your workspace\n`);

    if (response.results.length === 0) {
      console.log("⚠️  No pages found. This might mean:");
      console.log("   - Your Notion workspace is empty");
      console.log("   - The integration needs to be shared with pages");
      console.log("\n📝 Next steps:");
      console.log("1. Create a page in Notion for your database");
      console.log("2. Click '...' menu → 'Add connections' → Select 'The Bean Keeper'");
      console.log("3. Copy the page URL");
      console.log("4. Extract the page ID from the URL (32 character string)");
      console.log("5. Use POST /api/notion/create-database with parentPageId\n");
    } else {
      console.log("🎉 Setup complete! Next steps:");
      console.log("1. Create a parent page in Notion");
      console.log("2. Share it with 'The Bean Keeper' integration");
      console.log("3. Use the create-database endpoint to create the coffee database");
      console.log("\nExample:");
      console.log("POST /api/notion/create-database");
      console.log('{ "parentPageId": "your-page-id-here" }\n');
    }
  } catch (error: any) {
    console.error("❌ Failed to connect to Notion API");
    console.error("Error:", error.message);

    if (error.code === "unauthorized") {
      console.log("\n📝 Your API key might be invalid. Please:");
      console.log("1. Check the key in .env matches your integration");
      console.log("2. Make sure you copied the entire token (starts with 'secret_')");
    }
    process.exit(1);
  }
}

testNotionSetup().catch(console.error);
