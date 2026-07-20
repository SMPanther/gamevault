-- Run in Supabase → SQL Editor after reviewing existing policies.
-- If you already have policies with the same names, DROP them first or rename these.

alter table public.profiles enable row level security;

-- Read your own profile (fixes "incomplete account" if SELECT was blocked)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Upsert from app right after sign-up (when session exists)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Add a unique constraint on username if missing (registration duplicate protection when RLS hides rows):
-- alter table public.profiles add constraint profiles_username_key unique (username);
