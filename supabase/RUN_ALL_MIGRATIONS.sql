-- ============================================================
-- RUN ALL PENDING MIGRATIONS IN ONE PASTE (Supabase SQL Editor)
-- Concatenates: 20250105, 20261105, 20261106, 20261107, 20261108
-- All idempotent — safe to run more than once.
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
ON CONFLICT (key) DO NOTHING;-- ============================================================================
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
  USING (true) WITH CHECK (true);-- ============================================================================
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
GRANT EXECUTE ON FUNCTION public.increment_post_views(text) TO service_role;-- ============================================================================
-- Stage 4.2: Complete theme presets (add sunset, forest, ocean, high-contrast)
-- and theme_visitor_switch setting. Idempotent.
-- Do NOT edit old migrations; this is additive.
-- ============================================================================

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
ON CONFLICT (key) DO NOTHING;-- Stage 4.3 — Localized (Bangla) slugs for posts + per-project OG images.
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
