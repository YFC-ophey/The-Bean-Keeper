# The Bean Keeper workspace notes

This repository is a React, Vite, and Express coffee journal. Coffee entries are stored as Notion pages. Supabase Auth handles Notion sign-in and Supabase tables hold the user's Notion connection, a coffee-entry mirror, and sync events. Signed-in users can select bag photos and click **Scan with Gemini** to receive coffee-field suggestions from Gemini 3.5 Flash-Lite; manual entry remains available.

## Development

Run `npm install`, copy `.env.example` to `.env`, configure Supabase and Notion using [SUPABASE_SETUP.md](SUPABASE_SETUP.md), then run `npm run dev`. The default local port is 5001. `npm run check` validates TypeScript and `npm run build` creates the client and server bundles.

## Key paths

- `client/src/` — React UI, localization, scan form, and Supabase browser client.
- `server/index.ts` and `server/routes.ts` — Express entry and API routes.
- `server/notion.ts` — canonical Notion page operations.
- `server/supabase.ts` and `server/supabase-mirror.ts` — Supabase admin client and mirror.
- `server/gemini.ts` — Gemini photo scan request and response validation.
- `shared/schema.ts` — coffee entry types and validation.
- `migrations/` — Supabase schema and profile trigger.

Render deployment settings are in `render.yaml`; see [DEPLOYMENT.md](DEPLOYMENT.md). Configure `VITE_` variables before the build and keep the Supabase service role key and `GEMINI_API_KEY` on the server. Gemini scanning sends selected photos to Google only when the user clicks the scan button. Google says free-tier API data may be used to improve its products.
