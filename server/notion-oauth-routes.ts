import type { Express } from "express";
import { duplicateTemplateDatabaseToUserWorkspace, getNotionUser } from "./notion-oauth";
import { optionalAuth, requireAuth } from "./middleware/auth";
import {
  clearUserNotionAuthState,
  saveUserNotionAuthState,
} from "./notion-auth-state";
import {
  deleteNotionConnection,
  upsertNotionConnection,
} from "./supabase-mirror";

/**
 * Register auth routes powered by Supabase identity + Notion provider token linking.
 */
export function registerNotionOAuthRoutes(app: Express) {
  /**
   * Link a Supabase-authenticated user to Notion using provider token.
   * POST /api/auth/notion/link-provider-token
   */
  app.post("/api/auth/notion/link-provider-token", requireAuth, async (req, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Supabase auth required" });
      }

      const providerToken = req.body?.providerToken;
      if (!providerToken || typeof providerToken !== "string") {
        return res.status(400).json({ error: "Provider token is required" });
      }

      const notionUser = await getNotionUser(providerToken);
      const databaseId = await duplicateTemplateDatabaseToUserWorkspace(providerToken);

      const workspaceName =
        ("name" in notionUser && typeof notionUser.name === "string" ? notionUser.name : undefined) ||
        "Notion Workspace";

      const state = saveUserNotionAuthState({
        userId: req.authUser.id,
        accessToken: providerToken,
        databaseId,
        workspaceName,
        isOwner: false,
      });

      await upsertNotionConnection(req.authUser.id, state);

      return res.json({
        success: true,
        workspaceName,
        databaseId,
        isOwner: false,
      });
    } catch (error) {
      console.error("Error linking Notion provider token:", error);
      return res.status(500).json({ error: "Failed to link Notion account" });
    }
  });

  /**
   * Get auth state for the current Supabase user.
   * GET /api/auth/me
   */
  app.get("/api/auth/me", optionalAuth, (req, res) => {
    if (!req.authUser) {
      return res.json({ authenticated: false });
    }

    if (!req.notionAuthState) {
      return res.json({
        authenticated: true,
        notionLinked: false,
        isOwner: false,
      });
    }

    return res.json({
      authenticated: true,
      notionLinked: true,
      workspaceName: req.notionAuthState.workspaceName,
      databaseId: req.notionAuthState.databaseId,
      isOwner: req.notionAuthState.isOwner || false,
    });
  });

  /**
   * Unlink Notion connection from current user.
   * POST /api/auth/notion/unlink
   */
  app.post("/api/auth/notion/unlink", requireAuth, async (req, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Supabase auth required" });
      }

      clearUserNotionAuthState(req.authUser.id);
      await deleteNotionConnection(req.authUser.id);

      return res.json({ success: true });
    } catch (error) {
      console.error("Error unlinking Notion account:", error);
      return res.status(500).json({ error: "Failed to unlink Notion account" });
    }
  });

  /**
   * Logout state cleanup.
   * POST /api/auth/logout
   */
  app.post("/api/auth/logout", optionalAuth, (req, res) => {
    if (req.authUser) {
      clearUserNotionAuthState(req.authUser.id);
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });
}
