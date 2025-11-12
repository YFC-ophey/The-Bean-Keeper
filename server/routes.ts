import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { insertCoffeeEntrySchema, updateCoffeeEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();

  // Serve uploaded photos
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for photo
  app.post("/api/upload-url", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Get all coffee entries
  app.get("/api/coffee-entries", async (req, res) => {
    try {
      const entries = await storage.getAllCoffeeEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching coffee entries:", error);
      res.status(500).json({ error: "Failed to fetch coffee entries" });
    }
  });

  // Get single coffee entry
  app.get("/api/coffee-entries/:id", async (req, res) => {
    try {
      const entry = await storage.getCoffeeEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Coffee entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching coffee entry:", error);
      res.status(500).json({ error: "Failed to fetch coffee entry" });
    }
  });

  // Create coffee entry
  app.post("/api/coffee-entries", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertCoffeeEntrySchema.parse(req.body);
      
      // Normalize photo URL if it's a presigned URL
      const photoUrl = objectStorageService.normalizeObjectEntityPath(validatedData.photoUrl);
      
      const entry = await storage.createCoffeeEntry({
        ...validatedData,
        photoUrl,
      });
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating coffee entry:", error);
      res.status(500).json({ error: "Failed to create coffee entry" });
    }
  });

  // Update coffee entry
  app.patch("/api/coffee-entries/:id", async (req, res) => {
    try {
      // Validate request body
      const validatedData = updateCoffeeEntrySchema.parse(req.body);
      
      const entry = await storage.updateCoffeeEntry(req.params.id, validatedData);
      if (!entry) {
        return res.status(404).json({ error: "Coffee entry not found" });
      }
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error updating coffee entry:", error);
      res.status(500).json({ error: "Failed to update coffee entry" });
    }
  });

  // Delete coffee entry
  app.delete("/api/coffee-entries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCoffeeEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Coffee entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting coffee entry:", error);
      res.status(500).json({ error: "Failed to delete coffee entry" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
