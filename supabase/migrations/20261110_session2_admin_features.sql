-- Session 2 admin features (MISSING-TASKS Section A):
--   blog cover_url, testimonial rating/source (public submissions),
--   admins TOTP columns (2FA gate), newsletter_subscribers, audit_log,
--   visitor_events + analytics aggregate views.
-- Idempotent: safe to run more than once.

-- 1) Blog cover image (the codebase table is `posts`, not blog_posts).
alter table public.posts add column if not exists cover_url text;

-- 2) Testimonials: public submissions carry a rating + source marker.
alter table public.testimonials add column if not exists rating smallint;
alter table public.testimonials add column if not exists source text;

-- 3) Two-factor login (TOTP) state on admins. The secret is stored server
--    side; only its sha256 session token hash ever lives in a cookie.
--    Normalize legacy `admins (user_id)` shapes first (mirrors 20261109 so
--    this file also works standalone).
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
update public.admins a
set email = u.email
from auth.users u
where u.id = a.id and (a.email is null or a.email = '');
alter table public.admins add column if not exists totp_secret text;
alter table public.admins add column if not exists totp_enabled boolean not null default false;
alter table public.admins add column if not exists totp_session_hash text;

-- 4) Inbox messages. Lives in the Stage 0 initial schema, but some live
--    databases were set up without it — ensure it exists so the inbox and
--    (future) contact form have their table.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.messages enable row level security;
-- No public policies: the future contact form writes through a secured
-- server action using the service role; the admin reads the same way.

-- 5) Newsletter subscribers. No anon/authenticated policies on purpose:
--    every write happens server-side through the service role.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  locale text not null default 'en',
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create unique index if not exists newsletter_subscribers_email_lower_key
  on public.newsletter_subscribers (lower(email));
alter table public.newsletter_subscribers enable row level security;

-- 6) Audit log (ensure it exists even if the Stage 0 schema predates it).
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text not null,
  entity_type text,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
-- The Stage 0 table predates the user_email convenience column.
alter table public.audit_log add column if not exists user_email text;
create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);
-- No policies: admin reads go through the service role only.

-- 7) Visitor events (first-party analytics: no cookies for tracking beyond
--    a rotating session id, no raw IP stored, country from Vercel geo).
create table if not exists public.visitor_events (
  id bigint generated always as identity primary key,
  session_id text not null,
  page_path text not null,
  page_title text,
  referrer text,
  country text,
  device_type text,
  theme text,
  effects_on boolean,
  created_at timestamptz not null default now()
);
alter table public.visitor_events enable row level security;
create index if not exists visitor_events_created_at_idx
  on public.visitor_events (created_at desc);
create index if not exists visitor_events_page_path_idx
  on public.visitor_events (page_path);
-- No policies: inserts happen in the secured /api/track route handler.

-- 8) Analytics aggregate views, read by /admin/analytics via the service role.
create or replace view public.analytics_daily as
  select (created_at at time zone 'UTC')::date as day,
         count(distinct session_id)::int as visitors,
         count(*)::int as views
  from public.visitor_events
  group by 1
  order by 1;

create or replace view public.analytics_top_pages as
  select page_path,
         count(distinct session_id)::int as visitors,
         count(*)::int as views
  from public.visitor_events
  group by page_path
  order by views desc
  limit 20;

create or replace view public.analytics_countries as
  select coalesce(nullif(country, ''), 'Unknown') as country,
         count(distinct session_id)::int as visitors
  from public.visitor_events
  group by 1
  order by visitors desc
  limit 20;

create or replace view public.analytics_devices as
  select coalesce(nullif(device_type, ''), 'Unknown') as device_type,
         count(distinct session_id)::int as visitors
  from public.visitor_events
  group by 1
  order by visitors desc;

create or replace view public.analytics_referrers as
  select coalesce(nullif(referrer, ''), 'Direct / none') as referrer,
         count(distinct session_id)::int as visitors
  from public.visitor_events
  group by 1
  order by visitors desc
  limit 20;

grant select on public.analytics_daily, public.analytics_top_pages,
  public.analytics_countries, public.analytics_devices,
  public.analytics_referrers to service_role;
