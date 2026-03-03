import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { NotionStorage, createNotionStorage } from "./notion-storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { localStorageService } from "./local-storage";
import { cloudinaryStorageService } from "./cloudinary-storage";
import { insertCoffeeEntrySchema, updateCoffeeEntrySchema, type InsertCoffeeEntry, type UpdateCoffeeEntry } from "@shared/schema";
import { z } from "zod";
import { extractCoffeeInfoWithAI } from "./groq";
import { createCoffeeDatabase } from "./notion";
import { optionalAuth, requireAuth } from "./middleware/auth";
import { duplicateTemplateDatabaseToUserWorkspace } from "./notion-oauth";
import { saveDatabaseIdForWorkspace } from "./user-database-mapping";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function normalizeContentType(contentTypeHeader: string | string[] | undefined): string {
  if (!contentTypeHeader) {
    return "";
  }
  const raw = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
  return raw.split(";")[0].trim().toLowerCase();
}

function isValidUploadFileId(fileId: string): boolean {
  return UUID_V4_PATTERN.test(fileId);
}

async function readUploadBuffer(req: Request): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let rejected = false;

    req.on("data", (chunk: Buffer) => {
      if (rejected) {
        return;
      }

      totalBytes += chunk.length;
      if (totalBytes > MAX_UPLOAD_BYTES) {
        rejected = true;
        reject(new Error("PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!rejected) {
        resolve(Buffer.concat(chunks));
      }
    });

    req.on("error", (err) => {
      if (!rejected) {
        rejected = true;
        reject(err);
      }
    });

    req.on("aborted", () => {
      if (!rejected) {
        rejected = true;
        reject(new Error("REQUEST_ABORTED"));
      }
    });
  });
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
  app.use('/api/coffee-entries', optionalAuth, async (req, res, next) => {
    const notionAuthState = req.notionAuthState;
    const envDbId = process.env.NOTION_DATABASE_ID?.trim();

    // Log which database is being used (helpful for debugging)
    if (req.authUser && notionAuthState?.databaseId && notionAuthState.accessToken) {
      const userDbId = notionAuthState.databaseId;
      const userAccessToken = notionAuthState.accessToken;
      console.log(`Checking user's Notion database access`);

      // Verify the database is still accessible with user's token
      // This catches stale sessions where the user revoked access or database was deleted
      try {
        const { Client } = await import("@notionhq/client");
        const userClient = new Client({ auth: userAccessToken });
        await userClient.databases.retrieve({ database_id: userDbId });
        // Create request-scoped storage with user's credentials
        res.locals.notionStorage = createNotionStorage(userDbId, userAccessToken);
      } catch (error: any) {
        console.log(`User database lookup failed: ${error.code || error.message}`);

        // Don't immediately fall back to guest mode - try to find the user's database
        try {
          // Use the access token to search for their existing database
          const foundDatabaseId = await duplicateTemplateDatabaseToUserWorkspace(userAccessToken);

          if (foundDatabaseId) {
            // Save the mapping for future reference
            saveDatabaseIdForWorkspace(req.authUser.id, foundDatabaseId, notionAuthState.workspaceName);

            // Create request-scoped storage with found database
            res.locals.notionStorage = createNotionStorage(foundDatabaseId, userAccessToken);
          } else {
            throw new Error('No database found or created');
          }
        } catch (searchError: any) {
          console.log(`Could not find/create database for authenticated user: ${searchError.message}`);
          return res.status(409).json({
            error: 'Notion database unavailable',
            message: 'Please reconnect your Notion account',
          });
        }
      }
    } else if (req.session.databaseId && req.session.accessToken) {
      // Legacy fallback path while session-based auth is still being phased out.
      res.locals.notionStorage = createNotionStorage(req.session.databaseId, req.session.accessToken);
    } else {
      if (req.authUser) {
        return res.status(409).json({
          error: 'Notion account not linked',
          message: 'Please complete Notion authorization to access your coffee entries',
        });
      }

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
      // Prefer Cloudinary if configured
      if (cloudinaryStorageService.isConfigured()) {
        const uploadURL = await cloudinaryStorageService.getUploadURL();
        res.json({ uploadURL });
      } else {
        // Fallback to local storage
        const uploadURL = await localStorageService.getUploadURL();
        res.json({ uploadURL });
      }
    } catch (error) {
      console.error("Error generating upload URL:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to generate upload URL", details: errorMessage });
    }
  });

  // Local file upload endpoint
  app.put("/api/local-upload/:fileId", requireAuth, async (req, res) => {
    try {
      const { fileId } = req.params;
      const contentType = normalizeContentType(req.headers['content-type']);

      if (!isValidUploadFileId(fileId)) {
        return res.status(400).json({ error: "Invalid upload identifier" });
      }
      if (!ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
        return res.status(415).json({ error: "Unsupported media type" });
      }

      const buffer = await readUploadBuffer(req);
      const fileUrl = await localStorageService.saveFile(fileId, buffer, contentType);
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
        return res.status(413).json({ error: "File too large" });
      }
      if (error instanceof Error && error.message === "REQUEST_ABORTED") {
        return res.status(400).json({ error: "Upload aborted" });
      }
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Cloudinary upload endpoint
  app.put("/api/cloudinary-upload/:fileId", requireAuth, async (req, res) => {
    try {
      const { fileId } = req.params;
      const contentType = normalizeContentType(req.headers['content-type']);

      if (!isValidUploadFileId(fileId)) {
        return res.status(400).json({ error: "Invalid upload identifier" });
      }
      if (!ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
        return res.status(415).json({ error: "Unsupported media type" });
      }

      const buffer = await readUploadBuffer(req);
      const fileUrl = await cloudinaryStorageService.saveFile(fileId, buffer, contentType);
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Error in Cloudinary upload endpoint:", error);
      if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
        return res.status(413).json({ error: "File too large" });
      }
      if (error instanceof Error && error.message === "REQUEST_ABORTED") {
        return res.status(400).json({ error: "Upload aborted" });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to upload file", details: errorMessage });
    }
  });

  // Serve local files
  app.get("/api/local-files/:filename", async (req, res) => {
    try {
      const { filename } = req.params;

      if (!localStorageService.isSafeUploadFilename(filename)) {
        return res.status(400).json({ error: "Invalid filename" });
      }

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
      console.log("Creating coffee entry");

      // Validate request body
      const validatedData = insertCoffeeEntrySchema.parse(req.body);
      // Normalize photo URLs if they're presigned URLs
      const frontPhotoUrl = objectStorageService.normalizeObjectEntityPath(validatedData.frontPhotoUrl);
      const backPhotoUrl = validatedData.backPhotoUrl
        ? objectStorageService.normalizeObjectEntityPath(validatedData.backPhotoUrl)
        : null;

      // Generate Google Maps Place URL
      const placeUrl = generatePlaceUrl(validatedData);

      const storage = getStorage(res);
      const entry = await storage.createCoffeeEntry({
        ...validatedData,
        frontPhotoUrl,
        backPhotoUrl,
        placeUrl,
      });

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

  if (process.env.NODE_ENV !== "production") {
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
  }

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
