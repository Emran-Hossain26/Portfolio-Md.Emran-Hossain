-- Stage C: unique constraints on natural keys (AFTER duplicates are gone).
-- These prevent the seed script from creating duplicates if run again.
-- Idempotent: safe to re-run.

-- Services: one row per EN title
create unique index if not exists services_title_en_key
  on public.services (lower(trim(title_en)));

-- Skills: one row per skill name
create unique index if not exists skills_name_key
  on public.skills (lower(trim(name)));

-- Stats: one row per value
create unique index if not exists stats_value_key
  on public.stats (lower(trim(value)));

-- FAQs: one row per question
create unique index if not exists faqs_q_en_key
  on public.faqs (lower(trim(q_en)));

-- Social links: one row per platform
create unique index if not exists social_links_platform_key
  on public.social_links (lower(trim(platform)));

-- Posts: one row per slug (already unique via PK, but ensure)
create unique index if not exists posts_slug_key
  on public.posts (slug);
