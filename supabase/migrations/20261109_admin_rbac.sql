-- Admin RBAC for the new auth guard (requireAdmin → rpc("is_admin")).
-- Idempotent: safe to run more than once.
-- Shape-tolerant: some live databases created `admins (user_id)` in an
-- earlier session — normalize it to (id, email) before is_admin() is
-- (re)created, otherwise the function body referencing a.id fails to build.

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- Backfill: legacy `admins (user_id)` table → add id/email and copy over.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admins' and column_name = 'user_id'
  ) then
    alter table public.admins add column if not exists id uuid;
    update public.admins set id = user_id where id is null;
    create unique index if not exists admins_id_key on public.admins (id);
  end if;
end $$;

alter table public.admins add column if not exists email text;

-- Fill email from auth.users where it is missing.
update public.admins a
set email = u.email
from auth.users u
where u.id = a.id and (a.email is null or a.email = '');

alter table public.admins enable row level security;

-- Admins can see their own membership row.
drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row"
  on public.admins for select
  using (auth.uid() = id);

-- Decisive check used by requireAdmin(). SECURITY DEFINER so the policy
-- above cannot recurse; only service role / definer writes.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid());
$$;

revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- Seed the owner account by email (public contact address). No-op when the
-- auth user has not been created yet — re-run after creating it.
insert into public.admins (id, email)
select u.id, u.email
from auth.users u
where u.email = 'engremran.it@gmail.com'
on conflict (id) do nothing;
