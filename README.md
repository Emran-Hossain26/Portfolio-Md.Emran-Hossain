# emran-portfolio

Bilingual (Bangla + English) portfolio for **Md Emran Hossain** — IT Infrastructure & Cybersecurity Engineer, Full Stack Developer with AI.

Next.js (App Router, Turbopack) + TypeScript + Tailwind CSS v4 + next-intl. Data layer: Supabase (DB, admin auth, storage).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values you have
npm run dev                  # http://localhost:3000
```

Routes: `/` (English) and `/bn` (Bangla), switched by the header button.

## Environment variables

See `.env.example`. Never commit real values - secrets go into Vercel env vars only.

- `NEXT_PUBLIC_SITE_URL` - canonical site URL; swap once the real domain is bought.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - public Supabase values.
- `SUPABASE_SERVICE_ROLE_KEY` - **server only**, never expose to the browser.
- `ADMIN_EMAIL` - the one Supabase-auth user allowed to sign in at `/admin`.
- `RESEND_API_KEY`, `TURNSTILE_*` - for the contact-form milestone.

## Supabase + admin panel

The admin panel (`/admin`) edits hero texts, theme colours (with WCAG AA
contrast validation), projects, blog posts (Markdown), testimonials
moderation, experience, education, CV upload and per-page SEO (title ≤ 60,
description ≤ 160). Until Supabase is configured it shows seed/placeholder
data and cannot save.

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the contents of `supabase/schema.sql`
   (idempotent - safe to re-run). It creates the tables, RLS policies and
   seed data mirroring the current site.
3. Authentication → enable Email sign-in, then **Add user** with the email
   that matches `ADMIN_EMAIL`.
4. Copy the project URL, anon key and service_role key into `.env.local`
   (or Vercel env vars), set `ADMIN_EMAIL`, restart and open `/admin`.

Saving any content flushes the site cache (`revalidateTag("content")`), so the
public pages update immediately.

## Status

**Milestones 1–2 (done):** scaffold, tokens in CSS variables, theme switching (no flash), `/` + `/bn` with hreflang, home ported pixel-for-pixel from the approved mockup, all public pages (projects + case studies, blog, about, contact, testimonials, styled 404) with per-page bilingual SEO.

**Milestone 3 (code done):** Supabase schema + admin panel + mobile hamburger menu. Public pages read through the CMS layer (`src/lib/cms.ts`) with seed-data fallback; admin writes publish instantly via cache tag. The admin goes live once the Supabase project is created (steps above); the hero's CV button enables after a CV upload.

Next milestones: blog polish → testimonials contact form (public submissions + moderation) → contact form delivery → SEO layer (sitemap, robots, feeds) → performance pass → deploy.

Design reference: `../index.html` (approved mockup — do not restyle).
