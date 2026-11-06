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
