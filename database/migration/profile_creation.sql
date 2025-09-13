-- =========================
-- 1) Role enum
-- =========================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin','staff','user');
  end if;
end $$;

-- =========================
-- 2) Profiles table
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'user',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

-- =========================
-- 3) Auto-update updated_at on UPDATE
-- =========================
create extension if not exists moddatetime with schema extensions;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure extensions.moddatetime(updated_at);

-- =========================
-- 4) Grants (no RLS, so we must grant privileges)
-- NOTE: This allows any signed-in user to read and update profiles (including role).
-- OK for demos; lock down for production.
-- =========================
grant select, update on public.profiles to authenticated;

-- If you want users to ONLY change display_name (NOT role), use column-level grants instead:
-- revoke update on public.profiles from authenticated;
-- grant update(display_name) on public.profiles to authenticated;

-- =========================
-- 5) Signup trigger: seed profile + apply role from user metadata
--    Reads raw_user_meta_data.initial_role ('user'|'staff'|'admin'), defaults to 'user'
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := (new.raw_user_meta_data->>'initial_role');
  coerced_role public.user_role;
begin
  if meta_role is null or meta_role not in ('user','staff','admin') then
    coerced_role := 'user';
  else
    coerced_role := meta_role::public.user_role;
  end if;

  insert into public.profiles (id, role)
  values (new.id, coerced_role);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
