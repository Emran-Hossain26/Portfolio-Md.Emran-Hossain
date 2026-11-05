// ============================================================================
// Dev-only seed script: creates sample blog posts (draft, published,
// scheduled-future, scheduled-past) for local testing.
//
// GUARDS (this script can NEVER run against production):
//   1. Requires SEED_DEV=1 in the environment.
//   2. Refuses if NODE_ENV === "production".
//   3. Refuses if the Supabase URL contains "prod" or "production".
//   4. Requires --confirm flag on the command line.
//
// Usage:
//   SEED_DEV=1 node scripts/seed-blog-posts.mjs --confirm
// ============================================================================
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- Guards -----------------------------------------------------------------
if (process.env.SEED_DEV !== "1") {
  console.error("Refusing to run: set SEED_DEV=1 to confirm this is a dev seed.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run: NODE_ENV is production.");
  process.exit(1);
}
if (!process.argv.includes("--confirm")) {
  console.error("Refusing to run: pass --confirm to acknowledge this is destructive.");
  process.exit(1);
}

// Load .env.local manually (no dotenv dependency).
function loadEnv(path) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (/prod/i.test(url)) {
  console.error("Refusing to run: Supabase URL looks like production (" + url + ").");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const now = new Date();
const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
const past = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

const posts = [
  {
    slug: "seed-draft-post",
    title_en: "Draft Post (Seed)",
    title_bn: "ড্রাফ্ট পোস্ট (সিড)",
    body_en: "This is a **draft** post. It should not appear on the public site.",
    body_bn: "এটি একটি **ড্রাফ্ট** পোস্ট। পাবলিক সাইটে দেখা যাবে না।",
    meta_en: "Draft · seed",
    meta_bn: "ড্রাফ্ট · সিড",
    status: "draft",
    published: false,
    categories: ["seed"],
    tags: ["draft", "seed"],
  },
  {
    slug: "seed-published-post",
    title_en: "Published Post (Seed)",
    title_bn: "প্রকাশিত পোস্ট (সিড)",
    body_en: "This is a **published** post. It appears on the public site.",
    body_bn: "এটি একটি **প্রকাশিত** পোস্ট। পাবলিক সাইটে দেখা যাবে।",
    meta_en: "Published · seed",
    meta_bn: "প্রকাশিত · সিড",
    status: "published",
    published: true,
    categories: ["seed"],
    tags: ["published", "seed"],
  },
  {
    slug: "seed-scheduled-future",
    title_en: "Scheduled Future Post (Seed)",
    title_bn: "ভবিষ্যত শিডিউল পোস্ট (সিড)",
    body_en: "This post is **scheduled** for the future. Not visible yet.",
    body_bn: "এই পোস্টটি ভবিষ্যতে **শিডিউল** করা। এখনো দেখা যাবে না।",
    meta_en: "Scheduled · seed",
    meta_bn: "শিডিউল · সিড",
    status: "scheduled",
    published: false,
    scheduled_at: future,
    categories: ["seed"],
    tags: ["scheduled", "seed"],
  },
  {
    slug: "seed-scheduled-past",
    title_en: "Scheduled Past Post (Seed)",
    title_bn: "অতীত শিডিউল পোস্ট (সিড)",
    body_en: "This post was **scheduled in the past**. The cron job should flip it to published.",
    body_bn: "এই পোস্টটি **অতীতে শিডিউল** করা ছিল। ক্রন জব এটিকে প্রকাশিত করবে।",
    meta_en: "Scheduled (past) · seed",
    meta_bn: "শিডিউল (অতীত) · সিড",
    status: "scheduled",
    published: false,
    scheduled_at: past,
    categories: ["seed"],
    tags: ["scheduled", "seed"],
  },
];

async function main() {
  console.log("Seeding", posts.length, "sample posts...");
  for (const p of posts) {
    const { error } = await db.from("posts").upsert(p, { onConflict: "slug" });
    if (error) {
      console.error("Failed:", p.slug, error.message);
    } else {
      console.log("  OK:", p.slug, "→", p.status);
    }
  }
  console.log("Done. Run the cron route to flip 'seed-scheduled-past' to published.");
}

main().catch((e) => { console.error(e); process.exit(1); });