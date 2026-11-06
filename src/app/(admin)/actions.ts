"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/supabase/admin-auth";

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
    meta_en: "text",
    meta_bn: "text",
    body_en: "text",
    body_bn: "text",
    published: "bool",
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
    published: "bool",
    sort: "int",
  },
  skills: {
    name: "text",
    category: "text",
    level: "int",
    published: "bool",
    sort: "int",
  },
  certifications: {
    title_en: "text",
    title_bn: "text",
    issuer_en: "text",
    issuer_bn: "text",
    year: "text",
    href: "text",
    published: "bool",
    sort: "int",
  },
  faqs: {
    q_en: "text",
    q_bn: "text",
    a_en: "text",
    a_bn: "text",
    published: "bool",
    sort: "int",
  },
  stats: {
    value: "text",
    label_en: "text",
    label_bn: "text",
    published: "bool",
    sort: "int",
  },
  social_links: {
    platform: "text",
    url: "text",
    label_en: "text",
    label_bn: "text",
    published: "bool",
    sort: "int",
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
  await requireAdmin();

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
  refresh();
  redirect(`/admin/${table === "education" ? "education" : table}`);
}

export async function deleteRowAction(table: string, id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  // Protected seed row for testimonials placeholders needs no special-case:
  // the admin decides which rows to remove.
  await createServiceClient().from(table).delete().eq("id", id);
  refresh();
  redirect(`/admin/${table === "education" ? "education" : table}`);
}

/* ------------------------------------------------------------------ */
/* Hero texts (site_settings: hero_texts)                              */
/* ------------------------------------------------------------------ */

export async function saveTextsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();

  const value = {
    en: {
      heading: String(formData.get("hero_heading_en") ?? ""),
      intro: String(formData.get("hero_intro_en") ?? ""),
    },
    bn: {
      heading: String(formData.get("hero_heading_bn") ?? ""),
      intro: String(formData.get("hero_intro_bn") ?? ""),
    },
  };
  await createServiceClient()
    .from("site_settings")
    .upsert({ key: "hero_texts", value }, { onConflict: "key" });
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
  await requireAdmin();
  await upsertTheme("theme_light", lightJson);
  await upsertTheme("theme_dark", darkJson);
  refresh();
  redirect("/admin/theme?saved=1");
}

/* ------------------------------------------------------------------ */
/* CV upload (storage bucket "cv" → site_settings: cv_path)            */
/* ------------------------------------------------------------------ */

export async function saveCvAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();

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
  refresh();
  redirect("/admin/cv");
}

export async function removeCvAction() {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  await createServiceClient()
    .from("site_settings")
    .delete()
    .eq("key", "cv_path");
  refresh();
  redirect("/admin/cv");
}

/* ------------------------------------------------------------------ */
/* Per-page SEO overrides (page_seo)                                   */
/* ------------------------------------------------------------------ */

const SEO_PATHS = ["/", "/projects", "/blog", "/about", "/contact", "/testimonials"];

export async function saveSeoAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();

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
  refresh();
  redirect("/admin/seo");
}

/* ------------------------------------------------------------------ */
/* SEO settings (global defaults, verification codes)                  */
/* ------------------------------------------------------------------ */

export async function saveSeoSettingsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
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
  await requireAdmin();
  const allowed = ["new", "read", "replied", "spam"];
  if (!allowed.includes(status)) redirect("/admin/messages");
  await createServiceClient().from("messages").update({ status }).eq("id", id);
  refresh();
  redirect("/admin/messages");
}

export async function saveContactInfoAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
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
  refresh();
  redirect("/admin/contact-info?saved=1");
}

export async function uploadMediaAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/media?error=empty");
  if (file.size > 8 * 1024 * 1024) redirect("/admin/media?error=size");
  const db = createServiceClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
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
  refresh();
  redirect("/admin/media?saved=1");
}

export async function deleteMediaAction(id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  const db = createServiceClient();
  const { data } = await db.from("media_assets").select("path").eq("id", id).maybeSingle();
  if (data?.path) await db.storage.from("media").remove([data.path as string]);
  await db.from("media_assets").delete().eq("id", id);
  refresh();
  redirect("/admin/media");
}

/* ------------------------------------------------------------------ */
/* Stage 5: Effects Manager (site_settings: effects_settings)          */
/* ------------------------------------------------------------------ */

export async function saveEffectsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  const on = (k: string) => formData.get(k) === "on";
  const value = {
    master: on("master"),
    network: on("network"),
    trail: on("trail"),
    ripple: on("ripple"),
    magnetic: on("magnetic"),
    tilt: on("tilt"),
    mascot: on("mascot"),
    aurora: on("aurora"),
    parallax: on("parallax"),
    scramble: on("scramble"),
    counters: on("counters"),
    default_mode: formData.get("default_mode") === "lite" ? "lite" : "full",
    touch_disable: on("touch_disable"),
    intensity: formData.get("intensity") === "low" ? "low" : formData.get("intensity") === "high" ? "high" : "medium",
  };
  const db = createServiceClient();
  await db.from("site_settings").upsert({ key: "effects_settings", value }, { onConflict: "key" });
  refresh();
  redirect("/admin/effects?saved=1");
}

/* ------------------------------------------------------------------ */
/* Stage 5.2: hero editor + maintenance mode                           */
/* ------------------------------------------------------------------ */

export async function saveHeroTextsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  const value = {
    heading: {
      en: String(formData.get("heading_en") ?? "").trim(),
      bn: String(formData.get("heading_bn") ?? "").trim(),
    },
    intro: {
      en: String(formData.get("intro_en") ?? "").trim(),
      bn: String(formData.get("intro_bn") ?? "").trim(),
    },
  };
  await createServiceClient()
    .from("site_settings")
    .upsert({ key: "hero_texts", value }, { onConflict: "key" });
  refresh();
  redirect("/admin/hero?saved=1");
}

export async function saveMaintenanceAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  const on = formData.get("maintenance") === "on";
  await createServiceClient()
    .from("site_settings")
    .upsert(
      { key: "maintenance_mode", value: { enabled: on } },
      { onConflict: "key" },
    );
  refresh();
  redirect("/admin/system?saved=1");
}
