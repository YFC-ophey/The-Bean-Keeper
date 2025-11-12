import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const coffeeEntries = pgTable("coffee_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  photoUrl: text("photo_url").notNull(),
  roasterName: text("roaster_name").notNull(),
  roasterLocation: text("roaster_location"),
  roasterAddress: text("roaster_address"),
  roasterWebsite: text("roaster_website"),
  farm: text("farm"),
  origin: text("origin"),
  variety: text("variety"),
  processMethod: text("process_method"),
  roastDate: text("roast_date"),
  flavorNotes: text("flavor_notes").array(),
  rating: integer("rating"),
  tastingNotes: text("tasting_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCoffeeEntrySchema = createInsertSchema(coffeeEntries).omit({
  id: true,
  createdAt: true,
});

export const updateCoffeeEntrySchema = z.object({
  roasterName: z.string().trim().min(1, "Roaster name is required").optional(),
  roasterLocation: z.string().nullable().optional(),
  roasterAddress: z.string().nullable().optional(),
  roasterWebsite: z.string().nullable().optional(),
  farm: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  variety: z.string().nullable().optional(),
  processMethod: z.string().nullable().optional(),
  roastDate: z.string().nullable().optional(),
  flavorNotes: z.array(z.string()).nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  tastingNotes: z.string().nullable().optional(),
});

export type InsertCoffeeEntry = z.infer<typeof insertCoffeeEntrySchema>;
export type UpdateCoffeeEntry = z.infer<typeof updateCoffeeEntrySchema>;
export type CoffeeEntry = typeof coffeeEntries.$inferSelect;
