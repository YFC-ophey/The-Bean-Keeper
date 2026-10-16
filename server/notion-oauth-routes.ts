import type { Express } from "express";
import * as crypto from "crypto";
import {
  getNotionAuthUrl,
  exchangeCodeForToken,
  duplicateTemplateDatabaseToUserWorkspace,
  getNotionUser,
  testNotionConnection,
  NoPagesSharedError,
  createUserNotionClient,
} from "./notion-oauth";
import { getDatabaseIdForWorkspace, saveDatabaseIdForWorkspace } from "./user-database-mapping";

const OWNER_DATABASE_ID = process.env.NOTION_DATABASE_ID?.trim();

function normalizeNotionId(id?: string | null): string | null {
  return id ? id.replace(/-/g, '') : null;
}

function isOwnerDatabaseId(id?: string | null): boolean {
  if (!OWNER_DATABASE_ID || !id) return false;
  return normalizeNotionId(id) === normalizeNotionId(OWNER_DATABASE_ID);
}

/**
 * Rate limiting state for auth endpoints
 * Simple in-memory rate limiter (resets on server restart)
 */
const rateLimitState = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const state = rateLimitState.get(ip);

  if (!state || now > state.resetTime) {
    rateLimitState.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (state.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  state.count++;
  return true;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to avoid timing leak on length
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

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
      // Generate a cryptographically secure random state for CSRF protection
      const state = crypto.randomBytes(16).toString('hex');

      // Store state in session for verification on callback
      req.session.oauthState = state;

      req.session.save((err) => {
        if (err) {
          console.error("Failed to save OAuth state to session:", err);
          return res.status(500).json({ error: "Failed to initiate OAuth" });
        }

        const authUrl = getNotionAuthUrl(state);
        res.redirect(authUrl);
      });
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

      // Verify CSRF state token
      const expectedState = req.session.oauthState;
      if (!expectedState || !state || typeof state !== "string" || !safeCompare(state, expectedState)) {
        console.error("CSRF state mismatch:", { received: state, expected: expectedState ? "present" : "missing" });
        return res.redirect(`/?login=error`);
      }

      // Clear the used state to prevent replay attacks
      if (expectedState) {
        delete req.session.oauthState;
      }

      // Exchange code for access token
      const tokenData = await exchangeCodeForToken(code);

      console.log("Token exchange successful for Notion OAuth callback");

      // Get or create database in user's workspace
      let databaseId: string;

      // FIRST: Check if we have a stored database ID for this workspace (re-login case)
      let storedDatabaseId = getDatabaseIdForWorkspace(tokenData.workspace_id);
      if (storedDatabaseId && isOwnerDatabaseId(storedDatabaseId)) {
        console.log("⚠️ Stored database is owner's DB; ignoring for OAuth user");
        storedDatabaseId = null;
      }
      if (storedDatabaseId) {
        console.log("🔍 Found stored database ID for workspace:", storedDatabaseId);

        // Verify database is still accessible with user's new token
        const notion = createUserNotionClient(tokenData.access_token);
        try {
          await notion.databases.retrieve({ database_id: storedDatabaseId });
          console.log("✅ Stored database still accessible, reusing it");
          databaseId = storedDatabaseId;
        } catch (error) {
          console.log("⚠️ Stored database not accessible, will search/create new one");
          // Fall through to create/search logic below
          if (tokenData.duplicated_template_id) {
            console.log("✅ Using Notion-duplicated template database:", tokenData.duplicated_template_id);
            databaseId = tokenData.duplicated_template_id;
          } else {
            console.log("📝 No template used, creating database manually...");
            databaseId = await duplicateTemplateDatabaseToUserWorkspace(tokenData.access_token);
          }
        }
      } else if (tokenData.duplicated_template_id && !isOwnerDatabaseId(tokenData.duplicated_template_id)) {
        // Check if Notion duplicated our template (user chose "Use a template" option)
        console.log("✅ Using Notion-duplicated template database:", tokenData.duplicated_template_id);
        databaseId = tokenData.duplicated_template_id;
      } else {
        if (tokenData.duplicated_template_id && isOwnerDatabaseId(tokenData.duplicated_template_id)) {
          console.log("⚠️ Duplicated template resolved to owner's DB; creating new database instead");
        }
        // Fallback: User chose "Select pages" option - create database manually
        console.log("📝 No template used, creating database manually...");
        databaseId = await duplicateTemplateDatabaseToUserWorkspace(
          tokenData.access_token
        );
      }

      // ALWAYS persist the mapping for future re-logins
      saveDatabaseIdForWorkspace(tokenData.workspace_id, databaseId, tokenData.workspace_name);

      console.log("Resolved user database for workspace");

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

        console.log('Session saved successfully, redirecting after OAuth login');
        res.redirect('/?login=success');
      });

    } catch (error: any) {
      console.error("Error in Notion OAuth callback:", error);

      // Check for specific error types
      if (error instanceof NoPagesSharedError) {
        console.log("🔴 User did not share any pages during OAuth authorization");
        // Redirect with specific error code so frontend can show helpful message
        return res.redirect(`/?login=no_pages`);
      }

      res.redirect(`/?login=error`);
    }
  });

  /**
   * Check if user is authenticated
   * GET /api/auth/me
   */
  app.get("/api/auth/me", (req, res) => {
    // Check databaseId (same check used by coffee entries endpoint)
    if (!req.session.databaseId) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      workspaceName: req.session.workspaceName,
      databaseId: req.session.databaseId,
      isOwner: req.session.isOwner || false,
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
   * NOTE: This endpoint is for legacy migration only and not used in OAuth flow
   */
  app.post("/api/export/notion", async (_req, res) => {
    try {
      // This endpoint is deprecated - with OAuth, each user has their own database
      // No need to export from a shared database anymore
      res.status(410).json({
        error: "Export endpoint is deprecated",
        message: "With OAuth authentication, each user automatically gets their own isolated database"
      });
    } catch (error: any) {
      console.error("Error in export endpoint:", error);
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
   * Owner password login bypass
   * POST /api/auth/owner
   * Allows owner to login with a password instead of OAuth
   */
  app.post("/api/auth/owner", async (req, res) => {
    try {
      const { password } = req.body;
      const ownerPassword = process.env.OWNER_PASSWORD;
      const ownerDatabaseId = process.env.NOTION_DATABASE_ID?.trim();
      const ownerApiKey = process.env.NOTION_API_KEY;

      if (!ownerPassword) {
        console.log("❌ OWNER_PASSWORD not configured");
        return res.status(500).json({ error: "Owner login not configured" });
      }

      // Rate limit password attempts
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp)) {
        console.log("❌ Rate limit exceeded for owner login from:", clientIp);
        return res.status(429).json({ error: "Too many attempts. Please try again later." });
      }

      // Use timing-safe comparison to prevent timing attacks
      if (!password || typeof password !== "string" || !safeCompare(password, ownerPassword)) {
        console.log("❌ Invalid owner password attempt");
        return res.status(401).json({ error: "Invalid password" });
      }

      if (!ownerDatabaseId || !ownerApiKey) {
        console.log("❌ Owner database or API key not configured");
        return res.status(500).json({ error: "Owner database not configured" });
      }

      console.log("✅ Owner password verified, creating session...");

      // Store in session - use owner's credentials
      req.session.userId = "owner";
      req.session.accessToken = ownerApiKey;
      req.session.databaseId = ownerDatabaseId;
      req.session.workspaceName = "Owner";
      req.session.isOwner = true;

      // Save session
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }

        console.log("✅ Owner session created successfully");
        res.json({
          success: true,
          authenticated: true,
          workspaceName: "Owner",
          databaseId: ownerDatabaseId,
          isOwner: true,
        });
      });
    } catch (error: any) {
      console.error("Error in owner login:", error);
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
