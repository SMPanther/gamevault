-- Run this in Supabase → SQL Editor (once).
-- Creates a profile row automatically when a new auth user is created (bypasses RLS safely).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  uname text := lower(trim(coalesce(meta->>'username', '')));
  dname text := trim(coalesce(meta->>'name', ''));
  rcode text := upper(trim(coalesce(meta->>'recovery_code', 'GAMEVAULT-PENDING')));
begin
  if uname = '' then
    uname := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;
  if dname = '' then
    dname := split_part(coalesce(new.email, 'user'), '@', 1);
  end if;

  insert into public.profiles (
    id, username, name, email, avatar, role,
    steam_verified, has_seen_onboarding, recovery_code, banned
  )
  values (
    new.id,
    uname,
    dname,
    lower(coalesce(new.email, '')),
    upper(substr(dname, 1, 2)),
    'user',
    false,
    false,
    rcode,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
