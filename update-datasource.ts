import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const dataSourceId = "760ac643-0839-4f77-92e1-3da11d258d4a";

async function updateDataSource() {
  try {
    console.log("🔧 Updating data source with all properties...\n");
    
    const response = await notion.dataSources.update({
      data_source_id: dataSourceId,
      properties: {
        "Name": {
          title: {},
        },
        "Roaster": {
          rich_text: {},
        },
        "Website": {
          url: {},
        },
        "Address": {
          rich_text: {},
        },
        "Farm": {
          rich_text: {},
        },
        "Origin": {
          select: {
            options: [
              { name: "Ethiopia", color: "green" },
              { name: "Colombia", color: "yellow" },
              { name: "Kenya", color: "orange" },
              { name: "Brazil", color: "brown" },
              { name: "Indonesia", color: "red" },
              { name: "Guatemala", color: "blue" },
              { name: "Costa Rica", color: "purple" },
              { name: "Peru", color: "pink" },
              { name: "Honduras", color: "gray" },
            ],
          },
        },
        "Variety": {
          multi_select: {
            options: [
              { name: "Bourbon", color: "brown" },
              { name: "Typica", color: "yellow" },
              { name: "Gesha", color: "green" },
              { name: "Caturra", color: "orange" },
              { name: "SL28", color: "red" },
              { name: "SL34", color: "pink" },
              { name: "Heirloom", color: "purple" },
            ],
          },
        },
        "Process": {
          select: {
            options: [
              { name: "Washed", color: "blue" },
              { name: "Natural", color: "green" },
              { name: "Honey", color: "yellow" },
              { name: "Anaerobic", color: "red" },
              { name: "Carbonic Maceration", color: "purple" },
            ],
          },
        },
        "Roast Date": {
          date: {},
        },
        "Flavor Notes": {
          multi_select: {
            options: [
              { name: "Chocolate", color: "brown" },
              { name: "Citrus", color: "orange" },
              { name: "Floral", color: "pink" },
              { name: "Berry", color: "purple" },
              { name: "Nutty", color: "brown" },
              { name: "Caramel", color: "yellow" },
              { name: "Fruity", color: "red" },
              { name: "Spicy", color: "orange" },
              { name: "Herbal", color: "green" },
              { name: "Tea-like", color: "green" },
            ],
          },
        },
        "Rating": {
          number: {
            format: "number",
          },
        },
        "Tasting Notes": {
          rich_text: {},
        },
        "Weight": {
          rich_text: {},
        },
        "Price": {
          rich_text: {},
        },
        "Purchase Again": {
          checkbox: {},
        },
        "Front Photo": {
          url: {},
        },
        "Back Photo": {
          url: {},
        },
        "App ID": {
          rich_text: {},
        },
        "Created": {
          created_time: {},
        },
      },
    });
    
    console.log("✅ Data source updated successfully!");
    console.log("\n📋 Updated properties:");
    console.log(JSON.stringify(response.properties, null, 2));
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:", JSON.stringify(error, null, 2));
  }
}

updateDataSource();
