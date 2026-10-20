# Supabase and Notion setup

The Bean Keeper uses Supabase Auth for Notion sign-in. Notion remains the source of truth for coffee entries. Supabase stores the user's Notion connection, a coffee-entry mirror, and sync events.

## 1. Create a Supabase project

Create a project in the [Supabase Dashboard](https://supabase.com/dashboard). Record its project URL, public anon key, and service role key from **Project Settings → API**. Keep the service role key on the server only. Never use it in a `VITE_` variable or commit it to Git.

Under **Authentication → URL Configuration**, set the app's production URL as the Site URL and add each allowed local and production return URL to the redirect allow list. For local development with the default port, use `http://localhost:5001/**`. For Render, add the deployed app URL with `/**`.

## 2. Configure Notion sign-in

Create a **public** Notion integration with permission to read the user's email and access the pages or databases needed by the app. In its Redirect URIs, enter the callback displayed under **Supabase → Authentication → Sign In / Providers → Notion**:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Enable Notion in the Supabase provider settings and enter the Notion integration's OAuth client ID and secret there. The Notion integration callback goes to Supabase; the app's URL goes in Supabase's redirect allow list. See the [Supabase Notion provider guide](https://supabase.com/docs/guides/auth/social-login/auth-notion) for the current dashboard steps.

## 3. Apply the database migration

In **Supabase → SQL Editor**, run [`migrations/0001_supabase_auth_mirror.sql`](migrations/0001_supabase_auth_mirror.sql) once, then [`migrations/0002_profiles_signup_count.sql`](migrations/0002_profiles_signup_count.sql), then [`migrations/0003_service_role_data_api_grants.sql`](migrations/0003_service_role_data_api_grants.sql), against the intended project. Review the project selection before running them. The first migration creates `profiles`, `notion_connections`, `coffee_entries_mirror`, and `sync_events`, with row-level security policies scoped by `auth.uid() = user_id`. The second migration creates a profile row for each new Auth user and backfills existing users. The third exposes only the tables and operations needed by the backend service role to the Data API; it does not grant access to `anon` or `authenticated`. Do not paste a service role key into the SQL editor. Migrations are not applied by this repository's build or deploy command.

Verify the four tables and their policies in **Database → Tables**. The service role key bypasses RLS, so only the backend may hold it. Back up any existing tables before adapting this initial migration to an already populated project.

To see the total number of registered users, run `select count(*) from public.profiles;` in the privileged SQL Editor. This count does not expose email addresses. Ordinary signed-in users are restricted by the `profiles` row-level security policy and cannot query the workspace-wide total through the client.

## 4. Set environment variables

Copy [`.env.example`](.env.example) to `.env` locally. Configure:

| Variable | Used by |
| --- | --- |
| `SUPABASE_URL` | Backend Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend database and token verification |
| `VITE_SUPABASE_URL` | Frontend Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend public anon key |
| `GEMINI_API_KEY` | Server-only Gemini photo scanning; manual entry works without it |
| `OWNER_SUPABASE_USER_ID` | Verified Supabase Auth user UUID allowed to edit the existing owner collection |

`NOTION_API_KEY` and `NOTION_DATABASE_ID` remain on the server for the existing owner collection and public guest reads. The owner mapping requires both variables plus `OWNER_SUPABASE_USER_ID`. The backend compares that UUID only with a verified Supabase access token; an email address, request body, or OAuth provider token cannot grant owner access. The owner Notion key is never saved as a user connection in Supabase. `NOTION_TEMPLATE_DATABASE_ID` is optional for the Notion database creation flow. The Notion OAuth client ID and secret belong in Supabase provider settings; they are not app environment variables.

For an existing owner collection, enroll the intended owner through a configured local or preview build before deploying this branch. Configure the frontend Supabase URL and anon key and an allowed return URL, but intentionally leave the preview backend's `SUPABASE_SERVICE_ROLE_KEY` unset for this first OAuth sign-in. Supabase will create the Auth user; the preview app may report that linking failed because its backend cannot verify the session, and it cannot run the ordinary provider-token link route or create another database. The current live app uses direct Notion OAuth; its login does not create a Supabase Auth user. In **Supabase → Authentication → Users**, verify the new account and copy its exact user UUID into Render's `OWNER_SUPABASE_USER_ID`. Confirm `NOTION_API_KEY` and `NOTION_DATABASE_ID` still point to the existing collection before configuring the backend service role key and deploying this branch. A verified owner with an incomplete Notion configuration receives a 503 instead of entering the ordinary linking flow.

For Render, set all four Supabase variables in the service environment **before building**. Vite embeds `VITE_` variables into the client bundle during `npm run build`; changing them requires a rebuild. The service role key must never have a `VITE_` prefix.

## 5. Verify the app

Run `npm install`, `npm run check`, and `npm run build`, then start the app with `npm run dev`. Sign in with Notion, grant page access, and verify `/api/auth/me` reports an authenticated and linked user. Create a test coffee entry and confirm the Notion page appears in `coffee_entries_mirror`. Run the protected sync endpoint if an existing Notion collection needs a mirror backfill. Inspect `sync_events` for errors.

Coffee writes go to Notion first. Mirror failures are logged and can be repaired with the sync endpoints; they should not lose the canonical Notion entry.
