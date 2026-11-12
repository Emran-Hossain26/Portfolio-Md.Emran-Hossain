"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { logAdminAction, auditValue } from "@/lib/audit";

const CONFIGURED_ERROR = "/login?reason=notconfigured";

function refresh() {
  updateTag("content");
}

/* ------------------------------------------------------------------ */
/* Module registry — one workflow for projects / services / experience */
/* ------------------------------------------------------------------ */

export type CmsModule = "projects" | "services" | "experience";

const MODULES: Record<
  CmsModule,
  { table: string; orderCol: string; label: string; base: string }
> = {
  projects: { table: "projects", orderCol: "sort_order", label: "Project", base: "/admin/projects" },
  services: { table: "services", orderCol: "sort_order", label: "Service", base: "/admin/services" },
  experience: { table: "experience", orderCol: "sort", label: "Experience", base: "/admin/experience" },
};

type PubStatus = "draft" | "published" | "unpublished" | "archived";


const isCmsModule = (m: string): m is CmsModule => m in MODULES;

/** Keep the legacy `published` boolean in sync with pub_status so the
 *  existing anon RLS read policies and pre-migration queries stay correct. */
const syncPublished = (pubStatus: PubStatus) => ({ published: pubStatus === "published" });

async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/* Zod schemas — one per module                                        */
/* ------------------------------------------------------------------ */

const urlish = z
  .string()
  .trim()
  .max(400)
  .refine((v) => v === "" || /^(https?:\/\/|\/)/i.test(v), "Must be an https:// URL or a /path");

const seoShape = {
  seo_title_en: z.string().trim().max(120).default(""),
  seo_title_bn: z.string().trim().max(120).default(""),
  seo_desc_en: z.string().trim().max(400).default(""),
  seo_desc_bn: z.string().trim().max(400).default(""),
  seo_keywords: z.string().trim().max(300).default(""),
  og_image: urlish.default(""),
  canonical: urlish.default(""),
  noindex: z.boolean().default(false),
};

const SLUG = z
  .string()
  .trim()
  .min(2, "Slug is too short")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits and dashes only");

function metricsParse(raw: string) {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return (parsed as { label?: unknown; value?: unknown }[])
      .map((m) => ({ label: String(m.label ?? "").trim().slice(0, 80), value: String(m.value ?? "").trim().slice(0, 40) }))
      .filter((m) => m.label && m.value)
      .slice(0, 12);
  } catch {
    return [];
  }
}

function slidesParse(raw: string) {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return (parsed as { src?: unknown; caption_en?: unknown; caption_bn?: unknown }[])
      .map((s) => ({
        src: String(s.src ?? "").trim().slice(0, 600),
        caption_en: String(s.caption_en ?? "").trim().slice(0, 200),
        caption_bn: String(s.caption_bn ?? "").trim().slice(0, 200),
      }))
      .filter((s) => s !== null)
      .slice(0, 24);
  } catch {
    return [];
  }
}

function tagsParse(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
}

const str = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();
const bool = (fd: FormData, name: string) => fd.get(name) === "on" || fd.get(name) === "true";

const ProjectsInput = z.object({
  slug: SLUG,
  title_en: z.string().trim().min(1, "English title is required").max(140),
  title_bn: z.string().trim().max(140).default(""),
  problem_en: z.string().trim().max(4000).default(""),
  problem_bn: z.string().trim().max(4000).default(""),
  solution_en: z.string().trim().max(6000).default(""),
  solution_bn: z.string().trim().max(6000).default(""),
  result_en: z.string().trim().max(4000).default(""),
  result_bn: z.string().trim().max(4000).default(""),
  metrics: z.array(z.object({ label: z.string().min(1).max(80), value: z.string().min(1).max(40) })).default([]),
  tech: z.array(z.string().trim().min(1).max(40)).max(24).default([]),
  cover_url: urlish.default(""),
  category: z.string().trim().max(80).default(""),
  project_type: z.enum(["", "personal", "professional", "client"]).default(""),
  role_en: z.string().trim().max(200).default(""),
  role_bn: z.string().trim().max(200).default(""),
  features_en: z.string().trim().max(2000).default(""),
  features_bn: z.string().trim().max(2000).default(""),
  media: z.enum(["slides", "video", "none"]).default("slides"),
  video: urlish.default(""),
  slides: z.array(z.object({ src: z.string().max(600), caption_en: z.string().max(200), caption_bn: z.string().max(200) })).default([]),
  demo_url: urlish.default(""),
  live_url: urlish.default(""),
  repo_url: urlish.default(""),
  status: z.enum(["running", "completed", "planned", "paused"]).default("completed"),
  featured: z.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  ...seoShape,
});

const ServicesInput = z.object({
  slug: SLUG,
  title_en: z.string().trim().min(1, "English title is required").max(140),
  title_bn: z.string().trim().max(140).default(""),
  desc_en: z.string().trim().max(600).default(""),
  desc_bn: z.string().trim().max(600).default(""),
  full_desc_en: z.string().trim().max(4000).default(""),
  full_desc_bn: z.string().trim().max(4000).default(""),
  icon: z.string().trim().max(80).default(""),
  icon_svg: z.string().trim().max(4000).default(""),
  image_url: urlish.default(""),
  features_en: z.string().trim().max(2000).default(""),
  features_bn: z.string().trim().max(2000).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(24).default([]),
  price: z.string().trim().max(80).default(""),
  featured: z.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  ...seoShape,
});

const EmploymentType = z.enum(["", "full-time", "part-time", "freelance", "contract"]);
const YM = z.string().regex(/^(\d{4}-\d{2})?$/, "Use YYYY-MM or leave empty");

const ExperienceInput = z.object({
  slug: SLUG,
  role_en: z.string().trim().min(1, "Job title (EN) is required").max(140),
  role_bn: z.string().trim().max(140).default(""),
  org_en: z.string().trim().min(1, "Company (EN) is required").max(140),
  org_bn: z.string().trim().max(140).default(""),
  logo_url: urlish.default(""),
  website_url: urlish.default(""),
  employment_type: EmploymentType.default(""),
  start_date: YM.default(""),
  end_date: YM.default(""),
  is_current: z.boolean().default(false),
  period: z.string().trim().max(80).default(""),
  summary_en: z.string().trim().max(600).default(""),
  summary_bn: z.string().trim().max(600).default(""),
  details: z.string().trim().max(4000).default(""),
  achievements_en: z.string().trim().max(2000).default(""),
  achievements_bn: z.string().trim().max(2000).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(24).default([]),
  featured: z.boolean().default(false),
  sort: z.coerce.number().int().min(0).max(9999).default(0),
  ...seoShape,
});

const SCHEMAS = { projects: ProjectsInput, services: ServicesInput, experience: ExperienceInput };

/** Turn a form into a zod draft for the given module. */
function formToDraft(module: CmsModule, fd: FormData): Record<string, unknown> {
  const tags = tagsParse(str(fd, "tags"));
  switch (module) {
    case "projects":
      return {
        slug: str(fd, "slug"), title_en: str(fd, "title_en"), title_bn: str(fd, "title_bn"),
        problem_en: str(fd, "problem_en"), problem_bn: str(fd, "problem_bn"),
        solution_en: str(fd, "solution_en"), solution_bn: str(fd, "solution_bn"),
        result_en: str(fd, "result_en"), result_bn: str(fd, "result_bn"),
        metrics: metricsParse(str(fd, "metrics")),
        tech: tagsParse(str(fd, "tech")),
        cover_url: str(fd, "cover_url"), category: str(fd, "category"), project_type: str(fd, "project_type"),
        role_en: str(fd, "role_en"), role_bn: str(fd, "role_bn"),
        features_en: str(fd, "features_en"), features_bn: str(fd, "features_bn"),
        media: str(fd, "media") || "slides", video: str(fd, "video"),
        slides: slidesParse(str(fd, "slides")),
        demo_url: str(fd, "demo_url"), live_url: str(fd, "live_url"), repo_url: str(fd, "repo_url"),
        status: str(fd, "status") || "completed",
        featured: bool(fd, "featured"), sort_order: str(fd, "sort_order") || "0",
        seo_title_en: str(fd, "seo_title_en"), seo_title_bn: str(fd, "seo_title_bn"),
        seo_desc_en: str(fd, "seo_desc_en"), seo_desc_bn: str(fd, "seo_desc_bn"),
        seo_keywords: str(fd, "seo_keywords"), og_image: str(fd, "og_image"),
        canonical: str(fd, "canonical"), noindex: bool(fd, "noindex"),
      };
    case "services":
      return {
        slug: str(fd, "slug"), title_en: str(fd, "title_en"), title_bn: str(fd, "title_bn"),
        desc_en: str(fd, "desc_en"), desc_bn: str(fd, "desc_bn"),
        full_desc_en: str(fd, "full_desc_en"), full_desc_bn: str(fd, "full_desc_bn"),
        icon: str(fd, "icon"), icon_svg: str(fd, "icon_svg"), image_url: str(fd, "image_url"),
        features_en: str(fd, "features_en"), features_bn: str(fd, "features_bn"),
        tags, price: str(fd, "price"),
        featured: bool(fd, "featured"), sort_order: str(fd, "sort_order") || "0",
        seo_title_en: str(fd, "seo_title_en"), seo_title_bn: str(fd, "seo_title_bn"),
        seo_desc_en: str(fd, "seo_desc_en"), seo_desc_bn: str(fd, "seo_desc_bn"),
        seo_keywords: str(fd, "seo_keywords"), og_image: str(fd, "og_image"),
        canonical: str(fd, "canonical"), noindex: bool(fd, "noindex"),
      };
    case "experience":
      return {
        slug: str(fd, "slug"), role_en: str(fd, "role_en"), role_bn: str(fd, "role_bn"),
        org_en: str(fd, "org_en"), org_bn: str(fd, "org_bn"),
        logo_url: str(fd, "logo_url"), website_url: str(fd, "website_url"),
        employment_type: str(fd, "employment_type"),
        start_date: str(fd, "start_date"), end_date: str(fd, "end_date"), is_current: bool(fd, "is_current"),
        period: str(fd, "period"),
        summary_en: str(fd, "summary_en"), summary_bn: str(fd, "summary_bn"),
        details: str(fd, "details"),
        achievements_en: str(fd, "achievements_en"), achievements_bn: str(fd, "achievements_bn"),
        tags, featured: bool(fd, "featured"), sort: str(fd, "sort") || "0",
        seo_title_en: str(fd, "seo_title_en"), seo_title_bn: str(fd, "seo_title_bn"),
        seo_desc_en: str(fd, "seo_desc_en"), seo_desc_bn: str(fd, "seo_desc_bn"),
        seo_keywords: str(fd, "seo_keywords"), og_image: str(fd, "og_image"),
        canonical: str(fd, "canonical"), noindex: bool(fd, "noindex"),
      };
  }
}

/* ------------------------------------------------------------------ */
/* Revisions                                                           */
/* ------------------------------------------------------------------ */

async function snapshotRevision(
  db: ReturnType<typeof createServiceClient>,
  module: CmsModule,
  entityId: string,
  oldValue: unknown,
  newValue: unknown,
  adminEmail: string | null | undefined
) {
  const { data } = await db
    .from("content_revisions")
    .select("revision_no")
    .eq("entity_id", entityId)
    .eq("entity_type", module)
    .order("revision_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  const next = ((data?.revision_no as number) ?? 0) + 1;
  await db.from("content_revisions").insert({
    entity_type: module,
    entity_id: entityId,
    revision_no: next,
    old_value: oldValue === undefined ? null : oldValue,
    new_value: newValue === undefined ? null : newValue,
    admin_email: adminEmail ?? null,
  });
}

/* ------------------------------------------------------------------ */
/* Save (create / edit) — Draft / Publish Now / keep status            */
/* ------------------------------------------------------------------ */

export async function saveCmsAction(module: string, id: string, fd: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  if (!isCmsModule(module)) redirect("/admin");
  const user = await requireAdmin();
  const cfg = MODULES[module];
  const db = createServiceClient();

  const parsed = SCHEMAS[module].safeParse(formToDraft(module, fd));
  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "invalid";
    const back = id === "__new" ? `${cfg.base}/new` : `${cfg.base}/${id}`;
    redirect(`${back}?error=${encodeURIComponent(reason)}`);
  }
  const row = parsed.data as Record<string, unknown>;

  // Unique slug across the module table.
  let clashQuery = db.from(cfg.table).select("id").eq("slug", row.slug as string).limit(1);
  if (id !== "__new") clashQuery = clashQuery.neq("id", id);
  const { data: clash } = await clashQuery.maybeSingle();
  if (clash) {
    const back = id === "__new" ? `${cfg.base}/new` : `${cfg.base}/${id}`;
    redirect(`${back}?error=slug-taken`);
  }

  // Publication intent: Save (keep) / Save as Draft / Publish Now.
  const intent = str(fd, "intent") || "keep";
  let prevStatus: string | null = null;
  if (id !== "__new") {
    const { data: old } = await db.from(cfg.table).select("pub_status,published_at").eq("id", id).maybeSingle();
    prevStatus = (old?.pub_status as string) ?? null;
  }
  let pubStatus: PubStatus;
  if (id === "__new") {
    pubStatus = intent === "publish" ? "published" : "draft"; // Rule 1: new = draft unless published.
  } else if (intent === "publish") {
    pubStatus = "published";
  } else if (intent === "draft") {
    pubStatus = "draft";
  } else {
    pubStatus = (prevStatus as PubStatus) ?? "draft"; // Rule 3: never silently change status.
  }
  const patch: Record<string, unknown> = {
    ...row,
    ...syncPublished(pubStatus),
    pub_status: pubStatus,
    updated_at: new Date().toISOString(),
  };
  if (pubStatus === "published" && prevStatus !== "published") patch.published_at = new Date().toISOString();

  let entityId = id;
  if (id === "__new") {
    const { data: created } = await db.from(cfg.table).insert(patch).select("id").single();
    entityId = (created?.id as string) ?? id;
    await logAdminAction(user, "content_created", module, entityId, null, auditValue({ name: row.title_en ?? row.role_en, prev_status: null, new_status: pubStatus, ip: await clientIp() }));
  } else {
    const { data: oldRow } = await db.from(cfg.table).select("*").eq("id", id).maybeSingle();
    await snapshotRevision(db, module, id, oldRow, patch, user?.email);
    await db.from(cfg.table).update(patch).eq("id", id);
    await logAdminAction(user, "content_updated", module, id, auditValue({ prev_status: prevStatus }), auditValue({ name: row.title_en ?? row.role_en, prev_status: prevStatus, new_status: pubStatus, ip: await clientIp() }));
  }
  refresh();
  redirect(`${cfg.base}?tab=all&saved=1&which=${entityId}`);
}

/* ------------------------------------------------------------------ */
/* Lifecycle actions — single + bulk (publish/unpublish/archive/trash…) */
/* ------------------------------------------------------------------ */

const LIFECYCLE = {
  publish: "published",
  unpublish: "unpublished",
  archive: "archived",
  draft: "draft",
} as const;
type LifecycleAction = keyof typeof LIFECYCLE;

async function applyLifecycle(
  db: ReturnType<typeof createServiceClient>,
  module: CmsModule,
  id: string,
  action: LifecycleAction | "trash" | "restore" | "purge"
): Promise<{ ok: boolean; prev?: string; next?: string }> {
  const cfg = MODULES[module];
  const { data: row } = await db.from(cfg.table).select("id,pub_status,deleted_at").eq("id", id).maybeSingle();
  if (!row) return { ok: false };
  const prev = String(row.pub_status ?? "draft");
  let patch: Record<string, unknown>;
  let next: string;

  switch (action) {
    case "publish":
    case "unpublish":
    case "archive":
    case "draft": {
      if (row.deleted_at) return { ok: false }; // No status flips on trashed rows.
      next = LIFECYCLE[action];
      const nextPub = next as PubStatus;
      patch = { pub_status: nextPub, ...syncPublished(nextPub), updated_at: new Date().toISOString() };
      if (nextPub === "published") patch.published_at = new Date().toISOString();
      break;
    }
    case "trash": {
      if (row.deleted_at) return { ok: false };
      next = prev; // Status preserved while trashed.
      patch = { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      break;
    }
    case "restore": {
      if (!row.deleted_at && prev !== "archived") return { ok: false };
      // Rule 6: never auto-publish on restore — safe status instead.
      next = prev === "archived" || prev === "published" ? "unpublished" : prev;
      const safeStatus = next as PubStatus;
      patch = { deleted_at: null, pub_status: safeStatus, ...syncPublished(safeStatus), updated_at: new Date().toISOString() };
      break;
    }
    case "purge": {
      if (!row.deleted_at) return { ok: false }; // Permanent delete only from Trash.
      await db.from(cfg.table).delete().eq("id", id);
      return { ok: true, prev, next: "gone" };
    }
  }

  await db.from(cfg.table).update(patch).eq("id", id);
  return { ok: true, prev, next };
}

/* Action names for the audit trail — explicit and readable. */
const AUDIT_ACTION: Record<string, string> = {
  publish: "content_published",
  unpublish: "content_unpublished",
  archive: "content_archived",
  draft: "content_saved_as_draft",
  trash: "content_moved_to_trash",
  restore: "content_restored",
  purge: "content_permanently_deleted",
};

export async function cmsLifecycleAction(module: string, id: string, action: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  if (!isCmsModule(module)) redirect("/admin");
  const user = await requireAdmin();
  if (!(action in AUDIT_ACTION)) redirect(MODULES[module].base);
  const cfg = MODULES[module];
  const db = createServiceClient();
  const { data: row } = await db.from(cfg.table).select("title_en,title_bn,role_en").eq("id", id).maybeSingle();

  const res = await applyLifecycle(db, module, id, action as LifecycleAction | "trash" | "restore" | "purge");
  if (res.ok) {
    const name = String(row?.title_en ?? row?.role_en ?? id);
    await logAdminAction(user, AUDIT_ACTION[action], module, id, auditValue({ prev_status: res.prev }), auditValue({ name, prev_status: res.prev, new_status: res.next, ip: await clientIp() }));
  }
  refresh();
  redirect(cfg.base + (res.ok ? "?saved=1" : "?error=lifecycle"));
}

export async function cmsBulkAction(module: string, ids: string[], action: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  if (!isCmsModule(module)) redirect("/admin");
  const user = await requireAdmin();
  if (!(action in AUDIT_ACTION)) return { ok: false, done: 0 };
  const db = createServiceClient();
  const clean = ids.filter((x) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x));
  let done = 0;
  const results: { id: string; prev: string; next: string }[] = [];
  for (const rid of clean) {
    const res = await applyLifecycle(db, module, rid, action as LifecycleAction | "trash" | "restore" | "purge");
    if (res.ok) {
      done += 1;
      results.push({ id: rid, prev: res.prev ?? "", next: res.next ?? "" });
    }
  }
  if (done) {
    await logAdminAction(user, `bulk_${AUDIT_ACTION[action]}`, module, `${done} rows`, null, auditValue({ action, items: results, ip: await clientIp() }));
    refresh();
  }
  return { ok: true, done };
}

/* ------------------------------------------------------------------ */
/* Duplicate — full copy, new id + unique slug, always Draft (Rule 9)  */
/* ------------------------------------------------------------------ */

export async function duplicateCmsAction(module: string, id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  if (!isCmsModule(module)) redirect("/admin");
  const user = await requireAdmin();
  const cfg = MODULES[module];
  const db = createServiceClient();
  const { data: src } = await db.from(cfg.table).select("*").eq("id", id).maybeSingle();
  if (!src) redirect(cfg.base);
  const s = { ...(src as Record<string, unknown>) };
  delete s.id;
  delete s.created_at;
  delete s.updated_at;
  delete s.published_at;
  s.pub_status = "draft"; // Never auto-publish a duplicate.
  s.published = false;
  s.featured = false;
  if (module === "projects") s.title_en = `${String(s.title_en ?? "")} (copy)`;
  if (module === "services") s.title_en = `${String(s.title_en ?? "")} (copy)`;
  if (module === "experience") s.role_en = `${String(s.role_en ?? "")} (copy)`;

  const root = `${String(s.slug ?? "record").slice(0, 66)}-copy`;
  let slug = root;
  for (let n = 2; n < 50; n += 1) {
    const { data: taken } = await db.from(cfg.table).select("id").eq("slug", slug).limit(1).maybeSingle();
    if (!taken) break;
    slug = `${root}-${n}`;
  }
  s.slug = slug;
  const { data: created } = await db.from(cfg.table).insert(s).select("id").single();
  await logAdminAction(user, "content_duplicated", module, (created?.id as string) ?? id, null, auditValue({ from: id, slug, new_status: "draft" }));
  refresh();
  redirect(`${cfg.base}?saved=1&duplicated=${created?.id as string}`);
}

/* ------------------------------------------------------------------ */
/* Drag reorder — ids arrive in their new visual order                 */
/* ------------------------------------------------------------------ */

export async function reorderCmsAction(module: string, ids: string[]) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  if (!isCmsModule(module)) redirect("/admin");
  const user = await requireAdmin();
  const cfg = MODULES[module];
  const clean = ids.filter((x) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x));
  if (clean.length) {
    const db = createServiceClient();
    await Promise.all(
      clean.map((rid, index) =>
        db.from(cfg.table).update({ [cfg.orderCol]: index + 1 }).eq("id", rid)
      )
    );
    await logAdminAction(user, "content_reordered", module, `${clean.length} rows`, null, auditValue({ order: clean }));
    refresh();
  }
  return { ok: true, count: clean.length };
}

/* ------------------------------------------------------------------ */
/* Restore an old revision (Rule 10: history stays separate)           */
/* ------------------------------------------------------------------ */

export async function restoreRevisionAction(module: string, id: string, revisionNo: number) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  if (!isCmsModule(module)) redirect("/admin");
  const user = await requireAdmin();
  const cfg = MODULES[module];
  const db = createServiceClient();
  const { data: rev } = await db
    .from("content_revisions")
    .select("*")
    .eq("entity_id", id)
    .eq("entity_type", module)
    .eq("revision_no", revisionNo)
    .maybeSingle();
  if (!rev) redirect(`${cfg.base}/${id}`);
  const restoreTo = (rev.old_value ?? rev.new_value) as Record<string, unknown> | null;
  if (!restoreTo) redirect(`${cfg.base}/${id}`);
  const { data: current } = await db.from(cfg.table).select("*").eq("id", id).maybeSingle();
  // Snapshot the current state first — history is append-only.
  await snapshotRevision(db, module, id, current, restoreTo, user?.email);
  const patch: Record<string, unknown> = {
    ...(restoreTo as Record<string, unknown>),
    updated_at: new Date().toISOString(),
  };
  patch.id = undefined;
  patch.created_at = undefined;
  await db.from(cfg.table).update(patch).eq("id", id);
  await logAdminAction(user, "revision_restored", module, id, null, auditValue({ revision_no: revisionNo }));
  refresh();
  redirect(`${cfg.base}/${id}?saved=1&restored=${revisionNo}`);
}
