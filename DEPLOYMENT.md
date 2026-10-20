# Deploy The Bean Keeper to Render

This app builds a Vite frontend and an Express backend in one Render web service. Notion stores the canonical coffee entries; Supabase handles authentication and the mirror. Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md) before the first deploy.

## Before deploying

1. Create a Supabase project and configure the Notion social provider. Register `https://<project-ref>.supabase.co/auth/v1/callback` in the public Notion integration. Add the Render app URL to Supabase's redirect allow list.
2. Apply `migrations/0001_supabase_auth_mirror.sql` and then `migrations/0002_profiles_signup_count.sql` in the intended Supabase project. The Render build does not run migrations.
3. Set up Cloudinary for persistent production photos, if uploads are needed. Local files on a web service are not persistent storage.
4. Run `npm run check` and `npm run build` locally and resolve blocking failures before pushing.

## Create or update the Render service

The repository includes [render.yaml](render.yaml) with the Node service, `npm install && npm run build`, `npm start`, and `/api/health`. Connect the GitHub repository to Render, use the blueprint or equivalent service settings, and set these environment variables in Render **before the build**:

| Variable | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | For Gemini photo scanning | Server secret; manual entry works without it |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server secret; never prefix with `VITE_` |
| `VITE_SUPABASE_URL` | Yes | Public project URL, embedded in browser bundle |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key, embedded in browser bundle |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | Render service port, configured in `render.yaml` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For persistent photos | Set together |
| `NOTION_API_KEY`, `NOTION_DATABASE_ID` | For guest collection | Optional internal integration and owner database |
| `NOTION_TEMPLATE_DATABASE_ID` | For template duplication | Optional |
| `VITE_GOOGLE_MAPS_API_KEY` | For embedded maps | Optional public key |
| `VITE_GA_MEASUREMENT_ID`, `VITE_BUY_ME_A_COFFEE_URL` | For analytics or support link | Optional public values |

The `VITE_` variables are read during `npm run build`; changing them requires a new build. Other secrets are read by the backend at runtime. Keep `.env` out of Git.

## Verify

1. Check `https://<your-render-host>/api/health` and the Render build/runtime logs.
2. Sign in through Notion and verify the user is linked at `/api/auth/me`.
3. Create, update, and delete a test coffee entry. Check the Notion page and the Supabase `coffee_entries_mirror` row.
4. Inspect `sync_events` for failures. Use `POST /api/sync/notion-to-supabase` for an existing collection that needs a mirror backfill.
5. With `GEMINI_API_KEY` set, select a front photo, click the Gemini scan button, review and apply the suggestions, then test a photo upload if Cloudinary is configured. A scan sends the selected front and optional back photo to Google only after the user clicks.

If sign-in fails, check the Notion callback URL, Supabase redirect allow list, and the four Supabase variables. If Notion writes work but the mirror is missing, check the migration, service role key, and server logs. A failed mirror write does not remove a valid Notion entry.
