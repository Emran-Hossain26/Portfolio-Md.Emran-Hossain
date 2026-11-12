## 0d. Stage 6 security hardening (2026-11-09) — verified

Evidence (real outputs, session log):
- security-walk (build gate): 37 admin pages + 4 admin APIs walked
  unauthenticated → all redirect/sealed; exits 1 when a route is open
  (verified: proxy gate disabled → walk FAILED → restored → OK).
- curl walk: /admin, /admin/inbox, /admin/themes, /admin/audit →
  307 → /login.
- Headers: CSP with per-request nonce + strict-dynamic, nosniff,
  X-Frame-Options DENY, HSTS, Referrer-Policy, Permissions-Policy.
- Theme init script + effects UI verified running under the CSP.
- Username login: profiles.username → email resolved server-side;
  login as "qa-admin" succeeded (test account).
- Login failures audit-logged: 6 × login_failed rows in audit_log.
- Turnstile: widget renders when site key set; with the always-fail
  Cloudflare TEST secret the contact form is REJECTED (message shown,
  nothing stored).
- Uploads: media upload allowlists extension + MIME; CV path is fixed.
- zod schemas on all public actions; role checks via requireAdmin.

NOT DONE / pending:
- Durable login lockout E2E evidence: the login_attempts table comes
  with migration 20261114 — until the final RUN_ALL the lockout is
  inert by design (graceful degradation). Logic is implemented and
  unit-shaped; evidence after the migration run.
- Real Turnstile keys: user provides (test keys used for evidence only).
- 2FA recovery-codes login E2E: requires 2FA enabled (setup flow exists
  in Profile & security after the final RUN_ALL seeds nothing — TOTP
  setup works today; recovery codes regenerate from Profile).
- CSP nonce forces dynamic rendering for [locale] pages (documented
  trade-off; data stays cached in the "use cache" layer).
# Deferred QA — NOT DONE items

Status wording: "Complete" is used only for items actually run and verified.
Everything else is NOT DONE. Last updated: Session 2 wrap-up (2026-11-07).

## 0c. Stage 6 (verified in Chromium, prod build)

- contact submit → inbox (badge updates instantly via updateTag), quote → inbox,
  palette (Ctrl+K open/search/navigate), terminal whoami, skills wall, sections
  render — all green; booking/now/metrics DB pieces activate after the final
  RUN_ALL (booking_slots/now_items tables are in 20261113, not yet applied)
- Fixed: admin sort saves on services/skills/certifications/faqs/stats/
  social_links targeted a non-existent `sort` column — now sort_order

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
## Task U5 — navigation parity (2026-11-12)
- All admin dashboards are now reachable from AdminV2Chrome.NAV (7 collapsible
  groups, mobile off-canvas drawer); dead AdminSidebar/AdminChrome deleted.
- Legacy duplicates redirected: /admin/texts → /admin/hero (both wrote the
  same hero_texts key), /admin/messages → /admin/inbox (same data).
- Feature flags: the orphaned getFeatureFlags() reader (cms.ts) was REMOVED
  in code — no admin UI ever wrote the feature_flags table and no component
  consumed it. The legacy `features` site_settings key has had no reader
  since the Sections/Effects/Extras managers replaced it. The feature_flags
  TABLE itself is untouched (not dropped) — harmless; cleanup is a
  user-side decision for a future migration if ever wanted.
