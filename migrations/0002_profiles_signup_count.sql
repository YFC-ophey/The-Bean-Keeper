-- Keep one profile row for every registered Supabase Auth user.
-- Run after 0001_supabase_auth_mirror.sql. Safe to rerun.

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_profile_for_auth_user() from public;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
