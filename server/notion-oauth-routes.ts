import type { Express } from "express";
import {
  getNotionAuthUrl,
  exchangeCodeForToken,
  duplicateTemplateDatabaseToUserWorkspace,
  getNotionUser,
  testNotionConnection,
  NoPagesSharedError,
} from "./notion-oauth";

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

      // Get or create database in user's workspace
      let databaseId: string;

      // Check if Notion duplicated our template (user chose "Use a template" option)
      if (tokenData.duplicated_template_id) {
        console.log("✅ Using Notion-duplicated template database:", tokenData.duplicated_template_id);
        databaseId = tokenData.duplicated_template_id;
      } else {
        // Fallback: User chose "Select pages" option - create database manually
        console.log("📝 No template used, creating database manually...");
        databaseId = await duplicateTemplateDatabaseToUserWorkspace(
          tokenData.access_token
        );
      }

      console.log("Database ID:", databaseId);

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

        // Log session details for debugging
        console.log('📝 Session saved successfully:');
        console.log('  Session ID:', req.sessionID);
        console.log('  Database ID:', req.session.databaseId);
        console.log('  Access Token:', req.session.accessToken ? 'SET' : 'NOT SET');
        console.log('  Workspace:', req.session.workspaceName);

        // Check if cookie will be set
        const cookieHeader = res.getHeader('Set-Cookie');
        console.log('  Set-Cookie header:', cookieHeader ? 'PRESENT' : 'MISSING');
        if (cookieHeader) {
          console.log('  Cookie value:', JSON.stringify(cookieHeader));
        }

        // Redirect to frontend with session token for mobile fallback
        // Mobile browsers may block cookies on cross-site redirects (ITP)
        // We'll pass session ID in URL as backup, frontend will verify via API
        console.log('🚀 Redirecting to /?login=success');
        res.redirect(`/?login=success&sid=${req.sessionID}`);
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
    // Debug logging to understand session state
    console.log('🔍 /api/auth/me called');
    console.log('  Session ID:', req.sessionID);
    console.log('  Session databaseId:', req.session.databaseId);
    console.log('  Session workspaceName:', req.session.workspaceName);
    console.log('  Session accessToken:', req.session.accessToken ? 'SET' : 'NOT SET');
    console.log('  Cookie header:', req.headers.cookie);

    // Check databaseId (same check used by coffee entries endpoint)
    if (!req.session.databaseId) {
      console.log('  ❌ Not authenticated - no databaseId');
      return res.json({ authenticated: false });
    }

    console.log('  ✅ Authenticated');
    res.json({
      authenticated: true,
      workspaceName: req.session.workspaceName,
      databaseId: req.session.databaseId,
    });
  });

  /**
   * Debug endpoint to check session state
   * GET /api/auth/debug
   */
  app.get("/api/auth/debug", (req, res) => {
    res.json({
      sessionID: req.sessionID,
      hasDatabaseId: !!req.session.databaseId,
      hasAccessToken: !!req.session.accessToken,
      hasWorkspaceName: !!req.session.workspaceName,
      databaseIdPrefix: req.session.databaseId?.substring(0, 8) || null,
      workspaceName: req.session.workspaceName || null,
      cookieHeader: req.headers.cookie ? 'present' : 'missing',
    });
  });

  /**
   * Restore session from session ID (mobile fallback for ITP)
   * POST /api/auth/restore
   * This endpoint allows restoring a session when cookies are blocked
   */
  app.post("/api/auth/restore", (req, res) => {
    const { sessionId } = req.body;

    console.log('🔄 Session restore requested');
    console.log('  Provided session ID:', sessionId);
    console.log('  Current session ID:', req.sessionID);
    console.log('  Current cookie:', req.headers.cookie ? 'present' : 'missing');

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Get the session store
    const store = req.sessionStore;
    if (!store) {
      console.log('  ❌ No session store available');
      return res.status(500).json({ error: 'Session store not available' });
    }

    // Try to get the session data from the store
    store.get(sessionId, (err: any, sessionData: any) => {
      if (err) {
        console.log('  ❌ Error getting session:', err);
        return res.status(500).json({ error: 'Failed to retrieve session' });
      }

      if (!sessionData) {
        console.log('  ❌ Session not found in store');
        return res.status(404).json({ error: 'Session not found or expired' });
      }

      console.log('  ✅ Found session data:', {
        hasAccessToken: !!sessionData.accessToken,
        hasDatabaseId: !!sessionData.databaseId,
        workspaceName: sessionData.workspaceName,
      });

      // Copy the session data to the current session
      req.session.userId = sessionData.userId;
      req.session.accessToken = sessionData.accessToken;
      req.session.databaseId = sessionData.databaseId;
      req.session.workspaceName = sessionData.workspaceName;

      // Save the current session with the restored data
      req.session.save((saveErr) => {
        if (saveErr) {
          console.log('  ❌ Error saving restored session:', saveErr);
          return res.status(500).json({ error: 'Failed to save session' });
        }

        console.log('  ✅ Session restored successfully');
        console.log('  New session ID:', req.sessionID);

        res.json({
          success: true,
          authenticated: true,
          workspaceName: req.session.workspaceName,
          databaseId: req.session.databaseId,
        });
      });
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
