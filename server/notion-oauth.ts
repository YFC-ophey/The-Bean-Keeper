import { Client } from "@notionhq/client";
import type { CoffeeEntry } from "@shared/schema";
import { createCoffeeDatabase } from "./notion";

/**
 * Notion OAuth Configuration
 * Set these in your .env file after creating a public integration
 */
const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI || "http://localhost:5001/api/auth/notion/callback";
const NOTION_TEMPLATE_DATABASE_ID = process.env.NOTION_TEMPLATE_DATABASE_ID;

/**
 * OAuth URLs
 */
const NOTION_AUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";

/**
 * Generate Notion OAuth authorization URL
 */
export function getNotionAuthUrl(state?: string): string {
  if (!NOTION_CLIENT_ID) {
    throw new Error("NOTION_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: NOTION_CLIENT_ID,
    response_type: "code",
    owner: "user",
    redirect_uri: NOTION_REDIRECT_URI,
  });

  if (state) {
    params.append("state", state);
  }

  return `${NOTION_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_id: string;
  workspace_name?: string;
  workspace_icon?: string;
  owner: any;
  duplicated_template_id?: string;
}> {
  if (!NOTION_CLIENT_ID || !NOTION_CLIENT_SECRET) {
    throw new Error("Notion OAuth credentials not configured");
  }

  const auth = Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(NOTION_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: NOTION_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_id: string;
}> {
  if (!NOTION_CLIENT_ID || !NOTION_CLIENT_SECRET) {
    throw new Error("Notion OAuth credentials not configured");
  }

  const auth = Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(NOTION_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

/**
 * Create a Notion client for a specific user using their access token
 */
export function createUserNotionClient(accessToken: string): Client {
  return new Client({
    auth: accessToken,
  });
}

/**
 * Get or create the user's Coffee Collection database
 * First checks if user already has a database, reuses it if found
 * Only creates a new database for first-time users
 */
export async function duplicateTemplateDatabaseToUserWorkspace(
  accessToken: string,
  parentPageId?: string
): Promise<string> {
  const notion = createUserNotionClient(accessToken);

  // FIRST: Check if user already has a Bean Keeper database
  // Note: Notion search API filter only accepts "page" or "data_source", so we search all and filter in code
  // Database is named "The Bean Keeper - Coffee Collection"
  const existingDb = await notion.search({
    query: "Bean Keeper",
    page_size: 10,
  });

  // Look for a database that matches our schema (has "Roaster" property)
  for (const result of existingDb.results) {
    if (result.object === "database") {
      const db = result as any;
      // Check if this is our Coffee Collection database by looking for key properties
      if (db.properties && (db.properties["Roaster"] || db.properties["Name"])) {
        console.log("Found existing Bean Keeper database:", db.id);
        return db.id;
      }
    }
  }

  console.log("No existing database found, creating new one...");

  // If no parent page specified, we need to find or create one
  if (!parentPageId) {
    // Search for existing "The Bean Keeper" page or create new one
    const search = await notion.search({
      query: "The Bean Keeper",
      filter: { property: "object", value: "page" },
      page_size: 1,
    });

    if (search.results.length > 0 && search.results[0].object === "page") {
      parentPageId = search.results[0].id;
    } else {
      // Create a new parent page in the user's workspace
      const newPage = await notion.pages.create({
        parent: {
          type: "page_id",
          page_id: await getWorkspaceRootPageId(notion),
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: "The Bean Keeper",
                },
              },
            ],
          },
        },
      });
      parentPageId = newPage.id;
    }
  }

  // Create the database structure (only for new users)
  const databaseId = await createCoffeeDatabase(parentPageId);

  return databaseId;
}

/**
 * Get the root page ID of a workspace (first page the bot can access)
 */
async function getWorkspaceRootPageId(notion: Client): Promise<string> {
  const search = await notion.search({
    filter: { property: "object", value: "page" },
    page_size: 1,
  });

  if (search.results.length === 0) {
    throw new Error("No accessible pages found in workspace. Please share at least one page with the integration.");
  }

  return search.results[0].id;
}

/**
 * Get user information from Notion
 */
export async function getNotionUser(accessToken: string) {
  const notion = createUserNotionClient(accessToken);

  try {
    const response = await notion.users.me();
    return response;
  } catch (error) {
    console.error("Error getting Notion user:", error);
    throw error;
  }
}

/**
 * Verify that a database ID is accessible and valid
 */
export async function verifyDatabaseAccess(
  accessToken: string,
  databaseId: string
): Promise<boolean> {
  const notion = createUserNotionClient(accessToken);

  try {
    await notion.databases.retrieve({ database_id: databaseId });
    return true;
  } catch (error) {
    console.error("Database not accessible:", error);
    return false;
  }
}

/**
 * Test connection with user's Notion workspace
 */
export async function testNotionConnection(accessToken: string): Promise<{
  success: boolean;
  workspace?: any;
  user?: any;
  error?: string;
}> {
  try {
    const notion = createUserNotionClient(accessToken);

    // Get user info
    const user = await notion.users.me();

    // Search for pages to verify access
    const search = await notion.search({
      page_size: 1,
    });

    return {
      success: true,
      user,
      workspace: {
        hasAccess: search.results.length > 0,
        accessiblePages: search.results.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Export all coffee entries to user's Notion database
 */
export async function exportToUserNotion(
  accessToken: string,
  databaseId: string,
  entries: CoffeeEntry[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const notion = createUserNotionClient(accessToken);
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const entry of entries) {
    try {
      // Use the coffeeEntryToNotionProperties from notion.ts
      // For now, we'll import and use the createNotionCoffeePage function
      // but pass in the user's client and database ID

      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          "Name": {
            title: [
              {
                text: {
                  content: `${entry.roasterName}${entry.origin ? ` - ${entry.origin}` : ''}`,
                },
              },
            ],
          },
          // Add other properties here...
          // (This would use the same property mapping logic from notion.ts)
        },
      });

      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Failed to export ${entry.roasterName}: ${error.message}`);
    }
  }

  return results;
}
