import { type CoffeeEntry, type InsertCoffeeEntry, type UpdateCoffeeEntry } from "@shared/schema";
import { notion } from "./notion";
import { createNotionCoffeePage, updateNotionCoffeePage, getNotionCoffeePage, queryNotionCoffeeDatabase, deleteNotionCoffeePage } from "./notion";

export class NotionStorage {
  private databaseId: string | null = null;

  constructor(databaseId?: string) {
    this.databaseId = databaseId || null;
  }

  setDatabaseId(databaseId: string) {
    this.databaseId = databaseId;
  }

  private ensureDatabaseId(): string {
    if (!this.databaseId) {
      throw new Error("Notion database ID not set. User must provide database ID.");
    }
    return this.databaseId;
  }

  async getCoffeeEntry(id: string): Promise<CoffeeEntry | undefined> {
    try {
      const databaseId = this.ensureDatabaseId();
      const entry = await getNotionCoffeePage(id);
      return entry || undefined;
    } catch (error) {
      console.error(`Error getting coffee entry ${id}:`, error);
      return undefined;
    }
  }

  async getAllCoffeeEntries(): Promise<CoffeeEntry[]> {
    try {
      const databaseId = this.ensureDatabaseId();
      return await queryNotionCoffeeDatabase(databaseId);
    } catch (error) {
      console.error("Error getting all coffee entries:", error);
      return [];
    }
  }

  async createCoffeeEntry(entry: InsertCoffeeEntry): Promise<CoffeeEntry> {
    try {
      const databaseId = this.ensureDatabaseId();

      // Create full CoffeeEntry object with defaults
      const fullEntry: CoffeeEntry = {
        id: crypto.randomUUID(),
        roasterName: entry.roasterName,
        frontPhotoUrl: entry.frontPhotoUrl,
        backPhotoUrl: entry.backPhotoUrl ?? null,
        origin: entry.origin ?? null,
        variety: entry.variety ?? null,
        processMethod: entry.processMethod ?? null,
        roastDate: entry.roastDate ?? null,
        flavorNotes: entry.flavorNotes ?? null,
        farm: entry.farm ?? null,
        roasterLocation: entry.roasterLocation ?? null,
        roasterAddress: entry.roasterAddress ?? null,
        roasterWebsite: entry.roasterWebsite ?? null,
        rating: entry.rating ?? null,
        tastingNotes: entry.tastingNotes ?? null,
        weight: entry.weight ?? null,
        price: entry.price ?? null,
        purchaseAgain: entry.purchaseAgain ?? false,
        createdAt: new Date(),
      };

      // Create in Notion (using entry.id as Notion page ID)
      const notionPageId = await createNotionCoffeePage(databaseId, fullEntry);

      // Update entry with Notion page ID
      fullEntry.id = notionPageId;

      return fullEntry;
    } catch (error) {
      console.error("Error creating coffee entry:", error);
      throw error;
    }
  }

  async updateCoffeeEntry(id: string, updates: UpdateCoffeeEntry): Promise<CoffeeEntry | undefined> {
    try {
      const databaseId = this.ensureDatabaseId();

      // Get existing entry first
      const existingEntry = await this.getCoffeeEntry(id);
      if (!existingEntry) {
        return undefined;
      }

      // Merge updates with existing entry
      const updatedEntry: CoffeeEntry = {
        ...existingEntry,
        ...(updates.roasterName !== undefined && { roasterName: updates.roasterName }),
        ...(updates.roasterLocation !== undefined && { roasterLocation: updates.roasterLocation }),
        ...(updates.roasterAddress !== undefined && { roasterAddress: updates.roasterAddress }),
        ...(updates.roasterWebsite !== undefined && { roasterWebsite: updates.roasterWebsite }),
        ...(updates.farm !== undefined && { farm: updates.farm }),
        ...(updates.origin !== undefined && { origin: updates.origin }),
        ...(updates.variety !== undefined && { variety: updates.variety }),
        ...(updates.processMethod !== undefined && { processMethod: updates.processMethod }),
        ...(updates.roastDate !== undefined && { roastDate: updates.roastDate }),
        ...(updates.flavorNotes !== undefined && { flavorNotes: updates.flavorNotes }),
        ...(updates.rating !== undefined && { rating: updates.rating }),
        ...(updates.tastingNotes !== undefined && { tastingNotes: updates.tastingNotes }),
        ...(updates.weight !== undefined && { weight: updates.weight }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.purchaseAgain !== undefined && { purchaseAgain: updates.purchaseAgain }),
      };

      // Update in Notion
      await updateNotionCoffeePage(id, updatedEntry);

      return updatedEntry;
    } catch (error) {
      console.error(`Error updating coffee entry ${id}:`, error);
      return undefined;
    }
  }

  async deleteCoffeeEntry(id: string): Promise<boolean> {
    try {
      await deleteNotionCoffeePage(id);
      return true;
    } catch (error) {
      console.error(`Error deleting coffee entry ${id}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const notionStorage = new NotionStorage();
