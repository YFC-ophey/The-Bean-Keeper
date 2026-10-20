# The Bean Keeper development guide

## What the app does

The Bean Keeper is a React and Express coffee journal. Users can enter coffee details manually or choose to scan bag photos with Gemini 3.5 Flash-Lite, review the suggestions, and save a coffee entry in Notion. Scanning starts only when the user clicks the scan button. The interface supports English and Traditional Chinese.

## Commands

```bash
npm install
npm run dev       # Express + Vite on PORT, default 5001
npm run check     # TypeScript
npm run build     # Vite client and bundled server
npm start         # Run the production bundle
```

## Architecture

- **Identity:** Supabase Auth signs users in through the Notion social provider. The browser holds the Supabase session and sends its access token as `Authorization: Bearer <token>` to protected Express endpoints. The server validates the token with Supabase before using the authenticated user ID.
- **Notion access:** After sign-in, the browser sends the Notion provider token to `POST /api/auth/notion/link-provider-token`. The server finds or creates that user's coffee database and persists the Notion token and database ID in `public.notion_connections`. `server/notion-auth-state.ts` caches the connection in memory; Supabase restores it after a process restart. The browser must not receive the server's service role key.
- **Coffee data:** Notion pages are the canonical entries. `server/notion.ts` handles page operations, and `shared/schema.ts` defines the `CoffeeEntry` shape. A guest can read the configured owner collection when `NOTION_API_KEY` and `NOTION_DATABASE_ID` are set; writes require an authenticated and linked user.
- **Mirror:** `server/supabase-mirror.ts` maps coffee fields to `public.coffee_entries_mirror` after Notion writes and records results in `public.sync_events`. Mirror failures are logged and can be repaired with protected sync endpoints. `public.profiles` tracks registered Supabase Auth users. The schema and row-level security policies live in `migrations/`.
- **Photos:** Cloudinary is the persistent production option. Local photo storage is available for development. A Google Cloud Storage integration remains for older object paths.
- **Photo scan:** The Add Coffee form sends the selected front and optional back photo to authenticated `POST /api/scan-coffee-photos` on an explicit click. The server calls Gemini 3.5 Flash-Lite using server-only `GEMINI_API_KEY` and returns suggestions for review; manual entry remains available. Google says free-tier API data may be used to improve its products.
- **UI:** React 18, Vite, TanStack Query, Wouter, Tailwind, shadcn/ui, and i18next. The server uses Express, the Notion SDK, and Supabase JS.

## Important files

| Path | Purpose |
| --- | --- |
| `server/index.ts` | Express entry point and middleware |
| `server/middleware/auth.ts` | Supabase bearer token verification and Notion connection recovery |
| `server/notion-oauth-routes.ts` | Notion token linking, unlinking, and auth status |
| `server/routes.ts` | Coffee, upload, Gemini scan, health, and sync endpoints |
| `server/gemini.ts` | Gemini photo scan request and response validation |
| `server/notion.ts` | Notion database and page operations |
| `server/notion-auth-state.ts` | In-memory Notion connection cache |
| `server/supabase.ts` | Supabase admin client and access token verification |
| `server/supabase-mirror.ts` | Mirror writes, reads, and audit events |
| `client/src/context/AuthContext.tsx` | Browser auth state and Notion provider linking |
| `client/src/lib/supabase.ts` | Browser Supabase client using public variables |
| `client/src/lib/queryClient.ts` | API request handling |
| `shared/schema.ts` | Coffee entry types and validation |
| `migrations/` | Supabase schema and signup profile trigger |

## Auth and data flow

1. The browser starts Supabase `signInWithOAuth({ provider: 'notion' })` and receives a Supabase session after the redirect.
2. The browser passes the Notion provider token to the backend linking endpoint. The backend verifies the Supabase bearer token, resolves the user's Notion database, and stores the connection in Supabase.
3. Authenticated requests send the Supabase access token. The middleware loads the corresponding Notion connection from cache or Supabase.
4. Coffee writes update Notion first. Mirror writes then update Supabase. A mirror error must not be reported as a failed Notion write.
5. `POST /api/sync/notion-to-supabase` backfills mirror rows; `POST /api/sync/reconcile` checks drift. Both require authentication.

Relevant routes: `GET /api/auth/me`, `POST /api/auth/notion/link-provider-token`, `POST /api/auth/notion/unlink`, `POST /api/auth/logout`, `GET/POST /api/coffee-entries`, `GET/PATCH/DELETE /api/coffee-entries/:id`, `GET /api/scan-options`, `POST /api/scan-coffee-photos`, `POST /api/upload-url`, and `GET /api/health`.

## Environment and deployment

Copy `.env.example` to `.env` locally. Required for authenticated operation:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-key>
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
GEMINI_API_KEY=<server-only-google-ai-studio-key>
```

The Notion OAuth client ID and secret are configured in the Supabase Dashboard. `GEMINI_API_KEY` is required for AI photo scanning, but manual coffee entry works without it. Optional variables cover the guest Notion collection, Cloudinary, Google Maps, analytics, and support link; see `.env.example`.

On Render, set both `VITE_` variables before the build because Vite embeds them in the browser bundle. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Apply the SQL migrations separately in Supabase, in numeric order. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) and [DEPLOYMENT.md](DEPLOYMENT.md). A build or deployment does not apply migrations.

## Conventions

- Preserve `CoffeeEntry` field names in application code and map them explicitly to snake_case mirror columns.
- Keep Notion as the source of truth. Report explicit sync errors without losing valid Notion writes.
- Do not expose Notion provider tokens or Supabase service role credentials to the browser or logs.
- Verify source and behavior before updating this guide; archived troubleshooting notes are not a description of the active auth path.
