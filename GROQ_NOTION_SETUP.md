# Groq and Notion setup

This guide covers the current AI extraction and Notion storage paths. For Supabase Auth, the Notion social provider, and the mirror migration, follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Groq extraction

Set `GROQ_API_KEY` in `.env` locally and in Render for production. The browser uses Tesseract.js to read text from a coffee bag photo, then sends text to `POST /api/extract-coffee-info` with a Supabase bearer token. The server asks Groq to structure the text; the user reviews the result before saving.

Run `npx tsx test-groq.ts` for a direct local extraction check. The API endpoint requires an authenticated user.

## Notion storage

Supabase signs the user in through Notion. After sign-in, the app links the Notion provider token with `POST /api/auth/notion/link-provider-token`. The server finds or creates that user's coffee database. Coffee entries are saved as Notion pages; Notion page IDs are the application entry IDs.

`NOTION_API_KEY` and `NOTION_DATABASE_ID` are optional for the guest-facing owner collection and internal utilities. They do not replace Supabase Notion sign-in for user collections.

## Mirror and repair

Every authenticated coffee write updates Notion first, then mirrors the entry to Supabase. The mirror is for recovery and analytics. To backfill or repair an existing collection, use these authenticated endpoints with a Supabase bearer token:

- `POST /api/sync/notion-to-supabase` — write current Notion entries into the mirror.
- `POST /api/sync/reconcile` — compare Notion and mirror state and repair drift.

Check the endpoint response, `sync_events`, and server logs for errors. The schema is in `migrations/0001_supabase_auth_mirror.sql`; the registration profile trigger is in `migrations/0002_profiles_signup_count.sql`. Apply both in Supabase before relying on the mirror.
