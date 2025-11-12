import { type CoffeeEntry, type InsertCoffeeEntry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getCoffeeEntry(id: string): Promise<CoffeeEntry | undefined>;
  getAllCoffeeEntries(): Promise<CoffeeEntry[]>;
  createCoffeeEntry(entry: InsertCoffeeEntry): Promise<CoffeeEntry>;
  updateCoffeeEntry(id: string, entry: Partial<InsertCoffeeEntry>): Promise<CoffeeEntry | undefined>;
  deleteCoffeeEntry(id: string): Promise<boolean>;
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

  async updateCoffeeEntry(id: string, updates: Partial<InsertCoffeeEntry>): Promise<CoffeeEntry | undefined> {
    const entry = this.coffeeEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = { ...entry, ...updates };
    this.coffeeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteCoffeeEntry(id: string): Promise<boolean> {
    return this.coffeeEntries.delete(id);
  }
}

export const storage = new MemStorage();
