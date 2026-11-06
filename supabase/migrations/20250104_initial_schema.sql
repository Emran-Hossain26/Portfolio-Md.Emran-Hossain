-- ============================================================================
-- emran-portfolio — Supabase migrations (Stage 0)
-- Run this in the Supabase SQL editor. Safe to re-run (idempotent upserts).
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Profiles (admin users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users not null,
  email text not null unique,
  username text unique,
  role text not null default 'editor' check (role in ('super_admin', 'editor')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Site settings (key-value JSON)
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Insert default site settings
insert into site_settings (key, value) values
  ('hero_texts', '{"en":{"heading":"I build and secure the systems your business runs on.","intro":"Md Emran Hossain: IT infrastructure and cybersecurity engineer, and AI-assisted full stack developer in Dhaka. Servers, networks, cloud and web applications, end to end."},"bn":{"heading":"আপনার ব্যবসা যে সিস্টেমের ওপর চলে, আমি সেটা বানাই আর সুরক্ষিত রাখি।","intro":"মো. ইমরান হোসাইন: ঢাকার আইটি ইনফ্রাস্ট্রাকচার ও সাইবারসিকিউরিটি ইঞ্জিনিয়ার এবং এআই-সহায়ক ফুল স্ট্যাক ডেভেলপার। সার্ভার, নেটওয়ার্ক, ক্লাউড আর ওয়েব অ্যাপ, শুরু থেকে শেষ পর্যন্ত।"}}),
  ('theme_light', '{"accent":"#2F6BFF","bg":"#F4F6F9","panel":"#fff","ink":"#0E1B2E","mute":"#51607a","line":"#dde3ee","radius":"14px"}'),
  ('theme_dark', '{"accent":"#5B8CFF","bg":"#0A1120","panel":"#111B30","ink":"#E8EEFB","mute":"#93A2BF","line":"#223050","radius":"14px"}'),
  ('theme_cyber', '{"accent":"#2CFF6B","bg":"#050805","panel":"#0B120B","ink":"#CFFFD6","mute":"#6FA77A","line":"#16301A","radius":"4px"}'),
  ('theme_aurora', '{"accent":"#9B7BFF","bg":"#120E2B","panel":"#1B1640","ink":"#F1ECFF","mute":"#B3A9DE","line":"#34296B","radius":"22px"}'),
  ('features', '{"cursor_fx":true,"cursor_fx_default":true,"theme_picker":true,"presets":["default","ocean","forest","sunset","royal","mono","candy"],"stats":true,"certifications":true,"faq":true,"availability":true}'),
  ('site_extras', '{"availability":{"available":true,"text_en":"Available for new projects & consultations","text_bn":"নতুন প্রজেক্ট ও পরামর্শের জন্য প্রস্তুত"},"stats":[{"value":"5+","label_en":"Years with servers & networks","label_bn":"বছর সার্ভার ও নেটওয়ার্কে"},{"value":"20+","label_en":"Systems administered","label_bn":"সিস্টেম পরিচালনা করা"},{"value":"10+","label_en":"Projects delivered","label_bn":"প্রজেক্ট সম্পন্ন"},{"value":"24/7","label_en":"Monitoring mindset","label_bn":"মনিটরিং মাইন্ডসেট"}],"certifications":[],"faqs":[{"q_en":"What do you help businesses with?","q_bn":"আপনি ব্যবসায়িক প্রতিষ্ঠানকে কী কাজে সাহায্য করেন?","a_en":"Windows Server and Active Directory environments, Linux servers, LAN/firewall/VPN design, cloud security hardening, backups and monitoring — plus full-stack web applications with AI assistance.","a_bn":"Windows Server ও Active Directory, Linux সার্ভার, LAN/ফায়ারওয়াল/VPN ডিজাইন, ক্লাউড সিকিউরিটি, ব্যাকআপ ও মনিটরিং — এবং AI সহায়তায় ফুল-স্ট্যাক ওয়েব অ্যাপ্লিকেশন।"},{"q_en":"Where are you based, and do you work remotely?","q_bn":"আপনি কোথায় অবস্থিত, এবং রিমোটলি কাজ করেন?","a_en":"I am based in Dhaka, Bangladesh, and I work both on-site (Dhaka area) and remotely with clients anywhere.","a_bn":"আমি ঢাকা, বাংলাদেশে অবস্থিত; ঢাকায় অন-সাইট এবং যেকোনো জায়গা থেকে রিমোটলি কাজ করি।"},{"q_en":"Can I see something you have built that is live?","q_bn":"আপনার বানানো লাইভ কোনো কিছু দেখা যাবে?","a_en":"Yes — Likhon Tools (likhontools.com) is a live production project. The case studies on this site list more work.","a_bn":"হ্যাঁ — Likhon Tools (likhontools.com) একটি লাইভ প্রোডাকশন প্রজেক্ট। এই সাইটের কেস স্টাডিগুলোতে আরও কাজ দেখুন।"},{"q_en":"How do we start working together?","q_bn":"কাজ শুরু করব কীভাবে?","a_en":"Email engremran.it@gmail.com or use the contact form with a short brief — you will get a reply with next steps.","a_bn":"engremran.it@gmail.com-এ ইমেইল করুন বা সংক্ষিপ্ত বিবরণ নিয়ে যোগাযোগ ফর্ম ব্যবহার করুন — পরবর্তী ধাপসহ উত্তর পাবেন।"}]}')
on conflict (key) do update set value = site_settings.value, updated_at = now();

-- ---------------------------------------------------------------------------
-- Feature flags (enable/disable features)
-- ---------------------------------------------------------------------------
create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into feature_flags (key, enabled) values
  ('cursor_fx', true),
  ('cursor_fx_default', true),
  ('theme_picker', true),
  ('stats', true),
  ('certifications', true),
  ('faq', true),
  ('availability', true)
on conflict (key) do update set enabled = feature_flags.enabled, updated_at = now();

-- ---------------------------------------------------------------------------
-- Sections (hero, expertise, projects, etc. with bn/en content and order)
-- ---------------------------------------------------------------------------
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
-- ---------------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_bn text not null default '',
  desc_en text not null,
  desc_bn text not null default '',
  tags text[] not null default '{}',
  href text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Blog posts (bn/en, status, tags, cover, seo fields, scheduled_at)
-- ---------------------------------------------------------------------------
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_bn text not null default '',
  body_en text not null,
  body_bn text not null default '',
  meta_en text not null default '',
  meta_bn text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled', 'archived')),
  category text,
  tags text[] not null default '{}',
  cover_url text,
  reading_time_en int not null default 0,
  reading_time_bn int not null default 0,
  view_count int not null default 0,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Testimonials (public submissions start pending; admin approves)
-- ---------------------------------------------------------------------------
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null default '',
  quote_en text not null,
  quote_bn text not null default '',
  rating int not null default 5 check (rating between 1 and 5),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Experience & education (placeholders until CV data arrives)
-- ---------------------------------------------------------------------------
create table if not exists experience (
  id uuid primary key default gen_random_uuid(),
  role_en text not null,
  role_bn text not null default '',
  org_en text not null,
  org_bn text not null default '',
  period text not null default '',
  details text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  degree_en text not null,
  degree_bn text not null default '',
  org_en text not null,
  org_bn text not null default '',
  period text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contact messages (stored by the contact-form milestone, server-side write)
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Theme presets (admin-editable, visitor-selectable)
-- ---------------------------------------------------------------------------
create table if not exists theme_presets (
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

-- Insert default theme presets
insert into theme_presets (name_en, name_bn, is_default, is_enabled, colors, fonts, radius, shadows, sort_order) values
  ('Light', 'লাইট', true, true, '{"accent":"#2F6BFF","bg":"#F4F6F9","panel":"#fff","ink":"#0E1B2E","mute":"#51607a","line":"#dde3ee","radius":"14px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"14px","button":"14px"}', '{"card":"0 4px 14px rgba(0,0,0,0.1)"}', 1),
  ('Dark', 'ডার্ক', false, true, '{"accent":"#5B8CFF","bg":"#0A1120","panel":"#111B30","ink":"#E8EEFB","mute":"#93A2BF","line":"#223050","radius":"14px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"14px","button":"14px"}', '{"card":"0 4px 14px rgba(0,0,0,0.3)"}', 2),
  ('Cyber', 'সাইবার', false, true, '{"accent":"#2CFF6B","bg":"#050805","panel":"#0B120B","ink":"#CFFFD6","mute":"#6FA77A","line":"#16301A","radius":"4px"}', '{"heading":"ui-monospace","body":"Hind Siliguri"}', '{"card":"4px","button":"4px"}', '{"card":"0 4px 14px rgba(44,255,107,0.2)"}', 3),
  ('Aurora', 'অরোরা', false, true, '{"accent":"#9B7BFF","bg":"#120E2B","panel":"#1B1640","ink":"#F1ECFF","mute":"#B3A9DE","line":"#34296B","radius":"22px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"22px","button":"22px"}', '{"card":"0 8px 30px rgba(155,123,255,0.15)"}', 4),
  ('Warm Paper', 'ওয়ার্ম পেপার', false, true, '{"accent":"#FFB020","bg":"#F3EFE6","panel":"#fff","ink":"#2D4147","mute":"#8FB3B8","line":"#DCE1E9","radius":"22px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"22px","button":"22px"}', '{"card":"0 8px 30px rgba(255,176,32,0.15)"}', 5)
on conflict (name_en) do update set name_bn = theme_presets.name_bn, is_default = theme_presets.is_default, is_enabled = theme_presets.is_enabled, colors = theme_presets.colors, fonts = theme_presets.fonts, radius = theme_presets.radius, shadows = theme_presets.shadows, sort_order = theme_presets.sort_order, updated_at = now();

-- ---------------------------------------------------------------------------
-- Page SEO (per-page bilingual metadata)
-- ---------------------------------------------------------------------------
create table if not exists page_seo (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  lang text not null default 'en' check (lang in ('en', 'bn')),
  title text,
  description text,
  og_image text,
  canonical text,
  robots text default 'index,follow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(path, lang)
);

-- ---------------------------------------------------------------------------
-- Redirects (301 from DB, cached)
-- ---------------------------------------------------------------------------
create table if not exists redirects (
  id uuid primary key default gen_random_uuid(),
  from_url text not null unique,
  to_url text not null,
  permanent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log (all admin actions)
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Visitor events (privacy-friendly analytics)
-- ---------------------------------------------------------------------------
create table if not exists visitor_events (
  id uuid primary key default gen_random_uuid(),
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

-- Create index for performance
create index idx_projects_published_sort on projects(published, sort_order);
create index idx_blog_posts_status_created on blog_posts(status, created_at desc);
create index idx_testimonials_status_created on testimonials(status, created_at desc);
create index idx_messages_status_created on messages(status, created_at desc);
create index idx_page_seo_path_lang on page_seo(path, lang);
create index idx_audit_log_user_created on audit_log(user_id, created_at desc);
create index idx_visitor_events_session_created on visitor_events(session_id, created_at desc);

-- Create view for visitor analytics
create or replace view visitor_stats as
select
  date_trunc('day', created_at) as date,
  count(distinct session_id) as unique_visitors,
  count(*) as page_views,
  count(distinct country) as countries,
  count(distinct device_type) as devices
from visitor_events
group by date_trunc('day', created_at)
order by date desc;

-- Create view for recent messages
create or replace view recent_messages as
select
  id,
  name,
  email,
  subject,
  message,
  status,
  created_at
from messages
order by created_at desc
limit 100;

-- Create view for pending testimonials
create or replace view pending_testimonials as
select
  id,
  name,
  company,
  quote_en,
  quote_bn,
  rating,
  created_at
from testimonials
where status = 'pending'
order by created_at desc;
