# Render deployment quick start

1. Complete [SUPABASE_SETUP.md](SUPABASE_SETUP.md): create the Supabase project, configure Notion sign-in, and apply migrations `0001` then `0002`.
2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` in Render before building. Set server-only `GEMINI_API_KEY` to enable coffee photo scanning; users can enter coffee details manually without it. Keep the service role key and Gemini key out of `VITE_` variables. Add Cloudinary credentials if production photo uploads are needed.
3. Connect the GitHub repository to Render and use [render.yaml](render.yaml), or set the build command to `npm install && npm run build` and start command to `npm start`.
4. Verify `/api/health`, sign in with Notion, and test a coffee entry and its Supabase mirror row. With `GEMINI_API_KEY` set, select a front photo, click the Gemini scan button, review the suggestions, and apply only the fields you want.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full variable table and troubleshooting. The build does not apply SQL migrations, and `VITE_` variables require a rebuild when changed.
