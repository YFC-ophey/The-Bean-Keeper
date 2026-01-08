import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";
const DATABASE_ID = "a12cbbbc-b1a4-421d-83f0-2fac3436c39d";

async function testCreateEntry() {
  console.log("🧪 Testing coffee entry creation...\n");
  
  try {
    // Create a test coffee entry
    const testEntry = {
      roasterName: "Test Roaster",
      frontPhotoUrl: "/api/local-files/test-front.jpg",
      backPhotoUrl: "/api/local-files/test-back.jpg",
      origin: "Ethiopia",
      variety: "Gesha",
      processMethod: "Washed",
      flavorNotes: ["Chocolate", "Citrus"],
      rating: 5,
      weight: "250g",
      price: "$18.99",
      purchaseAgain: true,
      roasterWebsite: "https://example.com",
      farm: "Test Farm",
      roastDate: "2024-12-10",
      tastingNotes: "Amazing coffee!",
    };
    
    console.log("📝 Creating entry:", testEntry.roasterName);
    
    const response = await fetch(`${BASE_URL}/api/coffee-entries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Notion-Database-Id": DATABASE_ID,
      },
      body: JSON.stringify(testEntry),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const createdEntry = await response.json();
    console.log("✅ Entry created successfully!");
    console.log("\n📋 Created entry:");
    console.log(JSON.stringify(createdEntry, null, 2));
    
    // Verify it appears in the list
    console.log("\n🔍 Verifying entry appears in list...");
    const listResponse = await fetch(`${BASE_URL}/api/coffee-entries`, {
      headers: {
        "X-Notion-Database-Id": DATABASE_ID,
      },
    });
    
    const entries = await listResponse.json();
    console.log(`\n✅ Found ${entries.length} entries in database`);
    
    if (entries.length > 0) {
      console.log("\n📋 First entry:");
      console.log(JSON.stringify(entries[0], null, 2));
    }
    
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testCreateEntry();
