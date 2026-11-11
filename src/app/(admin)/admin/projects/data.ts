import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { seedProjects } from "@/data/projects";
import type { ProjectRow } from "@/components/admin/ProjectsManager";

export type AdminProjectRow = Record<string, unknown> & { id: string };

/** Normalize a DB row into the client manager shape. */
export function toManagerRow(row: AdminProjectRow): ProjectRow {
  return {
    id: row.id,
    slug: String(row.slug ?? ""),
    title_en: String(row.title_en ?? ""),
    title_bn: String(row.title_bn ?? ""),
    status: String(row.status ?? "completed"),
    published: row.published !== false,
    featured: row.featured === true,
    sort_order: Number(row.sort_order ?? 0) || 0,
    deleted_at: (row.deleted_at as string | null) ?? null,
  };
}

/** Baseline columns (pre-migration shape). */
const BASE =
  "id,slug,title_en,title_bn,problem_en,problem_bn,solution_en,solution_bn,result_en,result_bn,metrics,tech,media,video,slides,demo_url,published,sort_order";
/** Stage U2 columns (migration 20261117). */
const U2 = "status,featured,live_url,repo_url,deleted_at";

/**
 * Admin list fetch. Tries the full U2 shape first; pre-migration it falls
 * back to the baseline shape so the page never breaks. Every caller must
 * run requireAdmin() before this — it is the admin-side data gate.
 */
export async function fetchAdminProjects(): Promise<{ rows: AdminProjectRow[]; hasU2: boolean }> {
  if (!adminConfigured()) {
    // Same seed fallback as before (panel preview without Supabase keys).
    return {
      rows: seedProjects.map((p, i) => ({
        id: `seed-${i}`,
        slug: p.slug,
        title_en: p.title.en,
        title_bn: p.title.bn,
        status: "completed",
        published: true,
        featured: false,
        sort_order: i + 1,
        deleted_at: null,
      })),
      hasU2: false,
    };
  }
  const db = createServiceClient();
  const full = await db
    .from("projects")
    .select(`${BASE},${U2}`)
    .is("deleted_at", null)
    .order("sort_order");
  if (full.data) return { rows: full.data as AdminProjectRow[], hasU2: true };
  const base = await db.from("projects").select(BASE).order("sort_order");
  return { rows: (base.data ?? []) as AdminProjectRow[], hasU2: false };
}

export async function fetchAdminProject(id: string): Promise<AdminProjectRow | null> {
  if (!adminConfigured()) return null;
  const db = createServiceClient();
  const full = await db.from("projects").select(`${BASE},${U2}`).eq("id", id).maybeSingle();
  if (full.data) return full.data as AdminProjectRow;
  const base = await db.from("projects").select(BASE).eq("id", id).maybeSingle();
  return (base.data ?? null) as AdminProjectRow | null;
}

/** Trash listing — rows where deleted_at is set (U2 schema only). */
export async function fetchTrashedProjects(): Promise<AdminProjectRow[]> {
  if (!adminConfigured()) return [];
  const db = createServiceClient();
  const { data } = await db
    .from("projects")
    .select(`${BASE},${U2}`)
    .not("deleted_at", "is", null)
    .order("sort_order");
  return (data ?? []) as AdminProjectRow[];
}

/** Normalize any fetched row into the form shape. */
export function toFormRow(row: AdminProjectRow | null) {
  return {
    slug: String(row?.slug ?? ""),
    title_en: String(row?.title_en ?? ""),
    title_bn: String(row?.title_bn ?? ""),
    problem_en: String(row?.problem_en ?? ""),
    problem_bn: String(row?.problem_bn ?? ""),
    solution_en: String(row?.solution_en ?? ""),
    solution_bn: String(row?.solution_bn ?? ""),
    result_en: String(row?.result_en ?? ""),
    result_bn: String(row?.result_bn ?? ""),
    metrics: Array.isArray(row?.metrics) ? (row.metrics as { label: string; value: string }[]) : [],
    tech: Array.isArray(row?.tech) ? (row.tech as string[]) : [],
    media: String(row?.media ?? "slides"),
    video: String(row?.video ?? ""),
    slides: Array.isArray(row?.slides)
      ? (row.slides as { src: string; caption_en: string; caption_bn: string }[]).filter(
          (s) => s && typeof s.src === "string"
        )
      : [],
    demo_url: String(row?.demo_url ?? ""),
    live_url: String(row?.live_url ?? ""),
    repo_url: String(row?.repo_url ?? ""),
    status: String(row?.status ?? "completed"),
    published: row?.published !== false,
    featured: row?.featured === true,
    sort_order: Number(row?.sort_order ?? 0) || 0,
  };
}
