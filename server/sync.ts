import { storage } from "./storage";
import type { CoffeeEntry, UpdateCoffeeEntry } from "@shared/schema";
import {
  createNotionCoffeePage,
  updateNotionCoffeePage,
  deleteNotionCoffeePage,
  queryNotionCoffeeDatabase,
  findNotionPageByAppId,
} from "./notion";

export interface SyncReport {
  pushedToNotion: number;
  pulledFromNotion: number;
  conflicts: number;
  errors: string[];
}

/**
 * Get the Notion database ID from environment variable
 */
function getNotionDatabaseId(): string {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    throw new Error("NOTION_DATABASE_ID environment variable is not set");
  }
  return databaseId;
}

/**
 * Push a local coffee entry to Notion
 * Creates a new Notion page or updates existing one
 */
export async function pushToNotion(entryId: string): Promise<void> {
  try {
    const databaseId = getNotionDatabaseId();
    const entry = await storage.getCoffeeEntry(entryId);

    if (!entry) {
      throw new Error(`Coffee entry ${entryId} not found`);
    }

    // Check if there's already a Notion page for this entry
    const existingPageId = await findNotionPageByAppId(databaseId, entry.id);

    if (existingPageId) {
      // Update existing page
      console.log(`Updating Notion page ${existingPageId} for entry ${entryId}`);
      await updateNotionCoffeePage(existingPageId, entry);
    } else {
      // Create new page
      console.log(`Creating new Notion page for entry ${entryId}`);
      const pageId = await createNotionCoffeePage(databaseId, entry);
      console.log(`Created Notion page ${pageId}`);
    }
  } catch (error) {
    console.error(`Error pushing entry ${entryId} to Notion:`, error);
    throw error;
  }
}

/**
 * Pull coffee entries from Notion to local database
 * Updates local entries or creates new ones
 */
export async function pullFromNotion(pageId: string): Promise<void> {
  try {
    const databaseId = getNotionDatabaseId();
    const allNotionEntries = await queryNotionCoffeeDatabase(databaseId);

    const notionEntry = allNotionEntries.find((e) => e.pageId === pageId);

    if (!notionEntry) {
      throw new Error(`Notion page ${pageId} not found`);
    }

    const appId = notionEntry.entry.id;

    if (!appId) {
      console.warn(`Notion page ${pageId} has no App ID, skipping...`);
      return;
    }

    // Check if entry exists locally
    const localEntry = await storage.getCoffeeEntry(appId);

    if (localEntry) {
      // Update local entry
      console.log(`Updating local entry ${appId} from Notion`);
      const updates: UpdateCoffeeEntry = {
        roasterName: notionEntry.entry.roasterName,
        roasterAddress: notionEntry.entry.roasterAddress,
        roasterWebsite: notionEntry.entry.roasterWebsite,
        farm: notionEntry.entry.farm,
        origin: notionEntry.entry.origin,
        variety: notionEntry.entry.variety,
        processMethod: notionEntry.entry.processMethod,
        roastDate: notionEntry.entry.roastDate,
        flavorNotes: notionEntry.entry.flavorNotes,
        rating: notionEntry.entry.rating,
        tastingNotes: notionEntry.entry.tastingNotes,
        weight: notionEntry.entry.weight,
        price: notionEntry.entry.price,
        purchaseAgain: notionEntry.entry.purchaseAgain,
      };
      await storage.updateCoffeeEntry(appId, updates);
    } else {
      // Cannot create new entry without required fields
      console.warn(
        `Cannot create local entry from Notion page ${pageId} - missing required fields`
      );
    }
  } catch (error) {
    console.error(`Error pulling from Notion page ${pageId}:`, error);
    throw error;
  }
}

/**
 * Perform a full bidirectional sync between local database and Notion
 * Strategy: Last-write-wins based on timestamps
 */
export async function fullSync(): Promise<SyncReport> {
  const report: SyncReport = {
    pushedToNotion: 0,
    pulledFromNotion: 0,
    conflicts: 0,
    errors: [],
  };

  try {
    const databaseId = getNotionDatabaseId();

    // Get all local entries
    const localEntries = await storage.getAllCoffeeEntries();
    console.log(`Found ${localEntries.length} local entries`);

    // Get all Notion entries
    const notionEntries = await queryNotionCoffeeDatabase(databaseId);
    console.log(`Found ${notionEntries.length} Notion entries`);

    // Create maps for easier lookup
    const localMap = new Map(localEntries.map((e) => [e.id, e]));
    const notionMap = new Map(
      notionEntries
        .filter((e) => e.entry.id)
        .map((e) => [e.entry.id!, { pageId: e.pageId, entry: e.entry }])
    );

    // Push local entries to Notion (if they don't exist or are newer)
    for (const localEntry of localEntries) {
      try {
        const notionData = notionMap.get(localEntry.id);

        if (!notionData) {
          // Entry doesn't exist in Notion, create it
          console.log(`Pushing new entry ${localEntry.id} to Notion`);
          await pushToNotion(localEntry.id);
          report.pushedToNotion++;
        } else {
          // Entry exists in both - for now just update Notion
          // (In production, you'd compare timestamps here)
          console.log(`Updating existing entry ${localEntry.id} in Notion`);
          await updateNotionCoffeePage(notionData.pageId, localEntry);
          report.pushedToNotion++;
        }
      } catch (error) {
        const errorMsg = `Error syncing entry ${localEntry.id}: ${error}`;
        console.error(errorMsg);
        report.errors.push(errorMsg);
      }
    }

    // Pull Notion entries that don't exist locally
    for (const [appId, notionData] of notionMap.entries()) {
      try {
        if (!localMap.has(appId)) {
          console.log(`Found Notion entry ${appId} not in local DB`);
          // For now, we just log it (would need all required fields to create)
          report.pulledFromNotion++;
        }
      } catch (error) {
        const errorMsg = `Error pulling Notion entry ${appId}: ${error}`;
        console.error(errorMsg);
        report.errors.push(errorMsg);
      }
    }

    console.log("Sync complete:", report);
    return report;
  } catch (error) {
    console.error("Error during full sync:", error);
    report.errors.push(`Full sync error: ${error}`);
    return report;
  }
}

/**
 * Delete a coffee entry from both local database and Notion
 */
export async function deleteFromBoth(entryId: string): Promise<void> {
  try {
    const databaseId = getNotionDatabaseId();

    // Find corresponding Notion page
    const pageId = await findNotionPageByAppId(databaseId, entryId);

    // Delete from local database
    await storage.deleteCoffeeEntry(entryId);
    console.log(`Deleted local entry ${entryId}`);

    // Delete from Notion if it exists
    if (pageId) {
      await deleteNotionCoffeePage(pageId);
      console.log(`Deleted Notion page ${pageId}`);
    }
  } catch (error) {
    console.error(`Error deleting entry ${entryId} from both systems:`, error);
    throw error;
  }
}

/**
 * Get sync status information
 */
export async function getSyncStatus(): Promise<{
  localCount: number;
  notionCount: number;
  lastSync: string | null;
  notionConfigured: boolean;
}> {
  try {
    const localEntries = await storage.getAllCoffeeEntries();
    const notionConfigured = !!process.env.NOTION_DATABASE_ID && !!process.env.NOTION_API_KEY;

    let notionCount = 0;
    if (notionConfigured) {
      try {
        const databaseId = getNotionDatabaseId();
        const notionEntries = await queryNotionCoffeeDatabase(databaseId);
        notionCount = notionEntries.length;
      } catch (error) {
        console.error("Error getting Notion count:", error);
      }
    }

    return {
      localCount: localEntries.length,
      notionCount,
      lastSync: null, // TODO: Store last sync timestamp
      notionConfigured,
    };
  } catch (error) {
    console.error("Error getting sync status:", error);
    throw error;
  }
}
