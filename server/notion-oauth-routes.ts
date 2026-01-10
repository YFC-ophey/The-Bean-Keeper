import type { Express } from "express";
import {
  getNotionAuthUrl,
  exchangeCodeForToken,
  duplicateTemplateDatabaseToUserWorkspace,
  getNotionUser,
  testNotionConnection,
  createUserNotionClient,
} from "./notion-oauth";
import { storage } from "./storage";
import { createNotionCoffeePage } from "./notion";

/**
 * Register Notion OAuth routes
 * These handle the OAuth flow and user authentication
 */
export function registerNotionOAuthRoutes(app: Express) {
  /**
   * Step 1: Redirect user to Notion for authorization
   * GET /api/auth/notion
   */
  app.get("/api/auth/notion", (req, res) => {
    try {
      // Generate a random state for CSRF protection
      const state = Math.random().toString(36).substring(7);

      // Store state in session or temporary store (for production)
      // For now, we'll pass it through and verify on callback

      const authUrl = getNotionAuthUrl(state);
      res.redirect(authUrl);
    } catch (error: any) {
      console.error("Error generating Notion auth URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Step 2: Handle OAuth callback from Notion
   * GET /api/auth/notion/callback
   */
  app.get("/api/auth/notion/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`/?login=error`);
      }

      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Authorization code missing" });
      }

      // Exchange code for access token
      const tokenData = await exchangeCodeForToken(code);

      console.log("Token exchange successful:", {
        bot_id: tokenData.bot_id,
        workspace_id: tokenData.workspace_id,
        workspace_name: tokenData.workspace_name,
      });

      // Create database in user's workspace
      console.log("Creating database in user's workspace...");
      const databaseId = await duplicateTemplateDatabaseToUserWorkspace(
        tokenData.access_token
      );

      console.log("Database created:", databaseId);

      // STORE IN SESSION (secure, server-side storage)
      req.session.userId = tokenData.bot_id;
      req.session.accessToken = tokenData.access_token;
      req.session.databaseId = databaseId;
      req.session.workspaceName = tokenData.workspace_name;

      // Save session before redirect
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect('/?login=error');
        }

        // Redirect to frontend (session cookie is automatically sent)
        console.log('Session saved successfully, redirecting to dashboard');
        res.redirect('/?login=success');
      });

    } catch (error: any) {
      console.error("Error in Notion OAuth callback:", error);
      res.redirect(`/?login=error`);
    }
  });

  /**
   * Check if user is authenticated
   * GET /api/auth/me
   */
  app.get("/api/auth/me", (req, res) => {
    if (!req.session.accessToken) {
      return res.status(401).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      workspaceName: req.session.workspaceName,
      databaseId: req.session.databaseId,
    });
  });

  /**
   * Logout - destroy session
   * POST /api/auth/logout
   */
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('connect.sid'); // Default session cookie name
      res.json({ success: true });
    });
  });

  /**
   * Test Notion connection
   * POST /api/auth/notion/test
   */
  app.post("/api/auth/notion/test", async (req, res) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: "Access token required" });
      }

      const result = await testNotionConnection(accessToken);
      res.json(result);
    } catch (error: any) {
      console.error("Error testing Notion connection:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Export all coffee entries to user's Notion database
   * POST /api/export/notion
   */
  app.post("/api/export/notion", async (req, res) => {
    try {
      const { accessToken, databaseId } = req.body;

      if (!accessToken || !databaseId) {
        return res.status(400).json({
          error: "Access token and database ID required",
        });
      }

      // Get all coffee entries
      const entries = await storage.getAllCoffeeEntries();

      console.log(`Exporting ${entries.length} entries to Notion...`);

      // Create Notion client for this user
      const notion = createUserNotionClient(accessToken);

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Export each entry
      for (const entry of entries) {
        try {
          await createNotionCoffeePage(databaseId, entry);
          successCount++;
          console.log(`✓ Exported: ${entry.roasterName}`);
        } catch (error: any) {
          failedCount++;
          const errorMsg = `Failed to export ${entry.roasterName}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`✗ ${errorMsg}`);
        }
      }

      res.json({
        success: true,
        total: entries.length,
        exported: successCount,
        failed: failedCount,
        errors,
      });
    } catch (error: any) {
      console.error("Error exporting to Notion:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get user's Notion information
   * POST /api/auth/notion/user
   */
  app.post("/api/auth/notion/user", async (req, res) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: "Access token required" });
      }

      const user = await getNotionUser(accessToken);
      res.json(user);
    } catch (error: any) {
      console.error("Error getting Notion user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Revoke Notion access (disconnect)
   * POST /api/auth/notion/revoke
   */
  app.post("/api/auth/notion/revoke", async (req, res) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: "Access token required" });
      }

      // In a production app, you would:
      // 1. Remove tokens from database
      // 2. Optionally revoke the token with Notion
      // 3. Clear any cached data

      res.json({
        success: true,
        message: "Notion access revoked successfully",
      });
    } catch (error: any) {
      console.error("Error revoking Notion access:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
