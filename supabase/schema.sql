-- ============================================================================
-- emran-portfolio — Supabase schema (Milestone 3)
-- Run this in the Supabase SQL editor. Safe to re-run (idempotent upserts).
-- Public site reads published rows (anon); only authenticated users (the
-- admin, whose email must match ADMIN_EMAIL) can write.
-- The service_role key is used ONLY server-side (admin server actions).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Settings (JSON each): theme colours, hero text overrides, CV URL
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Projects (case studies)
-- ---------------------------------------------------------------------------
create table if not exists projects (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title_en   text not null,
  title_bn   text not null default '',
  desc_en    text not null default '',
  desc_bn    text not null default '',
  tags       text[] not null default '{}',
  href       text,
  published  boolean not null default true,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Blog posts (Markdown bodies, en/bn)
-- ---------------------------------------------------------------------------
create table if not exists posts (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title_en   text not null,
  title_bn   text not null default '',
  body_en    text not null default '' , -- Markdown
  body_bn    text not null default '' , -- Markdown
  meta_en    text not null default '',
  meta_bn    text not null default '',
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Testimonials (public submissions start pending; admin approves)
-- ---------------------------------------------------------------------------
create table if not exists testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  company    text not null default '',
  quote_en   text not null default '',
  quote_bn   text not null default '',
  rating     int not null default 5 check (rating between 1 and 5),
  photo_url  text,
  status     text not null default 'pending'
             check (status in ('pending','approved','hidden')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Experience & education (placeholders until CV data arrives)
-- ---------------------------------------------------------------------------
create table if not exists experience (
  id       uuid primary key default gen_random_uuid(),
  role_en  text not null,
  role_bn  text not null default '',
  org_en   text not null default '',
  org_bn   text not null default '',
  period   text not null default '',
  details  text not null default '',
  sort     int not null default 0
);

create table if not exists education (
  id        uuid primary key default gen_random_uuid(),
  degree_en text not null,
  degree_bn text not null default '',
  org_en    text not null default '',
  org_bn    text not null default '',
  period    text not null default '',
  sort      int not null default 0
);

-- ---------------------------------------------------------------------------
-- Contact messages (stored by the contact-form milestone, server-side write)
-- ---------------------------------------------------------------------------
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  spam       boolean not null default false,
  created_at timestamptz not null default now()
);

-- Per-page per-language SEO overrides (<60 title, <160 description)
create table if not exists page_seo (
  path        text not null,                          -- '/', '/projects', ...
  lang        text not null check (lang in ('en','bn')),
  title       text not null,
  description text not null,
  primary key (path, lang)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table site_settings    enable row level security;
alter table projects         enable row level security;
alter table posts            enable row level security;
alter table testimonials     enable row level security;
alter table experience       enable row level security;
alter table education        enable row level security;
alter table contact_messages enable row level security;
alter table page_seo         enable row level security;

-- Public reads (public site + testimonials show only what's approved)
create policy "public read settings"        on site_settings    for select using (true);
create policy "public read projects"        on projects         for select using (published = true);
create policy "public read posts"           on posts            for select using (published = true);
create policy "public read testimonials"    on testimonials     for select using (status = 'approved');
create policy "public read experience"      on experience       for select using (true);
create policy "public read education"       on education        for select using (true);
create policy "public read page_seo"        on page_seo         for select using (true);
-- contact_messages have no public read policy (server/service-role only)

-- Admin writes (authenticated only; the app additionally checks ADMIN_EMAIL)
create policy "admin manage settings"     on site_settings    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin manage projects"     on projects         for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin manage posts"        on posts            for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin manage testimonials" on testimonials     for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin manage experience"   on experience       for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin manage education"    on education        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin manage page_seo"     on page_seo         for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin read contact_msgs"   on contact_messages for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Storage: CV uploads (public bucket, admin write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cv', 'cv', true)
on conflict (id) do nothing;

create policy "public read cv" on storage.objects
  for select using (bucket_id = 'cv');
create policy "admin write cv" on storage.objects
  for all using (bucket_id = 'cv' and auth.role() = 'authenticated')
  with check (bucket_id = 'cv' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Seed data — mirrors the current static site so the admin starts populated
-- ---------------------------------------------------------------------------
insert into projects (slug, title_en, title_bn, desc_en, desc_bn, tags, href, sort) values
  ('likhon-tools',     'Likhon Tools',     'Likhon Tools',     'Bilingual Bangla/English online tools platform. Live.', 'বাংলা/ইংরেজি দ্বিভাষিক অনলাইন টুলস প্ল্যাটফর্ম। লাইভ।', array['TypeScript','SEO','Live'], 'https://likhontools.com/', 0),
  ('media-frame-bd',   'Media Frame BD',   'Media Frame BD',   'Design tool for photo cards, banners and thumbnails for creators and newsrooms.', 'ক্রিয়েটর ও নিউজরুমের জন্য ফটো কার্ড, ব্যানার ও থাম্বনেইল ডিজাইন টুল।', array['TypeScript'], null, 1),
  ('osdms',            'OSDMS',            'OSDMS',            'Office stock, distribution and attendance management system.', 'অফিসের স্টক, বিতরণ ও হাজিরা ব্যবস্থাপনা সিস্টেম।', array['PHP','Blade'], null, 2),
  ('office-tv-control','Office TV Control','অফিস টিভি কন্ট্রোল','Dashboard to control Android TVs across two floors, with live broadcast.', 'দুই তলার Android TV নিয়ন্ত্রণের ড্যাশবোর্ড, লাইভ সম্প্রচারসহ।', array['LAN','Android 14'], null, 3)
on conflict (slug) do nothing;

insert into posts (slug, title_en, title_bn, body_en, body_bn, meta_en, meta_bn, published) values
  ('harden-windows-server-10-steps',
   'How to harden Windows Server in 10 steps',
   '১০ ধাপে Windows Server হার্ডেন করার উপায়',
   'This is a sample placeholder article. The real, written article will be published once real content is approved. Nothing here is presented as finished work.',
   'এটি একটি নমুনা প্লেসহোল্ডার পোস্ট। আসল লেখা প্রকাশ হবে যখন প্রকৃত কনটেন্ট অনুমোদিত হবে।',
   'Sample post · 5 min read', 'নমুনা পোস্ট · ৫ মিনিট পড়া', false),
  ('active-directory-small-office-mistakes',
   'Active Directory mistakes small offices make',
   'ছোট অফিসে Active Directory-র সাধারণ ভুল',
   'This is a sample placeholder article. The real, written article will be published once real content is approved. Nothing here is presented as finished work.',
   'এটি একটি নমুনা প্লেসহোল্ডার পোস্ট। আসল লেখা প্রকাশ হবে যখন প্রকৃত কনটেন্ট অনুমোদিত হবে।',
   'Sample post · 6 min read', 'নমুনা পোস্ট · ৬ মিনিট পড়া', false)
on conflict (slug) do nothing;

insert into testimonials (name, quote_en, quote_bn, company, status) values
  ('Client name', 'Placeholder review text. Replace with a real client quote.', 'প্লেসহোল্ডার রিভিউ টেক্সট। আসল ক্লায়েন্টের উক্তি দিয়ে বসবে।', 'Company', 'approved'),
  ('Client name', 'Placeholder review text. Replace with a real client quote.', 'প্লেসহোল্ডার রিভিউ টেক্সট। আসল ক্লায়েন্টের উক্তি দিয়ে বসবে।', 'Company', 'approved');

insert into site_settings (key, value) values
  ('hero_texts', jsonb '{
    "en": {"heading": "I build and secure the systems your business runs on.",
           "intro": "Md Emran Hossain: IT infrastructure and cybersecurity engineer, and AI-assisted full stack developer in Dhaka. Servers, networks, cloud and web applications, end to end."},
    "bn": {"heading": "আপনার ব্যবসার সিস্টেম আমি তৈরি করি, এবং নিরাপদ রাখি।",
           "intro": "মোঃ ইমরান হোসেন: ঢাকাভিত্তিক আইটি ইনফ্রাস্ট্রাকচার ও সাইবার সিকিউরিটি ইঞ্জিনিয়ার এবং এআই-সহায়ক ফুল স্ট্যাক ডেভেলপার। সার্ভার, নেটওয়ার্ক, ক্লাউড ও ওয়েব অ্যাপ্লিকেশন, শুরু থেকে শেষ পর্যন্ত।"}
  }')
on conflict (key) do nothing;
