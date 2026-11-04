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

See `.env.example`. Never commit real values — secrets go into Vercel env vars only.

- `NEXT_PUBLIC_SITE_URL` — canonical site URL; swap once the real domain is bought.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase values.
- `SUPABASE_SERVICE_ROLE_KEY` — **server only**, never expose to the browser.
- `RESEND_API_KEY`, `TURNSTILE_*` — for the contact-form milestone.

## Status

**Milestone 1 (done):** scaffold, design tokens in CSS variables, theme switching (system default + persisted + no flash), language switching (`/` + `/bn`, hreflang), home page ported pixel-for-pixel from the approved mockup.

Next milestones: remaining public pages → Supabase schema + admin panel → blog → testimonials → contact form → SEO layer → performance/SEO pass → deploy.

Design reference: `../index.html` (approved mockup — do not restyle).
