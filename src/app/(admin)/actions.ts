"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/supabase/admin-auth";

/* ------------------------------------------------------------------ */
/* Whitelisted admin-writable tables + columns                          */
/* ------------------------------------------------------------------ */

type FieldType = "text" | "bool" | "int" | "tags";
type TableSpec = Record<string, FieldType>;

const TABLES: Record<string, TableSpec> = {
  projects: {
    slug: "text",
    title_en: "text",
    title_bn: "text",
    desc_en: "text",
    desc_bn: "text",
    tags: "tags",
    href: "text",
    published: "bool",
    sort: "int",
  },
  posts: {
    slug: "text",
    title_en: "text",
    title_bn: "text",
    meta_en: "text",
    meta_bn: "text",
    body_en: "text",
    body_bn: "text",
    published: "bool",
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
};

const CONFIGURED_ERROR = "/admin/login?reason=notconfigured";

function parse(spec: TableSpec, formData: FormData) {
  const row: Record<string, string | boolean | number | string[]> = {};
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
  if (error || !data.user) redirect("/admin/login?error=auth");
  if (allowed && data.user.email?.toLowerCase() !== allowed) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }
  redirect("/admin");
}

export async function logoutAction() {
  if (!adminConfigured()) redirect("/");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Generic row editors (projects, posts, testimonials, CV sections)    */
/* ------------------------------------------------------------------ */

export async function saveRowAction(table: string, id: string, formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();

  const spec = TABLES[table];
  if (!spec) throw new Error(`Unknown table: ${table}`);
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
