# Deferred QA — NOT DONE items

Status wording: "Complete" is used only for items actually run and verified.
Everything else is NOT DONE. Last updated: Stage 5.1 (2026-11-05).

## 1. Database migrations — BLOCKING, run first

The live Supabase project still has only the original 8 tables (verified via
the PostgREST OpenAPI spec). The following migrations have NOT been applied:

- `20250105_stage1_content_tables.sql` — sections, services, skills, faq,
  certifications, contact_info, social_links, stats, media_assets, redirects…
- `20261105_stage2_blog_columns.sql` — status, scheduled_at, categories, tags,
  seo columns, og_image, canonical, noindex on posts
- `20261106_stage25_view_counter.sql` — posts.view_count + increment RPC
- `20261107_stage42_theme_presets.sql` — theme_presets table (9 presets) +
  theme_visitor_switch setting
- `20261108_stage43_bn_slug_project_og.sql` — posts.bn_slug + projects.og_image

Until these run (Supabase Dashboard → SQL Editor, in order):
- admin saves to sections/services/skills/faq/etc. fail
- view counter silently no-ops (route falls back, no view_count column)
- seed script fails (verified: "Could not find the 'categories' column")
- theme presets come from code seeds, not the DB
- bn slugs / project og_image columns do not exist

## 2. Seed script — blocked by migrations

`SEED_DEV=1 node scripts/seed-blog-posts.mjs --confirm` — run AFTER migrations.
Guards verified working (SEED_DEV, --confirm, no-prod URL).

## 3. RLS verification — PARTIAL

Verified via REST with the anon key (no SQL editor needed):
- anon sees 0 of 2 existing posts (both drafts) — published-only filter works
- anon cannot read admin-only tables (empty/filtered responses)
- full matrix in `supabase/rls_test.sql` still needs a manual run after
  migrations (policies for the new tables cannot be tested before they exist)

## 4. CRON_SECRET

Placeholder exists in `.env.example` (generate with `openssl rand -hex 32`).
NOT DONE: set the real value in Vercel env vars (and local `.env.local`).
`vercel.json` already schedules the cron daily (Hobby limit); on Pro tighten
to every 15 minutes. The read layer is time-aware, so scheduled posts appear
within the blog cacheLife window even with a daily cron.

## 5. Needs a Vercel deployment (user permission required)

- Lighthouse 95+ on mobile (Performance/SEO/A11y/Best Practices)
- Google Rich Results Test on all JSON-LD types
- Vercel preview build of `/api/cron/*` with real CRON_SECRET
- End-to-end scheduled publish test (needs a scheduled post in the DB)

## 6. Still open (small)

- Dedicated test admin user (separate from the personal account)
- Browser/screenshot testing: admin preview panel toggles, archive pages with
  real data, theme picker at 390px width
- AA contrast ratios measured with an external tool (code-checked only)
- Sanitizer automated tests (no test runner installed; vitest deferred)
- Draft preview `/admin/preview/[slug]` tested with real posts

## Complete (previously deferred, verified done)

### Stage 5.1 (verified with production build + curl + Lighthouse)
- Single glass "✨ Effects" button (bottom-right, theme-tokens, aria-expanded/
  controls, Enter/Esc keyboard-verified at 390px + light/cyber/high-contrast);
  old Admin preview drawer + Accent demo removed from public site
- Panel has exactly 3 persisted group switches (Animation / Magical cursor /
  Magical animation); cursor row hidden on coarse pointers; reduced motion
  starts all OFF with a note
- Admin hard-off: group unavailable = not rendered + code never loaded
  (verified via real admin save → updateTag → served HTML)
- All effect code lazy (dynamic import after load+requestIdleCallback);
  canvases pause on hidden tab / off-screen hero; intensity scales particles
  + glow; lite/full default + touch_disable + intensity in Effects Manager
- SEO: final h1 + final stat numbers in server HTML, data-countup aria-labels,
  no first-load fade (page fade 180ms, client navigations only), CLS 0
- Login guard: scripts/guard-effects.mjs passes; git diff shows 0 login files
- Measured: home JS 664,940 → 648,457 bytes; Lighthouse mobile: defaults
  P88/A96/S92/BP100, CLS 0, TBT 80ms; all-off P90, TBT 30ms


- Title templates + global default descriptions — wired in `pageMetadata()` /
  `resolvePageMetadata()` (seo.ts), applied from `seo_settings`
- GSC/Bing verification meta tags — injected in layout `<head>` from
  `seo_settings`; Analytics component loads gtag only with an ID and honours DNT
- Redirect validation — `saveRowAction` validates from/to (relative paths,
  trailing-slash normalisation, https-only external, self/loop/chain guards)
- SEO Health extra checks — title length, description 70–160, missing
  og_image, noindex + orphan posts, broken internal links, thin archives,
  duplicate titles, alt text; every check guarded against missing tables
- next/image — no `<img>` left anywhere (public site was already migrated;
  admin media library now uses next/image with the Supabase remote pattern)
- Per-post OG images — wired in blog generateMetadata; per-project og_image
  wired in projects generateMetadata (column arrives with 20261108)
- Localized (bn) slugs — bn_slug column (20261108), admin field, locale-aware
  post URLs (`blogPostHref`), hreflang alternates, sitemap, view counting on
  the canonical slug
- No credentials in any committed file (grep-verified); `.env.local` gitignored
