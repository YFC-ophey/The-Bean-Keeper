import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Stores Notion OAuth tokens for each user
 * Each user gets their own access token and workspace database
 */
export const notionAuth = pgTable("notion_auth", {
  // User identifier (could be email, user ID from auth system, etc.)
  userId: text("user_id").primaryKey(),

  // Notion OAuth tokens
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  botId: text("bot_id").notNull(), // Primary key for Notion bot

  // Workspace information
  workspaceId: text("workspace_id"),
  workspaceName: text("workspace_name"),
  workspaceIcon: text("workspace_icon"),

  // User's personal database ID (duplicated from template)
  databaseId: text("database_id").notNull(),

  // OAuth metadata
  scope: text("scope"), // Permissions granted
  tokenType: text("token_type").default("bearer"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Token expiration if applicable
});

export type NotionAuth = typeof notionAuth.$inferSelect;
export type InsertNotionAuth = typeof notionAuth.$inferInsert;
