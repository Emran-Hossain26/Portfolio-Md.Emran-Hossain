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