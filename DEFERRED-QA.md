# Deferred QA — NOT DONE items

Status wording: "Complete" is used only for items actually run and verified.
Everything else is NOT DONE. Last updated: Session 2 wrap-up (2026-11-07).

## 0b. RESOLVED in Session 2 (verified)

- Migrations: RUN_ALL ran to completion in Supabase SQL Editor (user-executed).
  Verified via PostgREST: 17 tables, posts/testimonials/admins columns, 5
  analytics views, sections + theme_presets seeds, admins seed row filled.
- Write paths verified live (insert→read→cleanup): audit_log,
  newsletter_subscribers, visitor_events (reflected in analytics view),
  messages, admins.totp columns.
- Cron route tested: GET /api/cron/publish-scheduled with CRON_SECRET →
  {ok:true, published:1}; scheduled-past seed post flipped to published.
- Blog seed: 4 seed-* posts inserted (draft/published/scheduled×2).
- Sitemap + RSS now carry the seeded posts (feeds: /en/feed.xml, /bn/feed.xml;
  bare /feed.xml now 301-redirects to /en/feed.xml).
- RLS audit (16-point anon probe): drafts/future posts hidden, all private
  tables invisible, all anon writes rejected, public reads intact. One
  hardening gap found and fixed via migration 20261112: the Stage 1/2
  admin-write policies had USING (true) for ANY authenticated user — now
  restricted to public.is_admin(). USER MUST RE-RUN RUN_ALL once to apply.
- QA cleanup: the pending "QA Session 2" testimonial was deleted.