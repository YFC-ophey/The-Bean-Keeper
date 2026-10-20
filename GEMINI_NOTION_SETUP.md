# Gemini and Notion setup

This guide covers photo scanning and Notion storage. For Supabase Auth, the Notion social provider, and the mirror migration, follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Gemini photo scan

Create a Gemini API key in Google AI Studio and set `GEMINI_API_KEY` in the server's local `.env` or Render environment. Keep the key out of Git and out of `VITE_` variables. It is required for AI photo scanning; coffee details can still be entered manually when no key is configured.

In Add Coffee, selecting a front photo starts a scan automatically. An optional back photo is included if already selected; adding or changing a photo can start a fresh scan. The authenticated `POST /api/scan-coffee-photos` route sends the selected photos to Google's `gemini-3.5-flash-lite` model. Review its suggestions before applying them to the form, then check the fields before saving. Existing manual edits are preserved. Coffee details can be entered manually without a successful scan, but saving still requires a front photo.

The endpoint requires Supabase authentication, accepts JPEG, PNG, WebP, HEIC, and HEIF, and limits each photo to 10 MB and both photos together to 12 MB for Gemini's inline image request. Google says free-tier API data may be used to improve its products, so the form discloses photo transmission before selection. Automatic scanning is unavailable when `GEMINI_API_KEY` is absent. Test several real bags before relying on extracted details without review.

## Notion storage

Supabase signs the user in through Notion. After sign-in, the app links the Notion provider token with `POST /api/auth/notion/link-provider-token`. The server finds or creates that user's coffee database. Coffee entries are saved as Notion pages; Notion page IDs are the application entry IDs.

`NOTION_API_KEY` and `NOTION_DATABASE_ID` are optional for the guest-facing owner collection and internal utilities. They do not replace Supabase Notion sign-in for user collections.

## Mirror and repair

Every authenticated coffee write updates Notion first, then mirrors the entry to Supabase. The mirror is for recovery and analytics. To backfill or repair an existing collection, use these authenticated endpoints with a Supabase bearer token:

- `POST /api/sync/notion-to-supabase` — write current Notion entries into the mirror.
- `POST /api/sync/reconcile` — compare Notion and mirror state and repair drift.

Check the endpoint response, `sync_events`, and server logs for errors. The schema is in `migrations/0001_supabase_auth_mirror.sql`; the registration profile trigger is in `migrations/0002_profiles_signup_count.sql`. Apply both in Supabase before relying on the mirror.
