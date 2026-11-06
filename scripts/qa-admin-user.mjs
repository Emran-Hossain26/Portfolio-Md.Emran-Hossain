// One-off QA helper (Session 2 smoke test): create/delete a temporary admin
// auth user + admins row so the panel can be exercised end-to-end without
// the owner's password. Dev-only; requires SEED_DEV=1 and --confirm.
// Usage:
//   SEED_DEV=1 node scripts/qa-admin-user.mjs --confirm --create
//   SEED_DEV=1 node scripts/qa-admin-user.mjs --confirm --delete
import { readFileSync } from "node:fs";

if (process.env.SEED_DEV !== "1" || !process.argv.includes("--confirm")) {
  console.error("Refusing: needs SEED_DEV=1 and --confirm");
  process.exit(1);
}
if (process.env.NODE_ENV === "production") {
  console.error("Refusing: production");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const EMAIL = "qa-session2@emran-portfolio-test.local";
const PASSWORD = "Qa-Session2-" + Math.random().toString(36).slice(2, 10) + "!7";

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function findUser() {
  // The ?email= filter is unreliable on some projects and can return an
  // unrelated user — page through and match the exact email client-side.
  let page = 1;
  for (; page <= 20; page++) {
    const res = await fetch(
      `${URL_BASE}/auth/v1/admin/users?page=${page}&per_page=50`,
      { headers },
    );
    const json = await res.json();
    const users = json?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === EMAIL);
    if (hit) return hit;
    if (users.length < 50) return null;
  }
  return null;
}

if (process.argv.includes("--delete")) {
  const user = await findUser();
  if (user) {
    const res = await fetch(`${URL_BASE}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers,
    });
    console.log("delete auth user:", res.status);
  } else {
    console.log("no auth user found");
  }
  // Remove any leftover admins row.
  const rest = await fetch(`${URL_BASE}/rest/v1/admins?email=eq.${encodeURIComponent(EMAIL)}`, {
    method: "DELETE",
    headers,
  });
  console.log("delete admins row:", rest.status);
  process.exit(0);
}

if (process.argv.includes("--create")) {
  let user = await findUser();
  if (user) {
    console.error(`Refusing: ${EMAIL} already exists (id ${user.id}). Nothing created.`);
    process.exit(1);
  }
  {
    const res = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
    });
    const json = await res.json();
    if (!res.ok || !json?.id || json.email?.toLowerCase() !== EMAIL) {
      console.error("create failed:", JSON.stringify(json).slice(0, 300));
      process.exit(1);
    }
    user = json;
  }
  // Upsert into admins (service role bypasses RLS).
  const up = await fetch(`${URL_BASE}/rest/v1/admins`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: user.id, email: EMAIL }),
  });
  console.log("admins upsert:", up.status);
  console.log("QA_EMAIL=" + EMAIL);
  console.log("QA_PASSWORD=" + PASSWORD);
  process.exit(0);
}

console.error("Pass --create or --delete");
process.exit(1);
