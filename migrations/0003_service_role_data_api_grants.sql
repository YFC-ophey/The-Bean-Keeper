-- New Supabase projects can leave public tables unexposed to the Data API.
-- The app accesses these tables through its backend with the service role key.
-- Do not grant anon or authenticated access: notion_connections stores OAuth tokens.

grant select, insert, update, delete
  on table public.notion_connections, public.coffee_entries_mirror
  to service_role;

grant insert
  on table public.sync_events
  to service_role;
