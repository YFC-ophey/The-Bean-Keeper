# Supabase + Notion Setup

## 1. Configure Supabase Auth Provider
1. Open Supabase Dashboard -> Authentication -> Providers.
2. Enable `Notion` provider.
3. Add Notion OAuth Client ID and Secret.
4. Set redirect URL to your app callback URL.

## 2. Configure Environment Variables
Use `.env.example` as reference and set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

## 3. Apply Mirror Schema
Run the SQL in:
- `migrations/0001_supabase_auth_mirror.sql`

This creates:
- `profiles`
- `notion_connections`
- `coffee_entries_mirror`
- `sync_events`
with row-level security policies by `auth.uid() = user_id`.

## 4. Runtime Flow
1. Frontend logs in using Supabase Notion social auth.
2. Frontend sends provider token to `/api/auth/notion/link-provider-token`.
3. Backend resolves or creates user Notion database and stores linkage.
4. Coffee entry CRUD writes to Notion and mirrors to Supabase.
5. Reconciliation endpoints:
   - `POST /api/sync/notion-to-supabase`
   - `POST /api/sync/reconcile`
