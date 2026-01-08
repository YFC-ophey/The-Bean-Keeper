import { z } from "zod";

// Coffee Entry Type (matches Notion database structure)
export interface CoffeeEntry {
  id: string; // Notion page ID
  frontPhotoUrl: string;
  backPhotoUrl: string | null;
  roasterName: string;
  roasterLocation: string | null;
  roasterAddress: string | null;
  roasterWebsite: string | null;
  placeUrl: string | null; // Google Maps Place link
  farm: string | null;
  origin: string | null;
  variety: string | null;
  processMethod: string | null;
  roastLevel: string | null;
  roastDate: string | null;
  flavorNotes: string[] | null;
  rating: number | null;
  tastingNotes: string | null;
  weight: string | null;
  price: string | null;
  purchaseAgain: boolean;
  createdAt: Date;
}

// Insert schema for creating new entries
export const insertCoffeeEntrySchema = z.object({
  frontPhotoUrl: z.string().min(1, "Front photo is required"),
  backPhotoUrl: z.string().nullable().optional(),
  roasterName: z.string().trim().min(1, "Roaster name is required"),
  roasterLocation: z.string().nullable().optional(),
  roasterAddress: z.string().nullable().optional(),
  roasterWebsite: z.string().nullable().optional(),
  placeUrl: z.string().nullable().optional(),
  farm: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  variety: z.string().nullable().optional(),
  processMethod: z.string().nullable().optional(),
  roastLevel: z.string().nullable().optional(),
  roastDate: z.string().nullable().optional(),
  flavorNotes: z.array(z.string()).nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  tastingNotes: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  purchaseAgain: z.boolean().default(false),
});

// Update schema for partial updates
export const updateCoffeeEntrySchema = z.object({
  roasterName: z.string().trim().min(1, "Roaster name is required").optional(),
  roasterLocation: z.string().nullable().optional(),
  roasterAddress: z.string().nullable().optional(),
  roasterWebsite: z.string().nullable().optional(),
  placeUrl: z.string().nullable().optional(),
  farm: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  variety: z.string().nullable().optional(),
  processMethod: z.string().nullable().optional(),
  roastLevel: z.string().nullable().optional(),
  roastDate: z.string().nullable().optional(),
  flavorNotes: z.array(z.string()).nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  tastingNotes: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  purchaseAgain: z.boolean().optional(),
});

export type InsertCoffeeEntry = z.infer<typeof insertCoffeeEntrySchema>;
export type UpdateCoffeeEntry = z.infer<typeof updateCoffeeEntrySchema>;
