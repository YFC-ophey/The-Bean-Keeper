import { type CoffeeEntry, type InsertCoffeeEntry, type UpdateCoffeeEntry, coffeeEntries } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getCoffeeEntry(id: string): Promise<CoffeeEntry | undefined>;
  getAllCoffeeEntries(): Promise<CoffeeEntry[]>;
  createCoffeeEntry(entry: InsertCoffeeEntry): Promise<CoffeeEntry>;
  updateCoffeeEntry(id: string, updates: UpdateCoffeeEntry): Promise<CoffeeEntry | undefined>;
  deleteCoffeeEntry(id: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  async getCoffeeEntry(id: string): Promise<CoffeeEntry | undefined> {
    const result = await db.select().from(coffeeEntries).where(eq(coffeeEntries.id, id)).limit(1);
    return result[0];
  }

  async getAllCoffeeEntries(): Promise<CoffeeEntry[]> {
    return await db.select().from(coffeeEntries).orderBy(desc(coffeeEntries.createdAt));
  }

  async createCoffeeEntry(insertEntry: InsertCoffeeEntry): Promise<CoffeeEntry> {
    const result = await db.insert(coffeeEntries).values(insertEntry).returning();
    return result[0];
  }

  async updateCoffeeEntry(id: string, updates: UpdateCoffeeEntry): Promise<CoffeeEntry | undefined> {
    const result = await db.update(coffeeEntries)
      .set(updates)
      .where(eq(coffeeEntries.id, id))
      .returning();
    return result[0];
  }

  async deleteCoffeeEntry(id: string): Promise<boolean> {
    const result = await db.delete(coffeeEntries).where(eq(coffeeEntries.id, id)).returning();
    return result.length > 0;
  }
}

export class MemStorage implements IStorage {
  private coffeeEntries: Map<string, CoffeeEntry>;

  constructor() {
    this.coffeeEntries = new Map();
  }

  async getCoffeeEntry(id: string): Promise<CoffeeEntry | undefined> {
    return this.coffeeEntries.get(id);
  }

  async getAllCoffeeEntries(): Promise<CoffeeEntry[]> {
    return Array.from(this.coffeeEntries.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createCoffeeEntry(insertEntry: InsertCoffeeEntry): Promise<CoffeeEntry> {
    const id = randomUUID();
    const entry: CoffeeEntry = { 
      roasterName: insertEntry.roasterName,
      photoUrl: insertEntry.photoUrl,
      origin: insertEntry.origin ?? null,
      variety: insertEntry.variety ?? null,
      processMethod: insertEntry.processMethod ?? null,
      roastDate: insertEntry.roastDate ?? null,
      flavorNotes: insertEntry.flavorNotes ?? null,
      farm: insertEntry.farm ?? null,
      roasterLocation: insertEntry.roasterLocation ?? null,
      roasterAddress: insertEntry.roasterAddress ?? null,
      roasterWebsite: insertEntry.roasterWebsite ?? null,
      rating: insertEntry.rating ?? null,
      tastingNotes: insertEntry.tastingNotes ?? null,
      id,
      createdAt: new Date()
    };
    this.coffeeEntries.set(id, entry);
    return entry;
  }

  async updateCoffeeEntry(id: string, updates: UpdateCoffeeEntry): Promise<CoffeeEntry | undefined> {
    const entry = this.coffeeEntries.get(id);
    if (!entry) return undefined;
    
    // Only update fields that are explicitly provided
    const updatedEntry: CoffeeEntry = {
      ...entry,
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
    };
    this.coffeeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteCoffeeEntry(id: string): Promise<boolean> {
    return this.coffeeEntries.delete(id);
  }
}

// Use database storage for permanent persistence
export const storage = new DbStorage();
