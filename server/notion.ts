import { Client } from "@notionhq/client";
import type { CoffeeEntry } from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Default Notion client (uses internal integration for owner's database)
const defaultNotionClient = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Export default client for backwards compatibility
export const notion = defaultNotionClient;

/**
 * Create a Notion client with a specific access token
 * Used for OAuth users who need to access their own databases
 */
export function createNotionClient(accessToken?: string): Client {
  if (accessToken) {
    return new Client({ auth: accessToken });
  }
  return defaultNotionClient;
}

// Type for Notion property values
type NotionPropertyValue = any;

/**
 * Creates a Notion database for coffee tracking with the appropriate schema
 * This should be called once during setup
 */
export async function createCoffeeDatabase(parentPageId: string): Promise<string> {
  try {
    const response = await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: parentPageId,
      },
      title: [
        {
          type: "text",
          text: {
            content: "The Bean Keeper - Coffee Collection",
          },
        },
      ],
      properties: {
        "Name": {
          title: {},
        },
        "Created": {
          created_time: {},
        },
        "Roaster": {
          rich_text: {},
        },
        "Website": {
          url: {},
        },
        "Place": {
          url: {},
        },
        "Origin": {
          rich_text: {},
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
        "Roast Level": {
          select: {
            options: [
              { name: "Light", color: "yellow" },
              { name: "Medium", color: "orange" },
              { name: "Dark", color: "brown" },
            ],
          },
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
        "Weight": {
          rich_text: {},
        },
        "Price": {
          rich_text: {},
        },
        "Purchase Again": {
          checkbox: {},
        },
        "Rating": {
          number: {
            format: "number",
          },
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
        "Address": {
          rich_text: {},
        },
        "Farm": {
          rich_text: {},
        },
        "Roast Date": {
          date: {},
        },
        "Tasting Notes": {
          rich_text: {},
        },
      },
    });

    return response.id;
  } catch (error) {
    console.error("Error creating Notion database:", error);
    throw error;
  }
}

/**
 * Converts a CoffeeEntry to Notion page properties
 */
function coffeeEntryToNotionProperties(entry: CoffeeEntry): Record<string, NotionPropertyValue> {
  const properties: Record<string, NotionPropertyValue> = {
    "Name": {
      title: [
        {
          text: {
            content: `${entry.roasterName}${entry.origin ? ` - ${entry.origin}` : ''}`,
          },
        },
      ],
    },
    "Roaster": {
      rich_text: [
        {
          text: {
            content: entry.roasterName || "",
          },
        },
      ],
    },
    "App ID": {
      rich_text: [
        {
          text: {
            content: entry.id,
          },
        },
      ],
    },
    "Purchase Again": {
      checkbox: entry.purchaseAgain,
    },
  };

  // Optional URL fields
  if (entry.roasterWebsite) {
    properties["Website"] = { url: entry.roasterWebsite };
  }
  if (entry.placeUrl) {
    properties["Place"] = { url: entry.placeUrl };
  }
  if (entry.frontPhotoUrl) {
    properties["Front Photo"] = { url: entry.frontPhotoUrl };
  }
  if (entry.backPhotoUrl) {
    properties["Back Photo"] = { url: entry.backPhotoUrl };
  }

  // Optional text fields
  if (entry.roasterAddress) {
    properties["Address"] = {
      rich_text: [{ text: { content: entry.roasterAddress } }],
    };
  }
  if (entry.farm) {
    properties["Farm"] = {
      rich_text: [{ text: { content: entry.farm } }],
    };
  }
  if (entry.tastingNotes) {
    properties["Tasting Notes"] = {
      rich_text: [{ text: { content: entry.tastingNotes } }],
    };
  }
  if (entry.weight) {
    properties["Weight"] = {
      rich_text: [{ text: { content: entry.weight } }],
    };
  }
  if (entry.price) {
    properties["Price"] = {
      rich_text: [{ text: { content: entry.price } }],
    };
  }

  // Origin field - changed to rich_text to support multiple countries (e.g. "Rwanda, Ethiopia")
  if (entry.origin) {
    properties["Origin"] = {
      rich_text: [{ text: { content: entry.origin } }],
    };
  }

  // Select fields
  if (entry.processMethod) {
    properties["Process"] = {
      select: { name: entry.processMethod },
    };
  }
  if (entry.roastLevel) {
    properties["Roast Level"] = {
      select: { name: entry.roastLevel },
    };
  }

  // Multi-select fields
  if (entry.variety) {
    properties["Variety"] = {
      multi_select: [{ name: entry.variety }],
    };
  }
  if (entry.flavorNotes && entry.flavorNotes.length > 0) {
    properties["Flavor Notes"] = {
      multi_select: entry.flavorNotes.map((note) => ({ name: note })),
    };
  }

  // Number field
  if (entry.rating) {
    properties["Rating"] = {
      number: entry.rating,
    };
  }

  // Date field
  if (entry.roastDate) {
    // Try to parse the roast date
    try {
      const date = new Date(entry.roastDate);
      if (!isNaN(date.getTime())) {
        properties["Roast Date"] = {
          date: { start: date.toISOString().split('T')[0] },
        };
      }
    } catch (e) {
      // If parsing fails, skip the date field
      console.warn("Could not parse roast date:", entry.roastDate);
    }
  }

  return properties;
}

/**
 * Converts Notion page properties to a partial CoffeeEntry
 */
function notionPropertiesToCoffeeEntry(properties: any): Partial<CoffeeEntry> {
  const entry: Partial<CoffeeEntry> = {};

  // Extract roaster name from rich text
  if (properties["Roaster"]?.rich_text?.[0]?.plain_text) {
    entry.roasterName = properties["Roaster"].rich_text[0].plain_text;
  }

  // Extract App ID
  if (properties["App ID"]?.rich_text?.[0]?.plain_text) {
    entry.id = properties["App ID"].rich_text[0].plain_text;
  }

  // URL fields
  if (properties["Website"]?.url) {
    entry.roasterWebsite = properties["Website"].url;
  }
  if (properties["Place"]?.url) {
    entry.placeUrl = properties["Place"].url;
  }
  if (properties["Front Photo"]?.url) {
    entry.frontPhotoUrl = properties["Front Photo"].url;
  }
  if (properties["Back Photo"]?.url) {
    entry.backPhotoUrl = properties["Back Photo"].url;
  }

  // Rich text fields
  if (properties["Address"]?.rich_text?.[0]?.plain_text) {
    entry.roasterAddress = properties["Address"].rich_text[0].plain_text;
  }
  if (properties["Farm"]?.rich_text?.[0]?.plain_text) {
    entry.farm = properties["Farm"].rich_text[0].plain_text;
  }
  if (properties["Tasting Notes"]?.rich_text?.[0]?.plain_text) {
    entry.tastingNotes = properties["Tasting Notes"].rich_text[0].plain_text;
  }
  if (properties["Weight"]?.rich_text?.[0]?.plain_text) {
    entry.weight = properties["Weight"].rich_text[0].plain_text;
  }
  if (properties["Price"]?.rich_text?.[0]?.plain_text) {
    entry.price = properties["Price"].rich_text[0].plain_text;
  }

  // Origin field - now rich_text to support multiple countries
  if (properties["Origin"]?.rich_text?.[0]?.plain_text) {
    entry.origin = properties["Origin"].rich_text[0].plain_text;
  }

  // Select fields
  if (properties["Process"]?.select?.name) {
    entry.processMethod = properties["Process"].select.name;
  }
  if (properties["Roast Level"]?.select?.name) {
    entry.roastLevel = properties["Roast Level"].select.name;
  }

  // Multi-select fields
  if (properties["Variety"]?.multi_select?.[0]?.name) {
    entry.variety = properties["Variety"].multi_select[0].name;
  }
  if (properties["Flavor Notes"]?.multi_select) {
    entry.flavorNotes = properties["Flavor Notes"].multi_select.map(
      (note: any) => note.name
    );
  }

  // Number field
  if (properties["Rating"]?.number) {
    entry.rating = properties["Rating"].number;
  }

  // Checkbox
  if (typeof properties["Purchase Again"]?.checkbox === "boolean") {
    entry.purchaseAgain = properties["Purchase Again"].checkbox;
  }

  // Date field
  if (properties["Roast Date"]?.date?.start) {
    entry.roastDate = properties["Roast Date"].date.start;
  }

  return entry;
}

/**
 * Creates a new coffee page in Notion database
 * @param databaseId - The database to create the page in
 * @param entry - The coffee entry data
 * @param client - Optional Notion client (for OAuth users), defaults to internal integration
 */
export async function createNotionCoffeePage(
  databaseId: string,
  entry: CoffeeEntry,
  client?: Client
): Promise<string> {
  try {
    const notionClient = client || notion;
    const response = await notionClient.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: coffeeEntryToNotionProperties(entry),
    });

    return response.id;
  } catch (error) {
    console.error("Error creating Notion page:", error);
    throw error;
  }
}

/**
 * Updates an existing Notion coffee page
 * @param pageId - The page ID to update
 * @param updates - Partial updates to apply
 * @param client - Optional Notion client (for OAuth users)
 */
export async function updateNotionCoffeePage(
  pageId: string,
  updates: Partial<CoffeeEntry>,
  client?: Client
): Promise<void> {
  try {
    const notionClient = client || notion;
    // Create a temporary full entry for conversion (merge with empty defaults)
    const tempEntry = {
      id: updates.id || "",
      roasterName: updates.roasterName || "",
      frontPhotoUrl: updates.frontPhotoUrl || "",
      purchaseAgain: updates.purchaseAgain || false,
      createdAt: new Date(),
      ...updates,
    } as CoffeeEntry;

    await notionClient.pages.update({
      page_id: pageId,
      properties: coffeeEntryToNotionProperties(tempEntry),
    });
  } catch (error) {
    console.error("Error updating Notion page:", error);
    throw error;
  }
}

/**
 * Retrieves a coffee entry from Notion by page ID
 * @param pageId - The page ID to retrieve
 * @param client - Optional Notion client (for OAuth users)
 */
export async function getNotionCoffeePage(
  pageId: string,
  client?: Client
): Promise<Partial<CoffeeEntry> | null> {
  try {
    const notionClient = client || notion;
    const response = await notionClient.pages.retrieve({ page_id: pageId });

    if ("properties" in response) {
      return notionPropertiesToCoffeeEntry(response.properties);
    }

    return null;
  } catch (error) {
    console.error("Error retrieving Notion page:", error);
    return null;
  }
}

/**
 * Queries all coffee entries from the Notion database
 * @param databaseId - The database to query
 * @param client - Optional Notion client (for OAuth users)
 */
export async function queryNotionCoffeeDatabase(
  databaseId: string,
  client?: Client
): Promise<CoffeeEntry[]> {
  try {
    const notionClient = client || notion;
    // Get the data source ID from the database
    const database: any = await notionClient.databases.retrieve({ database_id: databaseId });
    const dataSourceId = database.data_sources?.[0]?.id;

    if (!dataSourceId) {
      throw new Error("No data source found for database");
    }

    const results: CoffeeEntry[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response: any = await (notionClient as any).dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: startCursor,
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          },
        ],
      });

      for (const page of response.results) {
        if ("properties" in page) {
          const partialEntry = notionPropertiesToCoffeeEntry(page.properties);

          // Convert to full CoffeeEntry with defaults
          const fullEntry: CoffeeEntry = {
            id: page.id, // Use Notion page ID as entry ID
            roasterName: partialEntry.roasterName || "",
            frontPhotoUrl: partialEntry.frontPhotoUrl || "",
            backPhotoUrl: partialEntry.backPhotoUrl || null,
            origin: partialEntry.origin || null,
            variety: partialEntry.variety || null,
            processMethod: partialEntry.processMethod || null,
            roastLevel: partialEntry.roastLevel || null,
            roastDate: partialEntry.roastDate || null,
            flavorNotes: partialEntry.flavorNotes || null,
            farm: partialEntry.farm || null,
            roasterLocation: partialEntry.roasterLocation || null,
            roasterAddress: partialEntry.roasterAddress || null,
            roasterWebsite: partialEntry.roasterWebsite || null,
            rating: partialEntry.rating || null,
            tastingNotes: partialEntry.tastingNotes || null,
            weight: partialEntry.weight || null,
            price: partialEntry.price || null,
            purchaseAgain: partialEntry.purchaseAgain || false,
            createdAt: page.created_time ? new Date(page.created_time) : new Date(),
          };

          results.push(fullEntry);
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return results;
  } catch (error) {
    console.error("Error querying Notion database:", error);
    throw error;
  }
}

/**
 * Archives (deletes) a Notion coffee page
 * @param pageId - The page ID to archive
 * @param client - Optional Notion client (for OAuth users)
 */
export async function deleteNotionCoffeePage(
  pageId: string,
  client?: Client
): Promise<void> {
  try {
    const notionClient = client || notion;
    await notionClient.pages.update({
      page_id: pageId,
      archived: true,
    });
  } catch (error) {
    console.error("Error deleting Notion page:", error);
    throw error;
  }
}

/**
 * Searches for a Notion page by App ID
 */
export async function findNotionPageByAppId(
  databaseId: string,
  appId: string
): Promise<string | null> {
  try {
    // Get the data source ID from the database
    const database: any = await notion.databases.retrieve({ database_id: databaseId });
    const dataSourceId = database.data_sources?.[0]?.id;

    if (!dataSourceId) {
      throw new Error("No data source found for database");
    }

    const response: any = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "App ID",
        rich_text: {
          equals: appId,
        },
      },
    });

    if (response.results.length > 0) {
      return response.results[0].id;
    }

    return null;
  } catch (error) {
    console.error("Error finding Notion page by App ID:", error);
    return null;
  }
}
