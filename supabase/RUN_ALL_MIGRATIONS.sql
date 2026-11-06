-- ============================================================
-- RUN_ALL_MIGRATIONS — paste this whole file into Supabase
-- SQL Editor and Run. Safe to re-run (every part idempotent).
-- Recreates any Stage 0/1 tables your live DB is missing.
-- Bundles: 20250105, 20261105, 20261106, 20261107, 20261108,
--          20261109 (shape-aware seed), 20261110, 20261111.
-- ============================================================

-- ============================================================
-- 20250105_stage1_content_tables.sql
-- ============================================================
-- ============================================================================
-- Stage 1: Dynamic Content Management — new content tables + RLS + seed
-- Run this in the Supabase SQL Editor AFTER 20250104_initial_schema.sql
-- Idempotent: safe to re-run.
-- ============================================================================

-- ---------- services (Expertise/Services cards) ----------
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL DEFAULT '',
  title_bn text NOT NULL DEFAULT '',
  desc_en text NOT NULL DEFAULT '',
  desc_bn text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',          -- SVG icon name or url
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS services_sort_idx ON services(sort_order) WHERE deleted_at IS NULL;

-- ---------- skills ----------
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  level int NOT NULL DEFAULT 50,         -- 0..100
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS skills_sort_idx ON skills(sort_order) WHERE deleted_at IS NULL;

-- ---------- certifications ----------
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL DEFAULT '',
  title_bn text NOT NULL DEFAULT '',
  issuer_en text NOT NULL DEFAULT '',
  issuer_bn text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS certifications_sort_idx ON certifications(sort_order) WHERE deleted_at IS NULL;

-- ---------- faqs ----------
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  q_en text NOT NULL DEFAULT '',
  q_bn text NOT NULL DEFAULT '',
  a_en text NOT NULL DEFAULT '',
  a_bn text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS faqs_sort_idx ON faqs(sort_order) WHERE deleted_at IS NULL;

-- ---------- stats (proof in numbers) ----------
CREATE TABLE IF NOT EXISTS stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  label_bn text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stats_sort_idx ON stats(sort_order) WHERE deleted_at IS NULL;

-- ---------- social_links ----------
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  label_bn text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_links_sort_idx ON social_links(sort_order) WHERE deleted_at IS NULL;

-- ---------- contact_info (single row, key='main') ----------
CREATE TABLE IF NOT EXISTS contact_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE DEFAULT 'main',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  location_en text NOT NULL DEFAULT '',
  location_bn text NOT NULL DEFAULT '',
  availability_en text NOT NULL DEFAULT '',
  availability_bn text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- media_assets ----------
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'media',
  path text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  alt_en text NOT NULL DEFAULT '',
  alt_bn text NOT NULL DEFAULT '',
  mime_type text NOT NULL DEFAULT '',
  size_bytes bigint NOT NULL DEFAULT 0,
  width int,
  height int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_assets_created_idx ON media_assets(created_at DESC);

-- ---------- RLS ----------
ALTER TABLE services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats           ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info    ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets    ENABLE ROW LEVEL SECURITY;

-- Public read (published only, not soft-deleted)
DROP POLICY IF EXISTS services_public_read ON services;
CREATE POLICY services_public_read ON services FOR SELECT TO anon, authenticated
  USING (published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS skills_public_read ON skills;
CREATE POLICY skills_public_read ON skills FOR SELECT TO anon, authenticated
  USING (published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS certifications_public_read ON certifications;
CREATE POLICY certifications_public_read ON certifications FOR SELECT TO anon, authenticated
  USING (published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS faqs_public_read ON faqs;
CREATE POLICY faqs_public_read ON faqs FOR SELECT TO anon, authenticated
  USING (published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS stats_public_read ON stats;
CREATE POLICY stats_public_read ON stats FOR SELECT TO anon, authenticated
  USING (published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS social_links_public_read ON social_links;
CREATE POLICY social_links_public_read ON social_links FOR SELECT TO anon, authenticated
  USING (published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS contact_info_public_read ON contact_info;
CREATE POLICY contact_info_public_read ON contact_info FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS media_assets_public_read ON media_assets;
CREATE POLICY media_assets_public_read ON media_assets FOR SELECT TO anon, authenticated
  USING (true);

-- Admin write (authenticated users only; role check enforced in app via requireAdmin + service client)
DROP POLICY IF EXISTS services_admin_write ON services;
CREATE POLICY services_admin_write ON services FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS skills_admin_write ON skills;
CREATE POLICY skills_admin_write ON skills FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS certifications_admin_write ON certifications;
CREATE POLICY certifications_admin_write ON certifications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS faqs_admin_write ON faqs;
CREATE POLICY faqs_admin_write ON faqs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS stats_admin_write ON stats;
CREATE POLICY stats_admin_write ON stats FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS social_links_admin_write ON social_links;
CREATE POLICY social_links_admin_write ON social_links FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS contact_info_admin_write ON contact_info;
CREATE POLICY contact_info_admin_write ON contact_info FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS media_assets_admin_write ON media_assets;
CREATE POLICY media_assets_admin_write ON media_assets FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ---------- Storage buckets ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- Seed data ----------
-- Services (Expertise cards)
INSERT INTO services (title_en, title_bn, desc_en, desc_bn, icon, sort_order, published) VALUES
  ('IT Infrastructure', 'আইটি ইনফ্রাস্ট্রাকচার', 'Windows Server, Active Directory, Linux administration, backup and monitoring.', 'Windows Server, Active Directory, লিনাক্স অ্যাডমিনিস্ট্রেশন, ব্যাকআপ ও মনিটরিং।', 'server', 1, true),
  ('Cybersecurity & Cloud', 'সাইবার সিকিউরিটি ও ক্লাউড', 'Hardening, access control, network defence and secure cloud setups.', 'হার্ডেনিং, অ্যাক্সেস কন্ট্রোল, নেটওয়ার্ক নিরাপত্তা ও নিরাপদ ক্লাউড সেটআপ।', 'shield', 2, true),
  ('Networking', 'নেটওয়ার্কিং', 'LAN design, firewalls, VPN, multi-floor office networks.', 'ল্যান ডিজাইন, ফায়ারওয়াল, VPN, মাল্টি-ফ্লোর অফিস নেটওয়ার্ক।', 'network', 3, true),
  ('Full Stack with AI', 'এআই-সহ ফুল স্ট্যাক', 'PHP, TypeScript and modern web apps built faster with AI tooling.', 'PHP, TypeScript এবং এআই টুলিংয়ে দ্রুত তৈরি আধুনিক ওয়েব অ্যাপ।', 'code', 4, true)
ON CONFLICT DO NOTHING;

-- Skills
INSERT INTO skills (name, category, level, sort_order, published) VALUES
  ('Windows Server', 'infrastructure', 95, 1, true),
  ('Active Directory', 'infrastructure', 90, 2, true),
  ('Linux', 'infrastructure', 85, 3, true),
  ('Networking (LAN/VPN/Firewall)', 'infrastructure', 85, 4, true),
  ('TypeScript', 'development', 80, 5, true),
  ('React / Next.js', 'development', 75, 6, true),
  ('PHP', 'development', 70, 7, true),
  ('Supabase / PostgreSQL', 'development', 75, 8, true),
  ('Cloud Security', 'security', 80, 9, true),
  ('Docker', 'devops', 65, 10, true)
ON CONFLICT DO NOTHING;

-- Stats
INSERT INTO stats (value, label_en, label_bn, sort_order, published) VALUES
  ('5+', 'Years with servers & networks', 'বছর সার্ভার ও নেটওয়ার্কে', 1, true),
  ('20+', 'Systems administered', 'সিস্টেম অ্যাডমিনিস্টার করা', 2, true),
  ('10+', 'Projects delivered', 'প্রজেক্ট সম্পন্ন', 3, true),
  ('24/7', 'Monitoring mindset', 'মনিটরিং মাইন্ডসেট', 4, true)
ON CONFLICT DO NOTHING;

-- FAQs
INSERT INTO faqs (q_en, q_bn, a_en, a_bn, sort_order, published) VALUES
  ('What do you help businesses with?', 'আপনি ব্যবসায়িক প্রতিষ্ঠানকে কী কাজে সাহায্য করেন?',
   'Windows Server and Active Directory environments, Linux servers, LAN/firewall/VPN design, cloud security hardening, backups and monitoring — plus full-stack web applications with AI assistance.',
   'Windows Server ও Active Directory, Linux সার্ভার, LAN/ফায়ারওয়াল/VPN ডিজাইন, ক্লাউড সিকিউরিটি, ব্যাকআপ ও মনিটরিং — এবং AI সহায়তায় ফুল-স্ট্যাক ওয়েব অ্যাপ্লিকেশন।', 1, true),
  ('Where are you based, and do you work remotely?', 'আপনি কোথায় অবস্থিত, এবং রিমোটলি কাজ করেন?',
   'I am based in Dhaka, Bangladesh, and I work both on-site (Dhaka area) and remotely with clients anywhere.',
   'আমি ঢাকা, বাংলাদেশে অবস্থিত; ঢাকায় অন-সাইট এবং যেকোনো জায়গা থেকে রিমোটলি কাজ করি।', 2, true),
  ('Can I see something you have built that is live?', 'আপনার বানানো লাইভ কোনো কিছু দেখা যাবে?',
   'Yes — Likhon Tools (likhontools.com) is a live production project. The case studies on this site list more work.',
   'হ্যাঁ — Likhon Tools (likhontools.com) একটি লাইভ প্রোডাকশন প্রজেক্ট। এই সাইটের কেস স্টাডিগুলোতে আরও কাজ দেখুন।', 3, true),
  ('How do we start working together?', 'কাজ শুরু করব কীভাবে?',
   'Email engremran.it@gmail.com or use the contact form with a short brief — you will get a reply with next steps.',
   'engremran.it@gmail.com-এ ইমেইল করুন বা সংক্ষিপ্ত বিবরণ নিয়ে যোগাযোগ ফর্ম ব্যবহার করুন — পরবর্তী ধাপসহ উত্তর পাবেন।', 4, true)
ON CONFLICT DO NOTHING;

-- Social links
INSERT INTO social_links (platform, url, label_en, label_bn, sort_order, published) VALUES
  ('github', 'https://github.com/Emran-Hossain26', 'GitHub', 'গিটহাব', 1, true),
  ('linkedin', 'https://bd.linkedin.com/in/mohammad-emran-hossain-69198b75', 'LinkedIn', 'লিঙ্কডইন', 2, true),
  ('facebook', 'https://www.facebook.com/emran1997/', 'Facebook', 'ফেসবুক', 3, true)
ON CONFLICT DO NOTHING;

-- Contact info (single row)
INSERT INTO contact_info (key, email, phone, location_en, location_bn, availability_en, availability_bn)
VALUES ('main', 'engremran.it@gmail.com', '+8801924437817',
        'Dhaka, Bangladesh', 'ঢাকা, বাংলাদেশ',
        'Available for new projects & consultations', 'নতুন প্রজেক্ট ও কনসালটেশনের জন্য উন্মুক্ত')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 20261105_stage2_blog_columns.sql
-- ============================================================
-- ============================================================================
-- Stage 2: Blog enhancements — new columns on posts
-- Run after 20250104_initial_schema.sql (and 20250105_stage1_content_tables.sql)
-- Idempotent: safe to re-run.
-- ============================================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title_en text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title_bn text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_desc_en text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_desc_bn text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count int NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_scheduled_idx ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_tags_idx ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS posts_categories_idx ON posts USING GIN(categories);

-- Backfill status from published flag for existing rows
UPDATE posts SET status = CASE WHEN published THEN 'published' ELSE 'draft' END WHERE status IS NULL OR status = '';

-- RLS (already enabled on posts from 20250104; ensure anon reads only published)
-- (existing policy posts_public_read already filters published=true; add status filter)
DROP POLICY IF EXISTS posts_public_read ON posts;
CREATE POLICY posts_public_read ON posts FOR SELECT TO anon, authenticated
  USING (published = true AND status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= now()));

-- Admin write (already exists; recreate for safety)
DROP POLICY IF EXISTS posts_admin_write ON posts;
CREATE POLICY posts_admin_write ON posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);


-- ============================================================
-- 20261106_stage25_view_counter.sql
-- ============================================================
-- ============================================================================
-- Stage 2.5: Atomic view counter function (SECURITY DEFINER)
-- Run after 20261105_stage2_blog_columns.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_post_views(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
     SET view_count = view_count + 1
   WHERE slug = p_slug
     AND status = 'published';
END;
$$;

-- Revoke direct execution from anon/authenticated; only service role + SECURITY DEFINER callers
REVOKE ALL ON FUNCTION public.increment_post_views(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_post_views(text) TO service_role;


-- ============================================================
-- 20261107_stage42_theme_presets.sql
-- ============================================================
-- ============================================================================
-- Stage 4.2: Complete theme presets (add sunset, forest, ocean, high-contrast)
-- and theme_visitor_switch setting. Idempotent.
-- Do NOT edit old migrations; this is additive.
-- ============================================================================

-- Backfill: the table is defined in the Stage 0 initial schema, but some
-- live databases never ran that file — without this CREATE the INSERTs
-- below fail with 42P01 and (the SQL Editor runs one transaction) roll back
-- the entire migration batch.
create table if not exists public.theme_presets (
  id uuid primary key default gen_random_uuid(),
  name_en text unique not null,
  name_bn text not null default '',
  is_default boolean not null default false,
  is_enabled boolean not null default true,
  colors jsonb not null default '{}'::jsonb,
  fonts jsonb not null default '{}'::jsonb,
  radius jsonb not null default '{}'::jsonb,
  shadows jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add the 4 missing presets (Ocean, Sunset, Forest, High Contrast)
INSERT INTO theme_presets (name_en, name_bn, is_default, is_enabled, colors, fonts, radius, shadows, sort_order) VALUES
  ('Ocean', 'ওশান', false, true, '{"accent":"#0E9AA7","bg":"#0A1929","panel":"#0F2744","ink":"#E0F0FF","mute":"#7BA8D4","line":"#1E3A5F","radius":"12px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"12px","button":"12px"}', '{"card":"0 4px 14px rgba(14,154,167,0.2)"}', 6),
  ('Sunset', 'সানসেট', false, true, '{"accent":"#FF7A59","bg":"#1C0F1F","panel":"#2A1630","ink":"#FFEBDD","mute":"#D0A9B8","line":"#4A2A55","radius":"18px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"18px","button":"18px"}', '{"card":"0 4px 14px rgba(255,122,89,0.2)"}', 7),
  ('Forest', 'ফরেস্ট', false, true, '{"accent":"#1F7A4A","bg":"#EEF3EC","panel":"#fff","ink":"#14261B","mute":"#4F6657","line":"#D3E0D3","radius":"12px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"12px","button":"12px"}', '{"card":"0 4px 14px rgba(31,122,74,0.15)"}', 8),
  ('High Contrast', 'হাই কনট্রাস্ট', false, true, '{"accent":"#FFFF00","bg":"#000000","panel":"#000000","ink":"#FFFFFF","mute":"#E6E6E6","line":"#FFFFFF","radius":"0px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"0px","button":"0px"}', '{"card":"0 4px 14px rgba(255,255,0,0.3)"}', 9)
ON CONFLICT (name_en) DO UPDATE SET
  name_bn = EXCLUDED.name_bn,
  is_enabled = EXCLUDED.is_enabled,
  colors = EXCLUDED.colors,
  fonts = EXCLUDED.fonts,
  radius = EXCLUDED.radius,
  shadows = EXCLUDED.shadows,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Ensure exactly one default (Light)
UPDATE theme_presets SET is_default = false WHERE name_en != 'Light';
UPDATE theme_presets SET is_default = true WHERE name_en = 'Light';

-- theme_visitor_switch setting (default true)
INSERT INTO site_settings (key, value)
VALUES ('theme_visitor_switch', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 20261108_stage43_bn_slug_project_og.sql
-- ============================================================
-- Stage 4.3 — Localized (Bangla) slugs for posts + per-project OG images.
-- Idempotent: safe to run more than once.
-- Run in Supabase SQL Editor AFTER 20250105, 20261105, 20261106 and 20261107.

-- 1) Optional Bangla slug for posts. Empty/NULL falls back to `slug`.
alter table public.posts
  add column if not exists bn_slug text;

comment on column public.posts.bn_slug is
  'Optional Bangla URL slug. /bn/blog/<bn_slug> when set; /bn/blog/<slug> still resolves.';

-- One non-empty bn_slug per row (partial unique index, NULLs exempt).
create unique index if not exists posts_bn_slug_key
  on public.posts (bn_slug)
  where bn_slug is not null and bn_slug <> '';

-- 2) Per-project social share image (absolute URL or storage path).
alter table public.projects
  add column if not exists og_image text;

comment on column public.projects.og_image is
  'Optional OG/Twitter share image for the project page. Falls back to the site default.';


-- ============================================================
-- 20261109_admin_rbac.sql
-- ============================================================
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
-- Shape-aware: legacy `admins (user_id ...)` tables keep their NOT NULL
-- user_id filled (and the pre-existing row is UPDATED, not re-inserted —
-- user_id is usually that table's primary key, so a plain INSERT would
-- violate it).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admins' and column_name = 'user_id'
  ) then
    insert into public.admins (id, email, user_id)
    select u.id, u.email, u.id
    from auth.users u
    where u.email = 'engremran.it@gmail.com'
    on conflict (id) do update
      set email = excluded.email,
          user_id = coalesce(public.admins.user_id, excluded.user_id);
    update public.admins set user_id = id where user_id is null;
  else
    insert into public.admins (id, email)
    select u.id, u.email
    from auth.users u
    where u.email = 'engremran.it@gmail.com'
    on conflict (id) do nothing;
  end if;
end $$;


-- ============================================================
-- 20261110_session2_admin_features.sql
-- ============================================================
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


-- ============================================================
-- 20261111_stage0_backfill.sql
-- ============================================================
-- Session 2 backfill: Stage 0 tables that some live databases are missing
-- (the initial-schema file was never fully applied there). All idempotent,
-- shapes copied from 20250104_initial_schema.sql. RLS stays OFF to match
-- the Stage 0 tables the app already reads with the anon key (redirects in
-- proxy.ts, feature_flags in cms.ts, profiles unused by app code).

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_url text not null unique,
  to_url text not null,
  permanent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  role text not null default 'viewer' check (role in ('super_admin','editor','viewer')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Home-page section order/enablement lives here; seeded with the same
-- content as the Stage 0 schema (on conflict keeps existing rows).
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  sort_order int not null default 0,
  enabled boolean not null default true,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into sections (key, sort_order, enabled, content) values
  ('hero', 1, true, '{"en":{"heading":"I build and secure the systems your business runs on.","intro":"Md Emran Hossain: IT infrastructure and cybersecurity engineer, and AI-assisted full stack developer in Dhaka. Servers, networks, cloud and web applications, end to end."},"bn":{"heading":"আপনার ব্যবসা যে সিস্টেমের ওপর চলে, আমি সেটা বানাই আর সুরক্ষিত রাখি।","intro":"মো. ইমরান হোসাইন: ঢাকার আইটি ইনফ্রাস্ট্রাকচার ও সাইবারসিকিউরিটি ইঞ্জিনিয়ার এবং এআই-সহায়ক ফুল স্ট্যাক ডেভেলপার। সার্ভার, নেটওয়ার্ক, ক্লাউড আর ওয়েব অ্যাপ, শুরু থেকে শেষ পর্যন্ত।"}}'),
  ('expertise', 2, true, '{"en":{"title":"What I do","items":[{"title":"IT Infrastructure","desc":"Windows Server, Active Directory, Linux administration, backup and monitoring."},{"title":"Cybersecurity & Cloud","desc":"Hardening, access control, network defence and secure cloud setups."},{"title":"Networking","desc":"LAN design, firewalls, VPN, multi-floor office networks."},{"title":"Full Stack with AI","desc":"PHP, TypeScript and modern web apps built faster with AI tooling."}]},"bn":{"title":"আমি যা করি","items":[{"title":"আইটি ইনফ্রাস্ট্রাকচার","desc":"উইন্ডোজ সার্ভার, অ্যাক্টিভ ডিরেক্টরি, লিনাক্স, ব্যাকআপ ও মনিটরিং।"},{"title":"সাইবারসিকিউরিটি ও ক্লাউড","desc":"হার্ডেনিং, অ্যাক্সেস কন্ট্রোল, নেটওয়ার্ক সুরক্ষা ও নিরাপদ ক্লাউড সেটআপ।"},{"title":"নেটওয়ার্কিং","desc":"LAN ডিজাইন, ফায়ারওয়াল, VPN ও বহুতলা অফিস নেটওয়ার্ক।"},{"title":"এআই সহ ফুল স্ট্যাক","desc":"PHP, TypeScript ও আধুনিক ওয়েব অ্যাপ, এআই টুলিংয়ে দ্রুত তৈরি।"}]}}'),
  ('projects', 3, true, '{"en":{"title":"Selected projects","items":[{"title":"Newsroom e-Paper","desc":"Interactive newspaper reader with a moderator studio for linking articles to page areas.","tags":["Next.js","Supabase"]},{"title":"Office Stock & HRMS","desc":"Department-wise inventory, distribution and staff portal with role-based control.","tags":["PHP","MySQL"]},{"title":"IT Asset Tracker","desc":"Serial-number tracking, desk stickers with unique codes and a challan scanner.","tags":["TypeScript","OCR"]}]},"bn":{"title":"বাছাই করা প্রজেক্ট","items":[{"title":"ইন্টারঅ্যাকটিভ ই-পেপার রিডার","desc":"সাথে মডারেটর স্টুডিও।","tags":["Next.js","Supabase"]},{"title":"বিভাগভিত্তিক ইনভেন্টরি","desc":"বিতরণ ও স্টাফ পোর্টাল।","tags":["PHP","MySQL"]},{"title":"সিরিয়াল ট্র্যাকিং","desc":"ইউনিক কোডের ডেস্ক স্টিকার ও চালান স্ক্যানার।","tags":["TypeScript","OCR"]}]}}'),
  ('testimonials', 4, true, '{"en":{"title":"What clients say","items":[{"quote":"The office network finally just works. Nobody calls IT for the small stuff anymore.","author":"Sample reviewer · Operations lead"},{"quote":"Clear explanations, no jargon, and the handover notes were better than we asked for.","author":"Sample reviewer · Office manager"},{"quote":"Built our inventory portal in weeks and it has not gone down once.","author":"Sample reviewer · Admin head"}]},"bn":{"title":"ক্লায়েন্টরা যা বলেন","items":[{"quote":"অফিসের নেটওয়ার্ক আবারও কাজ করছে। ছোট কাজের জন্য আমরা আর IT-এর কাছে কল করি না।","author":"নমুনা রিভিউয়ার · অপারেশনস লিড"},{"quote":"স্পষ্ট ব্যাখ্যা, কোনো জার্গন নেই, এবং হ্যান্ডওভার নোট আমাদের চাওয়ার চেয়ে ভালো।","author":"নমুনা রিভিউয়ার · অফিস ম্যানেজার"},{"quote":"আমাদের ইনভেন্টরি পোর্টাল কয়েক সপ্তাহে বানালাম এবং এটি কখনো ডাউন হয়নি।","author":"নমুনা রিভিউয়ার · অ্যাডমিন হেড"}]}}'),
  ('blog', 5, true, '{"en":{"title":"From the blog","items":[{"title":"How I split a flat office LAN into VLANs","desc":"6 min · Networking"},{"title":"Active Directory hardening checklist","desc":"8 min · Security"},{"title":"Shipping admin panels faster with AI","desc":"5 min · Development"}]},"bn":{"title":"ব্লগ থেকে","items":[{"title":"ফ্ল্যাট অফিস LAN-কে যেভাবে VLAN-এ ভাগ করলাম","desc":"6 মিনিট · নেটওয়ার্কিং"},{"title":"Active Directory হার্ডেনিং চেকলিস্ট","desc":"8 মিনিট · সিকিউরিটি"},{"title":"এআই দিয়ে দ্রুত অ্যাডমিন প্যানেল তৈরি","desc":"5 মিনিট · ডেভেলপমেন্ট"}]}}'),
  ('contact', 6, true, '{"en":{"title":"Let’s talk about your systems"},"bn":{"title":"আপনার সিস্টেম নিয়ে কথা বলি"}}')
on conflict (key) do update set sort_order = sections.sort_order, enabled = sections.enabled, content = sections.content, updated_at = now();

-- ---------------------------------------------------------------------------
-- Projects (case studies)
