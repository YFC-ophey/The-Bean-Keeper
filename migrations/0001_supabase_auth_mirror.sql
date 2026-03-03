-- Supabase auth + Notion mirror schema

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notion_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notion_access_token text not null,
  notion_database_id text not null,
  workspace_name text,
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coffee_entries_mirror (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  notion_page_id text not null,
  roaster_name text not null,
  roaster_location text,
  roaster_address text,
  roaster_website text,
  place_url text,
  farm text,
  origin text,
  variety text,
  process_method text,
  roast_level text,
  roast_date text,
  flavor_notes jsonb,
  rating integer,
  tasting_notes text,
  weight text,
  price text,
  purchase_again boolean not null default false,
  front_photo_url text,
  back_photo_url text,
  source_updated_at timestamptz,
  mirrored_at timestamptz,
  sync_status text not null default 'in_sync',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, notion_page_id)
);

create table if not exists public.sync_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  notion_page_id text,
  direction text not null,
  result text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.notion_connections enable row level security;
alter table public.coffee_entries_mirror enable row level security;
alter table public.sync_events enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notion connections
create policy "notion_connections_select_own"
  on public.notion_connections for select
  using (auth.uid() = user_id);

create policy "notion_connections_insert_own"
  on public.notion_connections for insert
  with check (auth.uid() = user_id);

create policy "notion_connections_update_own"
  on public.notion_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Mirror entries
create policy "coffee_entries_mirror_select_own"
  on public.coffee_entries_mirror for select
  using (auth.uid() = user_id);

create policy "coffee_entries_mirror_insert_own"
  on public.coffee_entries_mirror for insert
  with check (auth.uid() = user_id);

create policy "coffee_entries_mirror_update_own"
  on public.coffee_entries_mirror for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "coffee_entries_mirror_delete_own"
  on public.coffee_entries_mirror for delete
  using (auth.uid() = user_id);

-- Sync events
create policy "sync_events_select_own"
  on public.sync_events for select
  using (auth.uid() = user_id);

create policy "sync_events_insert_own"
  on public.sync_events for insert
  with check (auth.uid() = user_id);
