"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { checkLockout, recordAttempt, sha256 } from "@/lib/security";
import { headers } from "next/headers";
import { logAdminAction, auditValue } from "@/lib/audit";
import { sendEmail, emailHtml, escapeHtml } from "@/lib/email";

export const preferredRegion = "icn1"; // co-located with the Supabase Seoul region — cuts DB round-trip latency

/* ------------------------------------------------------------------ */
/* Whitelisted admin-writable tables + columns                          */
/* ------------------------------------------------------------------ */

type FieldType = "text" | "bool" | "int" | "tags" | "jsonb";
type TableSpec = Record<string, FieldType>;

const TABLES: Record<string, TableSpec> = {
  projects: {
    slug: "text",
    title_en: "text",
    title_bn: "text",
    problem_en: "text",
    problem_bn: "text",
    solution_en: "text",
    solution_bn: "text",
    result_en: "text",
    result_bn: "text",
    metrics: "jsonb",
    tech: "tags",
    media: "text",
    video: "text",
    demo_url: "text",
    slides: "jsonb",
    published: "bool",
    sort_order: "int",
  },
  posts: {
    slug: "text",
    bn_slug: "text",
    title_en: "text",
    title_bn: "text",
    cover_url: "text",
    meta_en: "text",
    meta_bn: "text",
    body_en: "text",
    body_bn: "text",

    status: "text",
    scheduled_at: "text",
    categories: "tags",
    tags: "tags",
    seo_title_en: "text",
    seo_title_bn: "text",
    seo_desc_en: "text",
    seo_desc_bn: "text",
    og_image: "text",
    canonical: "text",
    noindex: "bool",
  },
  testimonials: {
    name: "text",
    company: "text",
    quote_en: "text",
    quote_bn: "text",
    status: "text",
  },
  experience: {
    role_en: "text",
    role_bn: "text",
    org_en: "text",
    org_bn: "text",
    period: "text",
    details: "text",
    sort: "int",
  },
  education: {
    degree_en: "text",
    degree_bn: "text",
    org_en: "text",
    org_bn: "text",
    period: "text",
    sort: "int",
  },
  services: {
    title_en: "text",
    title_bn: "text",
    desc_en: "text",
    desc_bn: "text",
    icon: "text",
    price: "text",
    published: "bool",
    sort_order: "int",
  },
  skills: {
    name: "text",
    category: "text",
    level: "int",
    published: "bool",
    sort_order: "int",
  },
  certifications: {
    title_en: "text",
    title_bn: "text",
    issuer_en: "text",
    issuer_bn: "text",
    year: "text",
    href: "text",
    published: "bool",
    sort_order: "int",
  },
  faqs: {
    q_en: "text",
    q_bn: "text",
    a_en: "text",
    a_bn: "text",
    published: "bool",
    sort_order: "int",
  },
  stats: {
    value: "text",
    label_en: "text",
    label_bn: "text",
    published: "bool",
    sort_order: "int",
  },
  social_links: {
    platform: "text",
    url: "text",
    label_en: "text",
    label_bn: "text",
    published: "bool",
    sort_order: "int",
  },
  contact_info: {
    email: "text",
    phone: "text",
    location_en: "text",
    location_bn: "text",
    availability_en: "text",
    availability_bn: "text",
  },
  sections: {
    key: "text",
    sort_order: "int",
    enabled: "bool",
  },
  messages: {
    status: "text",
  },
  now_items: {
    kind: "text",
    text_en: "text",
    text_bn: "text",
    published: "bool",
    sort: "int",
  },
  booking_slots: {
    slot_date: "text",
    slot_time: "text",
    capacity: "int",
    booked: "int",
    note: "text",
    published: "bool",
  },
  media_assets: {
    alt_en: "text",
    alt_bn: "text",
  },
  redirects: {
    from_url: "text",
    to_url: "text",
    permanent: "bool",
  },
};

const CONFIGURED_ERROR = "/login?reason=notconfigured";

function parse(spec: TableSpec, formData: FormData) {
  const row: Record<string, unknown> = {};
  for (const [col, type] of Object.entries(spec)) {
    switch (type) {
      case "bool":
        row[col] = formData.get(col) === "on" || formData.get(col) === "true";
        break;
      case "int": {
        const n = Number(formData.get(col) ?? 0);
        row[col] = Number.isFinite(n) ? Math.trunc(n) : 0;
        break;
      }
      case "tags":
        row[col] = String(formData.get(col) ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "jsonb": {
        // Case-study metrics (Stage 6): [{label, value}] from a JSON textarea.
        if (col === "metrics") {
          let parsedMetrics: unknown = [];
          try {
            parsedMetrics = JSON.parse(String(formData.get(col) ?? "") || "[]");
          } catch {}
          row[col] = Array.isArray(parsedMetrics)
            ? (parsedMetrics as unknown[])
                .filter((m) => typeof m === "object" && m !== null)
                .map((m) => ({
                  label: String((m as { label?: unknown }).label ?? "").trim().slice(0, 80),
                  value: String((m as { value?: unknown }).value ?? "").trim().slice(0, 40),
                }))
                .filter((m) => m.label && m.value)
            : [];
          break;
        }
        // Slides list: {src, caption_en, caption_bn} — an empty/missing src is
        // KEPT as a caption-only slide (rendered as the mockup placeholder);
        // only non-object junk is dropped (4c: never a broken image).
        let parsed: unknown = [];
        try {
          parsed = JSON.parse(String(formData.get(col) ?? "") || "[]");
        } catch {}
        row[col] = Array.isArray(parsed)
          ? (parsed as unknown[])
              .filter((s) => typeof s === "object" && s !== null)
              .map((s) => s as { src?: unknown; caption_en?: unknown; caption_bn?: unknown })
              .map((s) => ({
                src: typeof s.src === "string" ? s.src.trim().slice(0, 1024) : "",
                caption_en: String(s.caption_en ?? "").slice(0, 300),
                caption_bn: String(s.caption_bn ?? "").slice(0, 300),
              }))
          : [];
        break;
      }
      default:
        row[col] = String(formData.get(col) ?? "").slice(0, 50000);
    }
  }
  return row;
}

function refresh() {
  // Server-action context: read-your-own-writes expiry (no stale window).
  updateTag("content");
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function loginAction(formData: FormData) {
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
}

export async function logoutAction() {
  if (!adminConfigured()) redirect("/");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/* ------------------------------------------------------------------ */
/* Generic row editors (projects, posts, testimonials, CV sections)    */
/* ------------------------------------------------------------------ */

export async function saveRowAction(table: string, id: string, formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();

  const spec = TABLES[table];
  if (!spec) throw new Error(`Unknown table: ${table}`);

  // Redirect-specific validation.
  if (table === "redirects") {
    const fromRaw = String(formData.get("from_url") ?? "").trim();
    const toRaw = String(formData.get("to_url") ?? "").trim();
    const from = fromRaw.replace(/\/+$/, "") || "/";
    const to = toRaw.replace(/\/+$/, "") || toRaw;
    if (!from.startsWith("/")) {
      redirect("/admin/redirects?error=from");
    }
    const isRelative = to.startsWith("/");
    const isHttps = /^https:\/\//i.test(to);
    if (!isRelative && !isHttps) {
      redirect("/admin/redirects?error=to");
    }
    if (from === to) {
      redirect("/admin/redirects?error=same");
    }
    if (to.startsWith("/admin") || to.startsWith("/api")) {
      redirect("/admin/redirects?error=target");
    }
    // Chain/loop check: follow the chain from `to`.
    const db = createServiceClient();
    const { data: existing } = await db.from("redirects").select("from_url,to_url");
    const map = new Map((existing ?? []).map((r) => [r.from_url as string, r.to_url as string]));
    // Remove current row from map when editing (so self-update doesn't false-positive).
    if (id !== "__new") {
      const { data: self } = await db.from("redirects").select("from_url").eq("id", id).maybeSingle();
      if (self?.from_url) map.delete(self.from_url as string);
    }
    // Follow chain.
    let cur = to;
    let hops = 0;
    const seen = new Set<string>();
    while (map.has(cur)) {
      if (seen.has(cur)) {
        // loop
        redirect("/admin/redirects?error=loop");
      }
      seen.add(cur);
      cur = map.get(cur)!;
      hops += 1;
      if (hops > 2) {
        redirect("/admin/redirects?error=chain");
      }
    }
    // Also reject if `to` equals an existing `from` that leads back to `from` (loop of 2).
    if (cur === from) {
      redirect("/admin/redirects?error=loop");
    }
    // Write normalised values back into formData so they're saved.
    formData.set("from_url", from);
    formData.set("to_url", to);
  }

  const row = parse(spec, formData);

  const db = createServiceClient();
  if (table === "posts" && id === "__new") {
    await db.from(table).insert({ ...row, updated_at: new Date().toISOString() });
  } else if (id === "__new") {
    await db.from(table).insert(row);
  } else {
    await db.from(table).update(row).eq("id", id);
  }
  await logAdminAction(
    user,
    id === "__new" ? "create" : "update",
    table,
    id === "__new" ? "(new row)" : id,
    null,
    auditValue(row),
  );
  refresh();
  redirect(`/admin/${table === "education" ? "education" : table}`);
}

export async function deleteRowAction(table: string, id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  // Protected seed row for testimonials placeholders needs no special-case:
  // the admin decides which rows to remove.
  await createServiceClient().from(table).delete().eq("id", id);
  await logAdminAction(user, "delete", table, id);
  refresh();
  redirect(`/admin/${table === "education" ? "education" : table}`);
}

/* ------------------------------------------------------------------ */
/* Hero texts (site_settings: hero_texts)                              */
/* ------------------------------------------------------------------ */

export async function saveTextsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();

  const value = {
    en: {
      heading: String(formData.get("hero_heading_en") ?? ""),
      intro: String(formData.get("hero_intro_en") ?? ""),
    },
    bn: {
      heading: String(formData.get("hero_heading_bn") ?? ""),
      intro: String(formData.get("hero_intro_bn") ?? ""),
    },
    // Stage 6 mockup parity: button label + availability chip toggle
    cta: {
      en: String(formData.get("cta_en") ?? "").trim(),
      bn: String(formData.get("cta_bn") ?? "").trim(),
    },
    avail: formData.get("avail") === "on",
  };
  await createServiceClient()
    .from("site_settings")
    .upsert({ key: "hero_texts", value }, { onConflict: "key" });
  await logAdminAction(user, "update", "site_settings", "hero_texts", null, auditValue(value));
  refresh();
  redirect("/admin/texts");
}

/* ------------------------------------------------------------------ */
/* Theme colours (site_settings: theme_light / theme_dark)             */
/* ------------------------------------------------------------------ */

const HEX = /^#[0-9a-fA-F]{6}$/;

async function upsertTheme(key: string, json: string) {
  const raw = JSON.parse(json) as Record<string, string>;
  const value: Record<string, string> = {};
  for (const token of ["accent", "bg", "panel", "ink", "mute", "line"]) {
    const v = raw[token];
    if (typeof v === "string" && HEX.test(v)) value[token] = v.toLowerCase();
  }
  await createServiceClient()
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
}

export async function saveThemeAction(lightJson: string, darkJson: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  await upsertTheme("theme_light", lightJson);
  await upsertTheme("theme_dark", darkJson);
  await logAdminAction(user, "update", "site_settings", "theme_light/theme_dark");
  refresh();
  redirect("/admin/theme?saved=1");
}

/* ------------------------------------------------------------------ */
/* CV upload (storage bucket "cv" → site_settings: cv_path)            */
/* ------------------------------------------------------------------ */

export async function saveCvAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/cv?error=empty");
  if (file.size > 8 * 1024 * 1024) redirect("/admin/cv?error=size");

  const ext = file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
  const path = `cv/cv.${ext}`;

  const db = createServiceClient();
  const { error } = await db.storage
    .from("cv")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) redirect("/admin/cv?error=upload");

  const { data } = db.storage.from("cv").getPublicUrl(path);
  await db
    .from("site_settings")
    .upsert(
      { key: "cv_path", value: { url: data.publicUrl } },
      { onConflict: "key" },
    );
  await logAdminAction(user, "update", "site_settings", "cv_path", null, { url: data.publicUrl });
  refresh();
  redirect("/admin/cv");
}

export async function removeCvAction() {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  await createServiceClient()
    .from("site_settings")
    .delete()
    .eq("key", "cv_path");
  await logAdminAction(user, "delete", "site_settings", "cv_path");
  refresh();
  redirect("/admin/cv");
}

/* ------------------------------------------------------------------ */
/* Per-page SEO overrides (page_seo)                                   */
/* ------------------------------------------------------------------ */

const SEO_PATHS = ["/", "/projects", "/blog", "/about", "/contact", "/testimonials"];

export async function saveSeoAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();

  const path = String(formData.get("__path") ?? "");
  const bangla = formData.get("__lang") === "bn";
  if (!SEO_PATHS.includes(path)) throw new Error("Unknown SEO path");

  const db = createServiceClient();
  const lang = bangla ? "bn" : "en";
  const payload = {
    path,
    lang,
    title: String(formData.get("title") ?? "").slice(0, 60),
    description: String(formData.get("description") ?? "").slice(0, 160),
  };
  // page_seo has a composite PK (path, lang); upsert replaces the whole row,
  // so read first and delete missing-language rows are not needed here.
  const { data: existing } = await db
    .from("page_seo")
    .select("path")
    .eq("path", path)
    .eq("lang", lang)
    .maybeSingle();
  if (existing) {
    await db
      .from("page_seo")
      .update({ title: payload.title, description: payload.description })
      .eq("path", path)
      .eq("lang", lang);
  } else {
    await db.from("page_seo").insert(payload);
  }
  await logAdminAction(user, "update", "page_seo", `${path} (${lang})`, null, auditValue(payload));
  refresh();
  redirect("/admin/seo");
}

/* ------------------------------------------------------------------ */
/* SEO settings (global defaults, verification codes)                  */
/* ------------------------------------------------------------------ */

export async function saveSeoSettingsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();
  const value = {
    title_template: String(formData.get("title_template") ?? "").trim(),
    default_description_en: String(formData.get("default_description_en") ?? "").trim(),
    default_description_bn: String(formData.get("default_description_bn") ?? "").trim(),
    gsc_verification: String(formData.get("gsc_verification") ?? "").trim(),
    bing_verification: String(formData.get("bing_verification") ?? "").trim(),
    analytics_id: String(formData.get("analytics_id") ?? "").trim(),
  };
  await db.from("site_settings").upsert(
    { key: "seo_settings", value },
    { onConflict: "key" },
  );
  await logAdminAction(user, "update", "site_settings", "seo_settings", null, auditValue(value));
  refresh();
  redirect("/admin/seo?saved=1");
}

/* ------------------------------------------------------------------ */
/* Stage 1: section reorder, message status, media upload/delete        */
/* ------------------------------------------------------------------ */

export async function moveSectionAction(key: string, direction: "up" | "down") {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  const db = createServiceClient();
  const { data: rows } = await db
    .from("sections")
    .select("key,sort_order")
    .order("sort_order");
  if (!rows?.length) redirect("/admin/sections");
  const idx = rows.findIndex((r) => r.key === key);
  if (idx < 0) redirect("/admin/sections");
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) redirect("/admin/sections");
  const a = rows[idx], b = rows[swapIdx];
  await db.from("sections").update({ sort_order: b.sort_order }).eq("key", a.key);
  await db.from("sections").update({ sort_order: a.sort_order }).eq("key", b.key);
  refresh();
  redirect("/admin/sections");
}

export async function updateMessageStatusAction(id: string, status: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const allowed = ["new", "read", "replied", "spam"];
  if (!allowed.includes(status)) redirect("/admin/inbox");
  await createServiceClient().from("messages").update({ status }).eq("id", id);
  await logAdminAction(user, "update", "messages", id, null, { status });
  refresh();
  redirect("/admin/inbox");
}

export async function saveContactInfoAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();
  const payload = {
    key: "main",
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    location_en: String(formData.get("location_en") ?? "").trim(),
    location_bn: String(formData.get("location_bn") ?? "").trim(),
    availability_en: String(formData.get("availability_en") ?? "").trim(),
    availability_bn: String(formData.get("availability_bn") ?? "").trim(),
  };
  const { data: existing } = await db
    .from("contact_info")
    .select("id")
    .eq("key", "main")
    .maybeSingle();
  if (existing) {
    await db.from("contact_info").update(payload).eq("key", "main");
  } else {
    await db.from("contact_info").insert(payload);
  }
  await logAdminAction(user, "update", "contact_info", "main", null, auditValue(payload));
  refresh();
  redirect("/admin/contact-info?saved=1");
}

export async function uploadMediaAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/media?error=empty");
  if (file.size > 8 * 1024 * 1024) redirect("/admin/media?error=size");
  const db = createServiceClient();
  // Stage 6 item 6: allowlist the extension AND the content type; the
  // original filename is discarded (path is timestamp+random, no traversal).
  const MIME_EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
  };
  const ext = MIME_EXT[file.type];
  if (!ext) redirect("/admin/media?error=type");
  const path = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await db.storage
    .from("media")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (upErr) redirect("/admin/media?error=upload");
  const { data } = db.storage.from("media").getPublicUrl(path);
  await db.from("media_assets").insert({
    bucket: "media",
    path,
    url: data.publicUrl,
    alt_en: String(formData.get("alt_en") ?? "").trim(),
    alt_bn: String(formData.get("alt_bn") ?? "").trim(),
    mime_type: file.type,
    size_bytes: file.size,
  });
  await logAdminAction(user, "create", "media_assets", path, null, { url: data.publicUrl });
  refresh();
  redirect("/admin/media?saved=1");
}

export async function deleteMediaAction(id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();
  const { data } = await db.from("media_assets").select("path").eq("id", id).maybeSingle();
  if (data?.path) await db.storage.from("media").remove([data.path as string]);
  await db.from("media_assets").delete().eq("id", id);
  await logAdminAction(user, "delete", "media_assets", id, null, { path: data?.path });
  refresh();
  redirect("/admin/media");
}

/* ------------------------------------------------------------------ */
/* Stage 5: Effects Manager (site_settings: effects_settings)          */
/* ------------------------------------------------------------------ */

export async function saveEffectsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const on = (k: string) => formData.get(k) === "on";
  const value: Record<string, unknown> = {
    master: on("master"),
    default_mode: formData.get("default_mode") === "lite" ? "lite" : "full",
    touch_disable: on("touch_disable"),
    intensity: formData.get("intensity") === "low" ? "low" : formData.get("intensity") === "high" ? "high" : "medium",
    override_reduced: on("override_reduced"),
    agentCursorCount: Math.max(4, Math.min(24, Number(formData.get("agentCursorCount") ?? 12) || 12)),
    agentCursorSpeed: Math.max(1, Math.min(3, Number(formData.get("agentCursorSpeed") ?? 1.8) || 1.8)),
  };
  for (const k of ["mascot","trail","ripple","magnetic","comet","fairy","rune","firefly","tilt","parallax","scramble","counters","shimmer","cardGlow","sparkleBurst","floaters","aurora","network","starField","nebula","sparkleField","swarm"]) {
    value[k] = on(k);
  }
  const db = createServiceClient();
  await db.from("site_settings").upsert({ key: "effects_settings", value }, { onConflict: "key" });
  await logAdminAction(user, "update", "site_settings", "effects_settings", null, auditValue(value));
  refresh();
  redirect("/admin/effects?saved=1");
}

/* ------------------------------------------------------------------ */
/* Stage 5.2: hero editor + maintenance mode                           */
/* ------------------------------------------------------------------ */

export async function saveHeroTextsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const value = {
    heading: {
      en: String(formData.get("heading_en") ?? "").trim(),
      bn: String(formData.get("heading_bn") ?? "").trim(),
    },
    intro: {
      en: String(formData.get("intro_en") ?? "").trim(),
      bn: String(formData.get("intro_bn") ?? "").trim(),
    },
    // Stage 6 mockup parity: button label + availability chip toggle
    cta: {
      en: String(formData.get("cta_en") ?? "").trim(),
      bn: String(formData.get("cta_bn") ?? "").trim(),
    },
    avail: formData.get("avail") === "on",
  };
  await createServiceClient()
    .from("site_settings")
    .upsert({ key: "hero_texts", value }, { onConflict: "key" });
  await logAdminAction(user, "update", "site_settings", "hero_texts", null, auditValue(value));
  refresh();
  redirect("/admin/hero?saved=1");
}

export async function saveMaintenanceAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const on = formData.get("maintenance") === "on";
  await createServiceClient()
    .from("site_settings")
    .upsert(
      { key: "maintenance_mode", value: { enabled: on } },
      { onConflict: "key" },
    );
  await logAdminAction(user, "update", "site_settings", "maintenance_mode", null, { enabled: on });
  refresh();
  redirect("/admin/system?saved=1");
}

/* ------------------------------------------------------------------ */
/* Session 2: branding / footer / about (site_settings KV)             */
/* ------------------------------------------------------------------ */

export async function saveBrandingAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();

  // Preserve the badge (managed by its own upload form) unless removal is ticked.
  const { data: existing } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "branding")
    .maybeSingle();
  const prev = (existing?.value ?? {}) as { badge_url?: string };
  const removeBadge = formData.get("remove_badge") === "on";

  const branding = {
    brand_en: String(formData.get("brand_en") ?? "").trim().slice(0, 60),
    brand_bn: String(formData.get("brand_bn") ?? "").trim().slice(0, 60),
    badge_url: removeBadge ? "" : String(prev.badge_url ?? "").trim(),
  };
  const footerText = {
    en: String(formData.get("footer_en") ?? "").trim().slice(0, 300),
    bn: String(formData.get("footer_bn") ?? "").trim().slice(0, 300),
  };
  const aboutTexts = {
    en: String(formData.get("about_en") ?? "").trim().slice(0, 20000),
    bn: String(formData.get("about_bn") ?? "").trim().slice(0, 20000),
  };

  await db.from("site_settings").upsert({ key: "branding", value: branding }, { onConflict: "key" });
  await db.from("site_settings").upsert({ key: "footer_text", value: footerText }, { onConflict: "key" });
  await db.from("site_settings").upsert({ key: "about_texts", value: aboutTexts }, { onConflict: "key" });
  await logAdminAction(
    user,
    "update",
    "site_settings",
    "branding/footer_text/about_texts",
    null,
    { branding, footer: footerText, aboutChars: { en: aboutTexts.en.length, bn: aboutTexts.bn.length } },
  );
  refresh();
  redirect("/admin/branding?saved=1");
}

export async function saveBrandBadgeAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const file = formData.get("badge");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/branding?error=empty");
  if (file.size > 2 * 1024 * 1024) redirect("/admin/branding?error=size");

  const okTypes: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  const ext = okTypes[file.type];
  if (!ext) redirect("/admin/branding?error=type");

  const db = createServiceClient();
  const path = `brand/badge.${ext}`;
  const { error } = await db.storage
    .from("media")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) redirect("/admin/branding?error=upload");

  const { data } = db.storage.from("media").getPublicUrl(path);

  const { data: existing } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "branding")
    .maybeSingle();
  const prev = (existing?.value ?? {}) as { brand_en?: string; brand_bn?: string };
  const branding = {
    brand_en: String(prev.brand_en ?? ""),
    brand_bn: String(prev.brand_bn ?? ""),
    badge_url: data.publicUrl,
  };
  await db.from("site_settings").upsert({ key: "branding", value: branding }, { onConflict: "key" });
  await logAdminAction(user, "update", "site_settings", "branding.badge_url", null, { badge_url: data.publicUrl });
  refresh();
  redirect("/admin/branding?saved=1");
}

/* ------------------------------------------------------------------ */
/* Session 2: admin profile (name, avatar) + password change           */
/* ------------------------------------------------------------------ */

export async function saveAdminProfileAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();

  const { data: existing } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "admin_profile")
    .maybeSingle();
  const prev = (existing?.value ?? {}) as { avatar_url?: string };

  const value: { display_name: string; avatar_url: string } = {
    display_name: String(formData.get("display_name") ?? "").trim().slice(0, 80),
    avatar_url: prev.avatar_url ?? "",
  };

  if (formData.get("remove_avatar") === "on") {
    value.avatar_url = "";
  }

  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (file.size > 4 * 1024 * 1024) redirect("/admin/profile?error=size");
    const okTypes: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };
    const ext = okTypes[file.type];
    if (!ext) redirect("/admin/profile?error=type");
    const path = `avatar/avatar-${Date.now()}.${ext}`;
    const { error } = await db.storage
      .from("media")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) redirect("/admin/profile?error=upload");
    const { data } = db.storage.from("media").getPublicUrl(path);
    value.avatar_url = data.publicUrl;
  }

  await db
    .from("site_settings")
    .upsert({ key: "admin_profile", value }, { onConflict: "key" });
  await logAdminAction(user, "update", "site_settings", "admin_profile", null, {
    display_name: value.display_name,
    avatar_changed: Boolean(file instanceof File && file.size > 0) || formData.get("remove_avatar") === "on",
  });
  refresh();
  redirect("/admin/profile?saved=1");
}

export async function changePasswordAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();

  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  if (next.length < 8) redirect("/admin/profile?error=short");

  const supabase = await createSupabaseServerClient();
  // Re-authenticate with the current password before allowing a change.
  const { error: reauth } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: current,
  });
  if (reauth) redirect("/admin/profile?error=current");

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) redirect("/admin/profile?error=update");
  await logAdminAction(user, "password_change", "auth_user", user.id);
  redirect("/admin/profile?saved=1");
}

/* ------------------------------------------------------------------ */
/* Session 2: two-factor login (TOTP gate AFTER password login — the   */
/* login page itself is never touched)                                 */
/* ------------------------------------------------------------------ */

const A2FA_COOKIE = "a2fa";
const TOTP_ISSUER = "Portfolio Admin";

async function adminsRow(db: ReturnType<typeof createServiceClient>, userId: string) {
  const { data } = await db
    .from("admins")
    .select("id,email,totp_secret,totp_enabled")
    .eq("id", userId)
    .maybeSingle();
  return (data ?? null) as
    | { id: string; email: string; totp_secret: string | null; totp_enabled: boolean }
    | null;
}

function totpFor(secretBase32: string, label: string): TOTP {
  return new TOTP({
    issuer: TOTP_ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

async function setA2faSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  await createServiceClient()
    .from("admins")
    .update({ totp_session_hash: hash })
    .eq("id", userId);
  const jar = await cookies();
  jar.set(A2FA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

/** Generates (or regenerates) the TOTP secret; the profile page then shows
 *  the QR + confirm form while totp_enabled is still false. */
export async function startTwoFactorSetupAction() {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();
  const row = await adminsRow(db, user.id);
  if (row?.totp_enabled) redirect("/admin/profile");

  const secret = new Secret({ size: 20 });
  await db
    .from("admins")
    .update({ totp_secret: secret.base32, totp_session_hash: null })
    .eq("id", user.id);
  await logAdminAction(user, "2fa_secret_generated", "admins", user.id);
  redirect("/admin/profile?setup=1");
}

export async function confirmTwoFactorAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();

  const db = createServiceClient();
  const row = await adminsRow(db, user.id);
  if (!row?.totp_secret) redirect("/admin/profile?error=setup");
  if (row.totp_enabled) redirect("/admin/profile");

  const totp = totpFor(row.totp_secret, row.email || user.email || "admin");
  const valid = code ? totp.validate({ token: code, window: 1 }) !== null : false;
  if (!valid) redirect("/admin/profile?error=code");

  await db.from("admins").update({ totp_enabled: true }).eq("id", user.id);
  await setA2faSession(user.id);
  await logAdminAction(user, "2fa_enabled", "admins", user.id);
  refresh();
  redirect("/admin/profile?saved=1");
}

export async function disableTwoFactorAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();

  const db = createServiceClient();
  const row = await adminsRow(db, user.id);
  if (!row?.totp_enabled) redirect("/admin/profile");
  if (!row.totp_secret) redirect("/admin/profile?error=setup");

  const totp = totpFor(row.totp_secret!, row.email || user.email || "admin");
  const valid = code ? totp.validate({ token: code, window: 1 }) !== null : false;
  if (!valid) redirect("/admin/profile?error=code");

  await db
    .from("admins")
    .update({ totp_enabled: false, totp_secret: null, totp_session_hash: null })
    .eq("id", user.id);
  const jar = await cookies();
  jar.delete(A2FA_COOKIE);
  await logAdminAction(user, "2fa_disabled", "admins", user.id);
  refresh();
  redirect("/admin/profile?saved=1");
}

/* ------------------------------------------------------------------ */
/* Session 2: inbox quick reply + email notifications (Resend)         */
/* ------------------------------------------------------------------ */

export async function sendQuickReplyAction(id: string, formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const reply = String(formData.get("reply") ?? "").trim();
  if (!reply) redirect("/admin/inbox?error=empty");

  const db = createServiceClient();
  const { data: msg } = await db
    .from("messages")
    .select("name,email,subject")
    .eq("id", id)
    .maybeSingle();
  if (!msg?.email) redirect("/admin/inbox?error=notfound");

  const res = await sendEmail({
    to: String(msg.email),
    replyTo: process.env.ADMIN_EMAIL || undefined,
    subject: msg.subject ? `Re: ${msg.subject}` : "Re: your message",
    html: emailHtml(
      "Reply to your message",
      `<p>Hi ${escapeHtml(String(msg.name || "there"))},</p><p>${escapeHtml(reply).replaceAll("\n", "<br/>")}</p>`,
    ),
  });
  if (!res.ok) {
    redirect(`/admin/inbox?error=email${res.error ? `&detail=${encodeURIComponent(res.error.slice(0, 100))}` : ""}`);
  }

  await db.from("messages").update({ status: "replied" }).eq("id", id);
  await logAdminAction(user, "quick_reply", "messages", id, null, { to: msg.email, chars: reply.length });
  refresh();
  redirect("/admin/inbox?sent=1");
}

export async function sendTestEmailAction() {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const to = process.env.ADMIN_EMAIL || user.email || "";
  if (!to) redirect("/admin/system?emailerror=norecipient");
  const res = await sendEmail({
    to,
    subject: "Test email from your portfolio admin",
    html: emailHtml("It works 🎉", `<p>Email notifications are configured correctly.</p>`),
  });
  if (!res.ok) {
    redirect(`/admin/system?emailerror=${res.skipped ? "nokey" : "send"}`);
  }
  await logAdminAction(user, "test_email", "email", to);
  redirect("/admin/system?emailsent=1");
}

/* ------------------------------------------------------------------ */
/* Session 2: newsletter admin                                         */
/* ------------------------------------------------------------------ */

export async function toggleNewsletterAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const enabled = formData.get("newsletter") === "on";
  await createServiceClient()
    .from("site_settings")
    .upsert({ key: "newsletter_settings", value: { enabled } }, { onConflict: "key" });
  await logAdminAction(user, "update", "site_settings", "newsletter_settings", null, { enabled });
  refresh();
  redirect("/admin/newsletter?saved=1");
}

export async function deleteSubscriberAction(id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  await createServiceClient().from("newsletter_subscribers").delete().eq("id", id);
  await logAdminAction(user, "delete", "newsletter_subscribers", id);
  refresh();
  redirect("/admin/newsletter?deleted=1");
}

/* ------------------------------------------------------------------ */
/* Stage 6: module toggles (skills/now/terminal/palette/services/      */
/* booking/github/country badge) — one settings page saves all         */
/* ------------------------------------------------------------------ */

export async function saveModuleSettingsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const on = (k: string) => formData.get(k) === "on";
  const updates: Record<string, Record<string, unknown>> = {
    skills_settings: { enabled: on("skills") },
    now_settings: { enabled: on("now") },
    terminal_settings: { enabled: on("terminal") },
    palette_settings: { enabled: on("palette") },
    services_settings: { enabled: on("services"), quote_enabled: on("quote") },
    booking_settings: { enabled: on("booking") },
    country_badge: { enabled: on("country_badge") },
    speed_insights: { enabled: on("speed_insights") },
  };
  const db = createServiceClient();
  for (const [key, value] of Object.entries(updates)) {
    await db.from("site_settings").upsert({ key, value }, { onConflict: "key" });
  }
  const username = String(formData.get("github_username") ?? "").trim().slice(0, 60);
  await db
    .from("site_settings")
    .upsert(
      { key: "github_widget", value: { enabled: on("github"), username } },
      { onConflict: "key" },
    );
  await logAdminAction(user, "update", "site_settings", "stage6_module_settings", null, {
    ...updates,
    github_widget: { enabled: on("github"), username },
  });
  refresh();
  redirect("/admin/extras?saved=1");
}

/* ------------------------------------------------------------------ */
/* Stage 6 mockup parity: quick review moderation + inbox CSV           */
/* ------------------------------------------------------------------ */

export async function setTestimonialStatusAction(id: string, status: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const allowed = ["pending", "approved", "hidden"];
  if (!allowed.includes(status)) redirect("/admin/testimonials");
  await createServiceClient().from("testimonials").update({ status }).eq("id", id);
  await logAdminAction(user, "update", "testimonials", id, null, { status });
  refresh();
  redirect("/admin/testimonials");
}

/* ------------------------------------------------------------------ */
/* Stage 6 mockup parity: visitor themes manager (enable/default/switch)*/
/* ------------------------------------------------------------------ */

export async function saveThemeVisitorSwitchAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const on = formData.get("visitor_switch") === "on";
  await createServiceClient()
    .from("site_settings")
    .upsert({ key: "theme_visitor_switch", value: { enabled: on } }, { onConflict: "key" });
  await logAdminAction(user, "update", "site_settings", "theme_visitor_switch", null, { enabled: on });
  refresh();
  redirect("/admin/themes?saved=1");
}

/**
 * Toggle one preset's enabled flag or make it the default. Upserts the full
 * token set for seed-only presets so a DB row never blanks their colors.
 * Rules from the mockup: the default cannot be disabled, the last enabled
 * theme cannot be disabled.
 */
export async function setThemePresetAction(presetKey: string, field: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();
  const { getThemePresets } = await import("@/lib/cms");
  const presets = await getThemePresets();
  const target = presets.find((p) => p.key === presetKey);
  if (!target) redirect("/admin/themes?error=unknown");

  if (field === "default") {
    for (const p of presets) {
      await db.from("theme_presets").upsert(
        {
          name_en: p.name,
          name_bn: p.nameBn,
          is_default: p.key === presetKey,
          is_enabled: true,
          colors: p.tokens,
          sort_order: p.sort,
        },
        { onConflict: "name_en" },
      );
    }
    await logAdminAction(user, "update", "theme_presets", presetKey, null, { is_default: true });
    refresh();
    redirect("/admin/themes?saved=1");
  }

  // field === "enabled"
  if (target.isDefault) redirect("/admin/themes?error=default");
  const enabledCount = presets.filter((p) => p.enabled).length;
  if (target.enabled && enabledCount <= 1) redirect("/admin/themes?error=last");
  await db.from("theme_presets").upsert(
    {
      name_en: target.name,
      name_bn: target.nameBn,
      is_default: false,
      is_enabled: !target.enabled,
      colors: target.tokens,
      sort_order: target.sort,
    },
    { onConflict: "name_en" },
  );
  await logAdminAction(user, "update", "theme_presets", presetKey, null, { enabled: !target.enabled });
  refresh();
  redirect("/admin/themes?saved=1");
}

export async function resetThemesAction() {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();
  const { getThemePresets } = await import("@/lib/cms");
  const presets = await getThemePresets();
  for (const p of presets) {
    await db.from("theme_presets").upsert(
      {
        name_en: p.name,
        name_bn: p.nameBn,
        is_default: p.key === "light",
        is_enabled: true,
        colors: p.tokens,
        sort_order: p.sort,
      },
      { onConflict: "name_en" },
    );
  }
  await db
    .from("site_settings")
    .upsert({ key: "theme_visitor_switch", value: { enabled: true } }, { onConflict: "key" });
  await logAdminAction(user, "update", "theme_presets", "reset", null, { defaults: true });
  refresh();
  redirect("/admin/themes?saved=1");
}

/* ------------------------------------------------------------------ */
/* Stage 6 item 3: 2FA login-gate verification — fail-closed, rate      */
/* limited, recovery codes accepted (consumed on use)                   */
/* ------------------------------------------------------------------ */

export async function verifyTwoFactorLoginAction(formData: FormData) {
  // Light auth check (no 2FA cookie yet — that is what we are verifying).
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const supa = await createSupabaseServerClient();
  const { data: u } = await supa.auth.getUser();
  if (!u.user) redirect("/login");
  const { data: isAdm } = await supa.rpc("is_admin");
  if (isAdm !== true) redirect("/login?reason=notadmin");
  const user = { id: u.user.id, email: u.user.email ?? "" };
  async function supabaseSignOut() {
    await (await createSupabaseServerClient()).auth.signOut();
  }
  const code = String(formData.get("code") ?? "").trim();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim()
    || (await headers()).get("x-real-ip")
    || "unknown";
  const identifier = "2fa:" + user.id;

  // Rate limit code attempts: 5 per 15 minutes, durable store.
  const verdict = await checkLockout(identifier, ip);
  if (verdict.locked) {
    await recordAttempt(identifier, ip, false);
    redirect("/admin/verify-2fa?error=locked");
  }

  const db = createServiceClient();
  const { data: row } = await db
    .from("admins")
    .select("id,email,totp_secret,totp_enabled,recovery_codes")
    .eq("id", user.id)
    .maybeSingle();

  // FAIL CLOSED: no row, no secret, or a DB problem all deny access.
  if (!row?.totp_enabled || !row.totp_secret) {
    await recordAttempt(identifier, ip, false);
    await supabaseSignOut();
    redirect("/login?reason=generic");
  }

  const totp = new TOTP({
    issuer: TOTP_ISSUER,
    label: row.email || user.email || "admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(row.totp_secret),
  });
  const totpOk = code ? totp.validate({ token: code, window: 1 }) !== null : false;

  let recoveryOk = false;
  if (!totpOk && code) {
    const hash = sha256(code.toUpperCase());
    const codes = Array.isArray(row.recovery_codes) ? (row.recovery_codes as string[]) : [];
    if (codes.includes(hash)) {
      // Single use: consume the code.
      await db
        .from("admins")
        .update({ recovery_codes: codes.filter((c) => c !== hash) })
        .eq("id", user.id);
      recoveryOk = true;
    }
  }

  if (!totpOk && !recoveryOk) {
    await recordAttempt(identifier, ip, false);
    await logAdminAction({ id: user.id, email: user.email }, "2fa_failed", "auth", user.id);
    redirect("/admin/verify-2fa?error=code");
  }

  await setA2faSession(user.id);
  await recordAttempt(identifier, ip, true);
  await logAdminAction({ id: user.id, email: user.email }, recoveryOk ? "2fa_recovery_used" : "2fa_verified", "auth", user.id);
  redirect("/admin");
}

/** Generates a fresh set of 2FA recovery codes (hashed at rest). The plain
 *  codes are returned ONCE through the action state; regenerating replaces
 *  every previous code. */
export async function generateRecoveryCodesAction(): Promise<{ codes: string[] } | { error: string }> {
  if (!adminConfigured()) return { error: "not_configured" };
  const user = await requireAdmin();
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const raw = randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
    codes.push(raw.slice(0, 5) + "-" + raw.slice(5));
  }
  const hashes = codes.map((c) => sha256(c));
  await createServiceClient()
    .from("admins")
    .update({ recovery_codes: hashes })
    .eq("id", user.id);
  await logAdminAction(user, "2fa_recovery_regenerated", "admins", user.id);
  return { codes };
}
