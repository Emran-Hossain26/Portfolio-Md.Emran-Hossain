-- Admin RBAC for the new auth guard (requireAdmin → rpc("is_admin")).
-- Idempotent: safe to run more than once.

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

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
