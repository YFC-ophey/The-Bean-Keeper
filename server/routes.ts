import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { NotionStorage, createNotionStorage } from "./notion-storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { localStorageService } from "./local-storage";
import { cloudinaryStorageService } from "./cloudinary-storage";
import { insertCoffeeEntrySchema, updateCoffeeEntrySchema, type InsertCoffeeEntry, type UpdateCoffeeEntry } from "@shared/schema";
import { z } from "zod";
import { extractCoffeeInfoWithAI } from "./groq";
import { createCoffeeDatabase } from "./notion";
import { requireAuth } from "./middleware/auth";
import { duplicateTemplateDatabaseToUserWorkspace } from "./notion-oauth";
import { saveDatabaseIdForWorkspace } from "./user-database-mapping";

// Extend Express Response.locals to include our request-scoped storage
declare module 'express-serve-static-core' {
  interface Locals {
    notionStorage: NotionStorage;
  }
}

/**
 * Helper to get the request-scoped NotionStorage from res.locals
 */
function getStorage(res: Response): NotionStorage {
  if (!res.locals.notionStorage) {
    throw new Error('NotionStorage not initialized for this request');
  }
  return res.locals.notionStorage;
}

/**
 * Generates a Google Maps Place URL based on roaster information
 * Uses the same logic as CoffeeDetail.tsx to ensure consistent search results
 * Uses quotes around roaster name for EXACT matching (not prefix/fuzzy match)
 */
function generatePlaceUrl(entry: Partial<InsertCoffeeEntry | UpdateCoffeeEntry> & { roasterName: string }): string {
  // Use quotes around roaster name for EXACT matching (not prefix/fuzzy match)
  const quotedName = `"${entry.roasterName}"`;

  // Extract domain from website for additional context
  const websiteDomain = entry.roasterWebsite
    ? entry.roasterWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
    : null;

  let searchQuery: string;

  // Priority 1: Full address with exact name match
  if (entry.roasterAddress) {
    searchQuery = `${quotedName} ${entry.roasterAddress}`;
  }
  // Priority 2: Name + location with website domain for disambiguation
  else if (entry.roasterLocation) {
    searchQuery = websiteDomain
      ? `${quotedName} ${websiteDomain} ${entry.roasterLocation}`
      : `${quotedName} ${entry.roasterLocation}`;
  }
  // Priority 3: Name + website domain + country from TLD
  else if (websiteDomain) {
    const tldMatch = websiteDomain.match(/\.([a-z]{2})$/);
    let locationHint = '';

    if (tldMatch && tldMatch[1] !== 'com') {
      const tldToCountry: Record<string, string> = {
        'ca': 'Canada',
        'uk': 'United Kingdom',
        'au': 'Australia',
        'nz': 'New Zealand',
        'de': 'Germany',
        'fr': 'France',
        'it': 'Italy',
        'es': 'Spain',
      };
      locationHint = tldToCountry[tldMatch[1]] || '';
    }

    searchQuery = locationHint
      ? `${quotedName} ${websiteDomain} ${locationHint}`
      : `${quotedName} ${websiteDomain}`;
  }
  // Fallback: quoted name only for exact match
  else {
    searchQuery = quotedName;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();

  // Middleware to create request-scoped NotionStorage instance
  // Guest users (no session): Use owner's database from NOTION_DATABASE_ID with internal integration
  // Authenticated users: Use their own database with their OAuth access token
  // Also verifies database is accessible before proceeding (clears stale sessions)
  // IMPORTANT: Creates a NEW storage instance per request to avoid race conditions
  app.use('/api/coffee-entries', async (req, res, next) => {
    const sessionDbId = req.session.databaseId;
    const sessionAccessToken = req.session.accessToken;
    const envDbId = process.env.NOTION_DATABASE_ID?.trim();

    // Log which database is being used (helpful for debugging)
    if (sessionDbId && sessionAccessToken) {
      console.log(`📝 Checking USER's database: ${sessionDbId.substring(0, 8)}... (with OAuth token)`);

      // Verify the database is still accessible with user's token
      // This catches stale sessions where the user revoked access or database was deleted
      try {
        const { Client } = await import("@notionhq/client");
        const userClient = new Client({ auth: sessionAccessToken });
        await userClient.databases.retrieve({ database_id: sessionDbId });
        console.log(`✅ Database verified accessible`);
        // Create request-scoped storage with user's credentials
        res.locals.notionStorage = createNotionStorage(sessionDbId, sessionAccessToken);
      } catch (error: any) {
        console.log(`⚠️ User's database not accessible: ${error.code || error.message}`);
        console.log(`🔍 Searching for user's existing database...`);

        // Don't immediately fall back to guest mode - try to find the user's database
        try {
          // Use the access token to search for their existing database
          const foundDatabaseId = await duplicateTemplateDatabaseToUserWorkspace(sessionAccessToken);

          if (foundDatabaseId) {
            console.log(`✅ Found user's database: ${foundDatabaseId.substring(0, 8)}...`);

            // Update session with correct database ID
            req.session.databaseId = foundDatabaseId;

            // Save the mapping for future reference (if we have workspace info)
            if (req.session.userId) {
              // Note: userId in our session is actually the bot_id/workspace_id
              saveDatabaseIdForWorkspace(req.session.userId, foundDatabaseId, req.session.workspaceName);
            }

            // Create request-scoped storage with found database
            res.locals.notionStorage = createNotionStorage(foundDatabaseId, sessionAccessToken);
          } else {
            throw new Error('No database found or created');
          }
        } catch (searchError: any) {
          console.log(`❌ Could not find/create database: ${searchError.message}`);
          console.log(`🔄 Clearing stale session, falling back to guest mode`);

          // Clear the stale session data
          req.session.databaseId = undefined;
          req.session.accessToken = undefined;
          req.session.workspaceName = undefined;

          // Fall back to guest mode (owner's database)
          if (envDbId) {
            console.log(`👀 Using OWNER's database (guest mode): ${envDbId?.substring(0, 8)}...`);
            // Create request-scoped storage for guest mode (null token = internal integration)
            res.locals.notionStorage = createNotionStorage(envDbId, null);
          } else {
            return res.status(500).json({
              error: 'Database not configured',
              message: 'Server configuration error - database ID missing'
            });
          }
        }
      }
    } else {
      console.log(`👀 Using OWNER's database (guest mode): ${envDbId?.substring(0, 8)}...`);

      if (!envDbId) {
        return res.status(500).json({
          error: 'Database not configured',
          message: 'Server configuration error - database ID missing'
        });
      }

      // Create request-scoped storage for guest mode (null token = internal integration)
      res.locals.notionStorage = createNotionStorage(envDbId, null);
    }

    next();
  });

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

  // Get upload URL for photo - use Cloudinary if configured, otherwise local storage
  app.post("/api/upload-url", requireAuth, async (req, res) => {
    try {
      console.log("📷 Upload URL request");
      console.log("  Session databaseId:", req.session.databaseId ? 'SET' : 'NOT SET');
      console.log("  Session accessToken:", req.session.accessToken ? 'SET' : 'NOT SET');
      console.log("  Cookie header:", req.headers.cookie ? 'present' : 'missing');

      // Prefer Cloudinary if configured
      if (cloudinaryStorageService.isConfigured()) {
        const uploadURL = await cloudinaryStorageService.getUploadURL();
        console.log("  ✓ Cloudinary URL generated:", uploadURL);
        res.json({ uploadURL });
      } else {
        // Fallback to local storage
        const uploadURL = await localStorageService.getUploadURL();
        console.log("  ✓ Local URL generated:", uploadURL);
        res.json({ uploadURL });
      }
    } catch (error) {
      console.error("❌ Error generating upload URL:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to generate upload URL", details: errorMessage });
    }
  });

  // Local file upload endpoint
  app.put("/api/local-upload/:fileId", requireAuth, async (req, res) => {
    try {
      const { fileId } = req.params;
      const contentType = req.headers['content-type'] || 'image/jpeg';

      // Collect the raw body data
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        const fileUrl = await localStorageService.saveFile(fileId, buffer, contentType);
        res.json({ url: fileUrl });
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Cloudinary upload endpoint
  app.put("/api/cloudinary-upload/:fileId", requireAuth, async (req, res) => {
    try {
      const { fileId } = req.params;
      const contentType = req.headers['content-type'] || 'image/jpeg';
      console.log("📷 Cloudinary upload request:", { fileId, contentType });
      console.log("  Session databaseId:", req.session.databaseId ? 'SET' : 'NOT SET');
      console.log("  Session accessToken:", req.session.accessToken ? 'SET' : 'NOT SET');

      // Collect the raw body data
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          console.log("  Buffer size:", buffer.length);
          const fileUrl = await cloudinaryStorageService.saveFile(fileId, buffer, contentType);
          console.log("  ✓ Upload successful:", fileUrl);
          res.json({ url: fileUrl });
        } catch (uploadError) {
          console.error("❌ Error uploading to Cloudinary:", uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : "Unknown error";
          res.status(500).json({ error: "Failed to upload file to Cloudinary", details: errorMessage });
        }
      });
    } catch (error) {
      console.error("❌ Error in Cloudinary upload endpoint:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to upload file", details: errorMessage });
    }
  });

  // Serve local files
  app.get("/api/local-files/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const exists = await localStorageService.fileExists(filename);

      if (!exists) {
        return res.status(404).json({ error: "File not found" });
      }

      const buffer = await localStorageService.getFile(filename);
      res.set('Content-Type', 'image/jpeg');
      res.send(buffer);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  // Get all coffee entries
  app.get("/api/coffee-entries", async (req, res) => {
    try {
      const storage = getStorage(res);
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
      const storage = getStorage(res);
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

  // Create coffee entry (protected - requires authentication)
  app.post("/api/coffee-entries", requireAuth, async (req, res) => {
    try {
      console.log("📝 Creating coffee entry...");
      console.log("  Session databaseId:", req.session.databaseId);
      console.log("  Session accessToken:", req.session.accessToken ? 'SET' : 'NOT SET');

      // Validate request body
      const validatedData = insertCoffeeEntrySchema.parse(req.body);
      console.log("  ✓ Request body validated");

      // Normalize photo URLs if they're presigned URLs
      const frontPhotoUrl = objectStorageService.normalizeObjectEntityPath(validatedData.frontPhotoUrl);
      const backPhotoUrl = validatedData.backPhotoUrl
        ? objectStorageService.normalizeObjectEntityPath(validatedData.backPhotoUrl)
        : null;
      console.log("  ✓ Photo URLs normalized:", { frontPhotoUrl, backPhotoUrl });

      // Generate Google Maps Place URL
      const placeUrl = generatePlaceUrl(validatedData);
      console.log("  ✓ Place URL generated");

      const storage = getStorage(res);
      const entry = await storage.createCoffeeEntry({
        ...validatedData,
        frontPhotoUrl,
        backPhotoUrl,
        placeUrl,
      });

      console.log(`✓ Entry created in Notion with ID: ${entry.id}`);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Validation error:", error.errors);
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("❌ Error creating coffee entry:", error);
      // Return more detailed error for debugging
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to create coffee entry", details: errorMessage });
    }
  });

  // Update coffee entry (protected - requires authentication)
  app.patch("/api/coffee-entries/:id", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const validatedData = updateCoffeeEntrySchema.parse(req.body);

      // Check if any location-related fields are being updated
      const locationFieldsChanged = !!(
        validatedData.roasterName ||
        validatedData.roasterAddress ||
        validatedData.roasterLocation ||
        validatedData.roasterWebsite
      );

      let updatedData = { ...validatedData };
      const storage = getStorage(res);

      // Regenerate placeUrl if location-related fields changed
      if (locationFieldsChanged) {
        // Fetch current entry to merge with updates
        const currentEntry = await storage.getCoffeeEntry(req.params.id);
        if (!currentEntry) {
          return res.status(404).json({ error: "Coffee entry not found" });
        }

        // Merge current entry with updates
        const mergedData = { ...currentEntry, ...validatedData };

        // Generate new Place URL
        updatedData.placeUrl = generatePlaceUrl(mergedData);
      }

      const entry = await storage.updateCoffeeEntry(req.params.id, updatedData);
      if (!entry) {
        return res.status(404).json({ error: "Coffee entry not found" });
      }

      console.log(`✓ Entry ${entry.id} updated in Notion`);
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error updating coffee entry:", error);
      res.status(500).json({ error: "Failed to update coffee entry" });
    }
  });

  // Delete coffee entry (protected - requires authentication)
  app.delete("/api/coffee-entries/:id", requireAuth, async (req, res) => {
    try {
      const storage = getStorage(res);
      const deleted = await storage.deleteCoffeeEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Coffee entry not found" });
      }
      console.log(`✓ Entry ${req.params.id} deleted from Notion`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting coffee entry:", error);
      res.status(500).json({ error: "Failed to delete coffee entry" });
    }
  });

  // AI-powered OCR extraction endpoint
  app.post("/api/extract-coffee-info", requireAuth, async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      const extracted = await extractCoffeeInfoWithAI(text);
      res.json(extracted);
    } catch (error) {
      console.error("Error extracting coffee info with AI:", error);
      res.status(500).json({ error: "Failed to extract coffee information" });
    }
  });

  // Health check endpoint for Render
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Diagnostic endpoint to check environment
  app.get("/api/debug/env", (_req, res) => {
    const cloudinaryConfigured = cloudinaryStorageService.isConfigured();
    res.json({
      nodeEnv: process.env.NODE_ENV,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      hasNotionKey: !!process.env.NOTION_API_KEY,
      hasNotionDb: !!process.env.NOTION_DATABASE_ID,
      hasGoogleMaps: !!process.env.VITE_GOOGLE_MAPS_API_KEY,
      hasPrivateObjectDir: !!process.env.PRIVATE_OBJECT_DIR,
      hasCloudinary: cloudinaryConfigured,
      port: process.env.PORT || '5000',
      storageMode: cloudinaryConfigured ? 'cloudinary (persistent)' : 'local (ephemeral)'
    });
  });

  // Test Groq API connectivity
  app.get("/api/debug/groq", async (_req, res) => {
    try {
      const testResult = await extractCoffeeInfoWithAI("Happy Goat Coffee, Ottawa, Canada. Ethiopia Washed. Blueberry notes.");
      res.json({
        success: Object.keys(testResult).length > 0,
        extracted: testResult,
        message: Object.keys(testResult).length > 0
          ? "Groq API is working"
          : "Groq API returned empty result - check server logs for errors"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Notion Database Setup

  // Create Notion database
  app.post("/api/notion/create-database", async (req, res) => {
    try {
      const { parentPageId } = req.body;

      if (!parentPageId) {
        return res.status(400).json({ error: "parentPageId is required" });
      }

      const databaseId = await createCoffeeDatabase(parentPageId);
      res.json({ databaseId, message: "Database created successfully" });
    } catch (error) {
      console.error("Error creating Notion database:", error);
      res.status(500).json({ error: "Failed to create Notion database" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
