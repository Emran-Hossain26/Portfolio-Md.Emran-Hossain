import { readFileSync, writeFileSync } from "node:fs";

const f = "src/app/(admin)/actions.ts";
let s = readFileSync(f, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const j = (t) => t.split("\n").join(nl);

// imports: security lib + headers for IP
const oldImp = j(`import { requireAdmin } from "@/lib/supabase/admin-auth";`);
const newImp = j(`import { requireAdmin } from "@/lib/supabase/admin-auth";
import { checkLockout, recordAttempt } from "@/lib/security";
import { headers } from "next/headers";`);
if (s.includes(oldImp)) s = s.replace(oldImp, newImp);
else console.log("IMP MISS");

const oldAction = j(`export async function loginAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const allowed = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  if (error || !data.user) redirect("/login?error=auth");
  if (allowed && data.user.email?.toLowerCase() !== allowed) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }
  // Only admins-table members (is_admin() = true) may enter the panel.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }
  redirect("/admin");
}`);

const newAction = j(`export async function loginAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);

  const identifierInput = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim()
    || (await headers()).get("x-real-ip")
    || "unknown";

  // Stage 6: "username or email" — a value without "@" is resolved to the
  // account email via profiles.username, server-side. Unknown user and
  // wrong password return the SAME generic error.
  let email = identifierInput;
  if (identifierInput && !identifierInput.includes("@")) {
    const db = createServiceClient();
    const { data: profile } = await db
      .from("profiles")
      .select("id,email")
      .ilike("username", identifierInput)
      .maybeSingle();
    if (!profile?.email) {
      await recordAttempt("username:" + identifierInput.toLowerCase(), ip, false);
      redirect("/login?error=auth");
    }
    email = String((profile as { email: string }).email);
  }

  // Stage 6: durable rate limit + progressive lockout (login_attempts table).
  const identifier = email.toLowerCase() || "unknown";
  const verdict = await checkLockout(identifier, ip);
  if (verdict.locked) {
    await recordAttempt(identifier, ip, false);
    redirect("/login?error=auth");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const allowed = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  if (error || !data.user) {
    const failures = await recordAttempt(identifier, ip, false);
    await logAdminAction(null, failures >= 5 ? "login_locked" : "login_failed", "auth", identifier);
    redirect("/login?error=auth");
  }
  if (allowed && data.user.email?.toLowerCase() !== allowed) {
    await supabase.auth.signOut();
    await recordAttempt(identifier, ip, false);
    await logAdminAction(null, "login_failed", "auth", identifier);
    redirect("/login?error=unauthorized");
  }
  // Only admins-table members (is_admin() = true) may enter the panel.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    await recordAttempt(identifier, ip, false);
    await logAdminAction(null, "login_failed", "auth", identifier);
    redirect("/login?error=unauthorized");
  }
  await recordAttempt(identifier, ip, true);
  await logAdminAction({ id: data.user.id, email: data.user.email }, "login_success", "auth", identifier);
  redirect("/admin");
}`);

if (s.includes(oldAction)) {
  s = s.replace(oldAction, newAction);
  writeFileSync(f, s);
  console.log("loginAction rewritten");
} else console.log("LOGIN MISS");
