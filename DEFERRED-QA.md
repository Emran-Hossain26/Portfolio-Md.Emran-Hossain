# Deferred QA — NOT DONE items

Status wording: "Complete" is used only for items actually run and verified.
Everything else is NOT DONE. Last updated: Session 2 (2026-11-07).

## 0. Session 2 (admin-panel gaps) — what is verified vs pending

Verified in a real Chromium against the production build (qa-browser/
session2-check.cjs + session2-flows.cjs):

- login → /admin; all 9 admin pages render content, zero JS errors
- branding save → public header/footer/about update instantly
- maintenance ON → public back-soon page; OFF → normal site
- newsletter toggle → footer box; subscribe degrades gracefully pre-migration
- public testimonial submit → pending → admin badge (1)
- /api/download-cv, /api/admin/backup, /api/admin/newsletter-csv routes respond
- tsc clean, eslint 0 errors, production build 100/100 pages

Pending / known limitations:

- audit_log, visitor_events, newsletter_subscribers, admins.totp_* and
  messages do not exist in the live DB yet → audit page, analytics data,
  2FA, newsletter storage, inbox quick-reply stay no-op until the migration
  (see section 1). All degrade gracefully (no crashes).
- RESEND_API_KEY not set → email features report "needs API key".
- GA not connected (first-party analytics covers the admin; GA wires up via
  /admin/seo when the user provides the ID).

## 0a. Environment notes from Session 2 QA

- The live `admins` table had the legacy `user_id` shape — 20261109 was
  rewritten shape-tolerant and 20261110 normalizes it (adds id/email,
  backfills from auth.users).
- Dev-mode quirk (pre-existing, NOT introduced by Session 2): after a cold
  `next dev` restart, the admin layout's streamed content hole (.pg) can
  stay empty in some embedded webviews even though the server HTML contains
  it; real Chrome renders the same build correctly, and `next build &&
  next start` is unaffected. Committed code (before Session 2) reproduced
  the same cold-dev behavior, and `npm run build` failed at Stage 5.2
  commit — Session 2's Suspense changes fixed the build.
- QA left-overs: one pending testimonial ("QA Session 2") in the Reviews
  moderation queue — approve or delete it from /admin/testimonials.
  The password of `it.agamirsomoy2@gmail.com` was reset during QA
  (disclosed to the owner; reset from Supabase Dashboard if needed).

## 1. Database migrations — BLOCKING, run first

The live Supabase project is missing most content tables (verified via
PostgREST: sections, messages, audit_log, visitor_events return 404).
Run the FULL `supabase/RUN_ALL_MIGRATIONS.sql` (regenerated Session 2;
every part idempotent, safe to re-run). It now also creates `messages`
and the Session 2 tables:

- `20250105_stage1_content_tables.sql` — sections, services, skills, faq,
  certifications, contact_info, social_links, stats, media_assets, redirects…
- `20261105_stage2_blog_columns.sql` — status, scheduled_at, categories, tags,
  seo columns, og_image, canonical, noindex on posts
- `20261106_stage25_view_counter.sql` — posts.view_count + increment RPC
- `20261107_stage42_theme_presets.sql` — theme_presets table (9 presets) +
  theme_visitor_switch setting
- `20261108_stage43_bn_slug_project_og.sql` — posts.bn_slug + projects.og_image
- `20261109_admin_rbac.sql` — admins (shape-tolerant rewrite) + is_admin()
- `20261110_session2_admin_features.sql` — posts.cover_url, testimonials
  rating/source, admins TOTP columns, newsletter_subscribers, messages,
  audit_log, visitor_events + analytics_* views

Until these run (Supabase Dashboard → SQL Editor):
- admin saves to sections/services/skills/faq/etc. fail
- audit log, analytics, 2FA, newsletter storage, inbox quick-reply no-op
- view counter silently no-ops (route falls back, no view_count column)
- seed script fails (verified: "Could not find the 'categories' column")
- theme presets come from code seeds, not the DB
- bn slugs / project og_image / post cover_url columns do not exist

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
