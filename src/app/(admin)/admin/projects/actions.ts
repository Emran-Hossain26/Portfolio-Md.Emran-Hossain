"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { logAdminAction, auditValue } from "@/lib/audit";

const CONFIGURED_ERROR = "/login?reason=notconfigured";

function refresh() {
  // Server-action context: read-your-own-writes expiry (no stale window).
  updateTag("content");
}

/* ------------------------------------------------------------------ */
/* Zod schema — one source of validation for add + edit                */
/* ------------------------------------------------------------------ */

const STATUSES = ["running", "completed", "planned", "paused"] as const;

const urlish = z
  .string()
  .trim()
  .max(400)
  .refine((v) => v === "" || /^(https?:\/\/|\/)/i.test(v), "Must be an https:// URL or a /path");

const ProjectInput = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Slug is too short")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits and dashes only"),
  title_en: z.string().trim().min(1, "English title is required").max(140),
  title_bn: z.string().trim().max(140).default(""),
  problem_en: z.string().trim().max(4000).default(""),
  problem_bn: z.string().trim().max(4000).default(""),
  solution_en: z.string().trim().max(4000).default(""),
  solution_bn: z.string().trim().max(4000).default(""),
  result_en: z.string().trim().max(4000).default(""),
  result_bn: z.string().trim().max(4000).default(""),
  metrics: z
    .array(z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(40) }))
    .max(12)
    .default([]),
  tech: z.array(z.string().trim().min(1).max(40)).max(24).default([]),
  media: z.enum(["slides", "video", "none"]).default("slides"),
  video: urlish.default(""),
  slides: z
    .array(
      z.object({
        src: z.string().trim().max(600).default(""),
        caption_en: z.string().trim().max(200).default(""),
        caption_bn: z.string().trim().max(200).default(""),
      })
    )
    .max(24)
    .default([]),
  demo_url: urlish.default(""),
  live_url: urlish.default(""),
  repo_url: urlish.default(""),
  status: z.enum(STATUSES).default("completed"),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export type ProjectParsed = z.infer<typeof ProjectInput>;

/** Pull a zod-parseable draft out of the multipart form. */
function formToDraft(formData: FormData) {
  const arr = (name: string) => String(formData.get(name) ?? "").trim();
  let metrics: { label: string; value: string }[] = [];
  try {
    const parsed = JSON.parse(arr("metrics") || "[]");
    if (Array.isArray(parsed)) metrics = parsed as { label: string; value: string }[];
  } catch {}
  let slides: { src: string; caption_en: string; caption_bn: string }[] = [];
  try {
    const parsed = JSON.parse(arr("slides") || "[]");
    if (Array.isArray(parsed)) slides = parsed as { src: string; caption_en: string; caption_bn: string }[];
  } catch {}
  return {
    slug: arr("slug"),
    title_en: arr("title_en"),
    title_bn: arr("title_bn"),
    problem_en: arr("problem_en"),
    problem_bn: arr("problem_bn"),
    solution_en: arr("solution_en"),
    solution_bn: arr("solution_bn"),
    result_en: arr("result_en"),
    result_bn: arr("result_bn"),
    metrics,
    tech: arr("tech")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    media: arr("media") || "slides",
    video: arr("video"),
    slides,
    demo_url: arr("demo_url"),
    live_url: arr("live_url"),
    repo_url: arr("repo_url"),
    status: arr("status") || "completed",
    published: formData.get("published") === "on" || formData.get("published") === "true",
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    sort_order: arr("sort_order") || "0",
  };
}

/* ------------------------------------------------------------------ */
/* Save (create / update) — zod + unique slug + audit + revalidate     */
/* ------------------------------------------------------------------ */

export async function saveProjectAction(id: string, formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const db = createServiceClient();

  const parsed = ProjectInput.safeParse(formToDraft(formData));
  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "invalid";
    const back = id === "__new" ? "/admin/projects/new" : `/admin/projects/${id}`;
    redirect(`${back}?error=${encodeURIComponent(reason)}`);
  }
  const row = parsed.data;

  // Unique slug: reject when another row already owns it.
  let clashQuery = db.from("projects").select("id").eq("slug", row.slug).limit(1);
  if (id !== "__new") clashQuery = clashQuery.neq("id", id);
  const { data: clash } = await clashQuery.maybeSingle();
  if (clash) {
    const back = id === "__new" ? "/admin/projects/new" : `/admin/projects/${id}`;
    redirect(`${back}?error=slug-taken`);
  }

  if (id === "__new") {
    const { data: created } = await db.from("projects").insert(row).select("id").single();
    await logAdminAction(user, "create", "projects", (created?.id as string) ?? "(new project)", null, auditValue(row));
  } else {
    await db.from("projects").update(row).eq("id", id);
    await logAdminAction(user, "update", "projects", id, null, auditValue(row));
  }
  refresh();
  redirect("/admin/projects");
}

/* ------------------------------------------------------------------ */
/* Row actions — every one: admin check + audit + revalidate           */
/* ------------------------------------------------------------------ */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setProjectVisibleAction(id: string, visible: boolean) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  if (!UUID_RE.test(id)) redirect("/admin/projects");
  await createServiceClient()
    .from("projects")
    .update({ published: visible })
    .eq("id", id);
  await logAdminAction(user, visible ? "show" : "hide", "projects", id, null, auditValue({ published: visible }));
  refresh();
  redirect("/admin/projects");
}

export async function setProjectStatusAction(id: string, status: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  if (!UUID_RE.test(id)) redirect("/admin/projects");
  const clean = STATUSES.includes(status as (typeof STATUSES)[number]) ? status : "completed";
  await createServiceClient().from("projects").update({ status: clean }).eq("id", id);
  await logAdminAction(user, "status", "projects", id, null, auditValue({ status: clean }));
  refresh();
  redirect("/admin/projects");
}

export async function duplicateProjectAction(id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  if (!UUID_RE.test(id)) redirect("/admin/projects");
  const db = createServiceClient();
  const { data: src } = await db.from("projects").select("*").eq("id", id).maybeSingle();
  if (!src) redirect("/admin/projects");
  const s = src as Record<string, unknown>;
  // Copies start hidden — the admin decides when the clone goes public.
  const base = {
    slug: "",
    title_en: `${String(s.title_en ?? "")} (copy)`,
    title_bn: s.title_bn ?? "",
    problem_en: s.problem_en ?? "",
    problem_bn: s.problem_bn ?? "",
    solution_en: s.solution_en ?? "",
    solution_bn: s.solution_bn ?? "",
    result_en: s.result_en ?? "",
    result_bn: s.result_bn ?? "",
    metrics: s.metrics ?? [],
    tech: s.tech ?? [],
    media: s.media ?? "slides",
    video: s.video ?? "",
    slides: s.slides ?? [],
    demo_url: s.demo_url ?? "",
    live_url: s.live_url ?? "",
    repo_url: s.repo_url ?? "",
    status: s.status ?? "completed",
    published: false,
    featured: false,
    sort_order: (Number(s.sort_order) || 0) + 1,
  };
  // Unique slug: -copy, -copy-2, -copy-3 …
  const root = `${String(s.slug ?? "project").slice(0, 66)}-copy`;
  let slug = root;
  for (let n = 2; n < 50; n += 1) {
    const { data: taken } = await db.from("projects").select("id").eq("slug", slug).limit(1).maybeSingle();
    if (!taken) break;
    slug = `${root}-${n}`;
  }
  const { data: created } = await db
    .from("projects")
    .insert({ ...base, slug })
    .select("id")
    .single();
  await logAdminAction(user, "duplicate", "projects", (created?.id as string) ?? id, null, auditValue({ from: id, slug }));
  refresh();
  redirect("/admin/projects");
}

export async function trashProjectAction(id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  if (!UUID_RE.test(id)) redirect("/admin/projects");
  await createServiceClient()
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  await logAdminAction(user, "trash", "projects", id, null, auditValue({ deleted_at: "now" }));
  refresh();
  redirect("/admin/projects?trashed=" + id);
}

export async function restoreProjectAction(id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  if (!UUID_RE.test(id)) redirect("/admin/projects");
  await createServiceClient().from("projects").update({ deleted_at: null }).eq("id", id);
  await logAdminAction(user, "restore", "projects", id, null, auditValue({ deleted_at: null }));
  refresh();
  redirect("/admin/projects/trash");
}

/** Permanent delete — reachable only for rows already in the Trash. */
export async function purgeProjectAction(id: string) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  if (!UUID_RE.test(id)) redirect("/admin/projects/trash");
  const db = createServiceClient();
  // Server-side guard: only trashed rows may be purged.
  const { data: row } = await db.from("projects").select("id,deleted_at").eq("id", id).maybeSingle();
  if (!row || !(row as { deleted_at: string | null }).deleted_at) {
    redirect("/admin/projects/trash?error=notrashed");
  }
  await db.from("projects").delete().eq("id", id);
  await logAdminAction(user, "purge", "projects", id);
  refresh();
  redirect("/admin/projects/trash");
}

/** Drag reorder — ids arrive in their new visual order. */
export async function reorderProjectsAction(ids: string[]) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  const user = await requireAdmin();
  const clean = ids.filter((x) => UUID_RE.test(x));
  if (clean.length) {
    const db = createServiceClient();
    await Promise.all(
      clean.map((rid, index) =>
        db.from("projects").update({ sort_order: index + 1 }).eq("id", rid)
      )
    );
    await logAdminAction(user, "reorder", "projects", `${clean.length} rows`, null, auditValue({ order: clean }));
    refresh();
  }
  return { ok: true, count: clean.length };
}
