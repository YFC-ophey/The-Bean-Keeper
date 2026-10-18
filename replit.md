# The Bean Keeper workspace notes

This repository is a React, Vite, and Express coffee journal. Coffee entries are stored as Notion pages. Supabase Auth handles Notion sign-in and Supabase tables hold the user's Notion connection, a coffee-entry mirror, and sync events. Groq structures OCR text from uploaded coffee bag photos.

## Development

Run `npm install`, copy `.env.example` to `.env`, configure Supabase and Notion using [SUPABASE_SETUP.md](SUPABASE_SETUP.md), then run `npm run dev`. The default local port is 5001. `npm run check` validates TypeScript and `npm run build` creates the client and server bundles.

## Key paths

- `client/src/` — React UI, localization, OCR, and Supabase browser client.
- `server/index.ts` and `server/routes.ts` — Express entry and API routes.
- `server/notion.ts` — canonical Notion page operations.
- `server/supabase.ts` and `server/supabase-mirror.ts` — Supabase admin client and mirror.
- `server/groq.ts` — AI extraction.
- `shared/schema.ts` — coffee entry types and validation.
- `migrations/` — Supabase schema and profile trigger.

Render deployment settings are in `render.yaml`; see [DEPLOYMENT.md](DEPLOYMENT.md). Configure `VITE_` variables before the build and keep the service role key on the server.
