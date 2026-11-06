-- Seed the 7 projects from CONTENT.md into public.projects (EN + BN text,
-- tech, media mode, demo link only for the live one). Upsert by slug, so
-- re-running never creates duplicates. Run in the Supabase SQL Editor.

insert into public.projects
  (slug, title_en, title_bn, problem_en, problem_bn, solution_en, solution_bn, tech, media, video, demo_url, slides, sort_order, published)
values
(
  'osdms',
  'OSDMS — Office Stock & Distribution',
  'ওএসডিএমএস — অফিস স্টক ও ডিস্ট্রিবিউশন',
  'Managing newsroom operations, IT equipment distribution and office inventory by hand is slow, error-prone and hard to track.',
  'নিউজরুম অপারেশন, আইটি সরঞ্জাম বিতরণ ও অফিস ইনভেন্টরি হাতে পরিচালনা ধীর, ভুলপ্রবণ ও ট্র্যাক করা কঠিন।',
  'Self-hosted ERP and inventory system that streamlines distribution, tracks IT modules and centralises stock data for newsroom operations.',
  'সেলফ-হোস্টেড ERP ও ইনভেন্টরি সিস্টেম — বিতরণ সহজ, আইটি মডিউল ট্র্যাকিং ও স্টক ডেটা এক জায়গায়।',
  '{PHP,Laravel,Blade,MySQL}', 'slides', null, null, '[]'::jsonb, 1, true
),
(
  'agamir-canteen',
  'Agamir Canteen',
  'আগামীর ক্যান্টিন',
  'Daily meal orders, rotating menus and admin approvals were chaotic with no unified tracking.',
  'দৈনিক খাবারের অর্ডার, ঘুরে ফেরা মেনু ও অনুমোদন এলোমেলো, কোনো একক ট্র্যাকিং ছিল না।',
  'Internal PWA that digitises the canteen workflow: employees order, admins approve — with rotating menus and unified tracking.',
  'ইন্টার্নাল PWA — কর্মীরা অর্ডার করে, অ্যাডমিন অনুমোদন দেয়; ঘুরে ফেরা মেনু ও ট্র্যাকিং এক জায়গায়।',
  '{PHP,Laravel,PWA,Offline-first}', 'slides', null, null, '[]'::jsonb, 2, true
),
(
  'media-frame-bd',
  'Media Frame BD',
  'মিডিয়া ফ্রেম বিডি',
  'Newsroom staff and local creators needed a fast way to make branded social assets without heavy design software.',
  'নিউজরুম কর্মী ও স্থানীয় ক্রিয়েটরদের ভারী ডিজাইন সফটওয়্যার ছাড়াই দ্রুত ব্র্যান্ডেড সোশ্যাল অ্যাসেট বানানোর প্রয়োজন ছিল।',
  'Bilingual online design suite for photo cards, news frames, barcodes and YouTube thumbnails — built for newsroom staff and local creators.',
  'নিউজরুম কর্মী ও স্থানীয় ক্রিয়েটরদের জন্য ফটো কার্ড, নিউজ ফ্রেম, বারকোড ও থাম্বনেইলের দ্বিভাষিক অনলাইন ডিজাইন স্যুট।',
  '{TypeScript,Node.js}', 'video', null, null, '[]'::jsonb, 3, true
),
(
  'likhon-tools',
  'Likhon Tools',
  'লিখন টুলস',
  'Users struggle with text conversion and formatting for bilingual Bangla and English content.',
  'বাংলা ও ইংরেজি টেক্সট কনভার্সন ও ফরম্যাটিং অনেক ব্যবহারকারীর দৈনন্দিন ঝামেলা।',
  'Bilingual web tools app with advanced text converters and Bangla text utilities. Live and in production.',
  'অ্যাডভান্সড টেক্সট কনভার্টার ও বাংলা টেক্সট ইউটিলিটির দ্বিভাষিক ওয়েব টুলস। লাইভ ও প্রোডাকশনে।',
  '{TypeScript,JavaScript,Node.js}', 'slides', null, 'https://likhontools.com/', '[]'::jsonb, 4, true
),
(
  'attendance-leave-management',
  'Attendance & Leave Management',
  'হাজিরা ও ছুটি ব্যবস্থাপনা',
  'Manual attendance and leave handling caused bottlenecks and inaccurate records.',
  'ম্যানুয়াল হাজিরা ও ছুটি ব্যবস্থাপনায় গতির বাধা ও ভুল রেকর্ড হতো।',
  'HR module that automates leave workflows and integrates ZKTeco biometric devices — no more manual attendance records.',
  'HR মডিউল — ছুটির ওয়ার্কফ্লো অটোমেটেড, ZKTeco বায়োমেট্রিক ডিভাইস ইন্টিগ্রেশন।',
  '{PHP,Laravel,Blade,ZKTeco}', 'slides', null, null, '[]'::jsonb, 5, true
),
(
  'modern-e-paper',
  'Modern E-Paper Concept',
  'মডার্ন ই-পেপার কনসেপ্ট',
  'Digital newspaper platforms often lack a responsive, modern reading experience.',
  'ডিজিটাল সংবাদপত্র প্ল্যাটফর্মে রেসপন্সিভ, মডার্ন পড়ার অভিজ্ঞতার অভাব থাকে।',
  'A fast, clean e-paper reading concept that also streamlines newsroom publishing.',
  'দ্রুত, পরিচ্ছন্ন ই-পেপার পড়ার কনসেপ্ট — নিউজরুম প্রকাশনাও সহজ।',
  '{HTML,CSS,JavaScript}', 'video', null, null, '[]'::jsonb, 6, true
),
(
  'digitalshebabd',
  'DigitalShebaBD',
  'ডিজিটালশেবাবিডি',
  'People lacked one clean place to reach local digital services and utilities.',
  'স্থানীয় ডিজিটাল সেবা ও ইউটিলিটিতে পৌঁছানোর একটি পরিচ্ছন্ন ঠিকানার অভাব ছিল।',
  'Service-oriented portal for quick access to essential local digital services and utilities.',
  'স্থানীয় ডিজিটাল সেবা ও ইউটিলিটিতে দ্রুত পৌঁছানোর সার্ভিস-ওরিয়েন্টেড পোর্টাল।',
  '{TypeScript,Web}', 'slides', null, null, '[]'::jsonb, 7, true
)
on conflict (slug) do update set
  title_en = excluded.title_en,
  title_bn = excluded.title_bn,
  problem_en = excluded.problem_en,
  problem_bn = excluded.problem_bn,
  solution_en = excluded.solution_en,
  solution_bn = excluded.solution_bn,
  tech = excluded.tech,
  media = excluded.media,
  video = excluded.video,
  demo_url = excluded.demo_url,
  sort_order = excluded.sort_order,
  published = excluded.published;

-- Sanity check: expect 7 published projects, ordered 1-7.
select slug, sort_order, media, demo_url, jsonb_array_length(slides) as slides from public.projects order by sort_order;
