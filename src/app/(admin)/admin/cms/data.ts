import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { TABS, type CmsTab, type CmsModule, type CmsAdminRow } from "./shared";

export { TABS };
export type { CmsTab, CmsModule, CmsAdminRow };

const CFG: Record<CmsModule, { table: string; orderCol: string; nameCol: string; nameSubCol: string; badgeCol: string }> = {
  projects: { table: "projects", orderCol: "sort_order", nameCol: "title_en", nameSubCol: "title_bn", badgeCol: "category" },
  services: { table: "services", orderCol: "sort_order", nameCol: "title_en", nameSubCol: "title_bn", badgeCol: "price" },
  experience: { table: "experience", orderCol: "sort", nameCol: "role_en", nameSubCol: "role_bn", badgeCol: "employment_type" },
};

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** The shared column set: identity + lifecycle + ordering + thumb source. */
const COMMON_COLS = (module: CmsModule) => {
  const c = CFG[module];
  const thumb =
    module === "projects" ? "cover_url,media,slides" : module === "services" ? "image_url" : "logo_url";
  return `id,slug,${c.nameCol},${c.nameSubCol},${c.badgeCol},tags,featured,deleted_at,updated_at,${c.orderCol},${thumb}`;
};

type DbRow = Record<string, unknown> & { id: string };

function normalize(module: CmsModule, r: DbRow): CmsAdminRow {
  const c = CFG[module];
  const legacyPublished = r.published !== false;
  const pubStatus = typeof r.pub_status === "string" && r.pub_status ? r.pub_status : legacyPublished ? "published" : "draft";
  let thumb = "";
  if (module === "projects") {
    thumb = String(r.cover_url ?? "");
    if (!thumb && Array.isArray(r.slides) && r.slides.length) {
      const first = r.slides[0] as { src?: unknown };
      if (typeof first?.src === "string") thumb = first.src;
    }
  } else if (module === "services") {
    thumb = String(r.image_url ?? "");
  } else {
    thumb = String(r.logo_url ?? "");
  }
  return {
    id: r.id,
    slug: String(r.slug ?? ""),
    name: String(r[c.nameCol] ?? ""),
    nameSub: String(r[c.nameSubCol] ?? ""),
    badge: String(r[c.badgeCol] ?? ""),
    tags: Array.isArray(r.tags) ? (r.tags as string[]).slice(0, 6) : [],
    thumb,
    pubStatus,
    legacyPublished,
    featured: r.featured === true,
    updatedAt: String(r.updated_at ?? ""),
    deletedAt: (r.deleted_at as string | null) ?? null,
  };
}

/**
 * Dashboard rows for one tab. Falls back to the pre-U4 shape (published
 * boolean only) when pub_status has not arrived yet, so the panel works
 * before and after the migration.
 */
export async function fetchCmsRows(module: CmsModule, tab: CmsTab): Promise<{ rows: CmsAdminRow[]; hasU4: boolean }> {
  if (!adminConfigured()) return { rows: [], hasU4: false };
  const cfg = CFG[module];
  const db = createServiceClient();
  const cols = COMMON_COLS(module);
  const order = { [cfg.orderCol]: "asc" } as const;

  let q = db.from(cfg.table).select(`${cols},pub_status,updated_at`).order(cfg.orderCol);
  if (tab === "trash") q = q.not("deleted_at", "is", null);
  else q = q.is("deleted_at", null);
  if (tab === "published") q = q.eq("pub_status", "published");
  if (tab === "drafts") q = q.eq("pub_status", "draft");
  if (tab === "unpublished") q = q.eq("pub_status", "unpublished");
  if (tab === "archived") q = q.eq("pub_status", "archived");
  let data: DbRow[] | null = null;
  {
    const res = await q.order("updated_at", { ascending: false, nullsFirst: false } as never);
    data = (res.data ?? null) as unknown as DbRow[] | null;
  }

  if (data) return { rows: data.map((r) => normalize(module, r)), hasU4: true };

  // Pre-migration fallback: no pub_status column — filter in JS.
  let q2 = db.from(cfg.table).select(cols).order(cfg.orderCol);
  if (tab === "trash") q2 = q2.not("deleted_at", "is", null);
  else q2 = q2.is("deleted_at", null);
  const res2 = await q2;
  const rows2 = (res2.data ?? []) as unknown as DbRow[];
  let mapped = rows2.map((r) => normalize(module, r));
  if (tab === "published") mapped = mapped.filter((r) => r.legacyPublished);
  if (tab === "drafts" || tab === "unpublished" || tab === "archived") mapped = mapped.filter((r) => !r.legacyPublished && !r.deletedAt);
  return { rows: mapped, hasU4: false };
}

/** Single row for the edit form (full columns). */
export async function fetchCmsRow(module: CmsModule, id: string): Promise<(DbRow & { pub_status?: string }) | null> {
  if (!adminConfigured() || !isUuid(id)) return null;
  const db = createServiceClient();
  const full = await db.from(CFG[module].table).select("*").eq("id", id).maybeSingle();
  if (full.data) return full.data as DbRow & { pub_status?: string };
  return null;
}

/** Revision list for one entity, newest first. */
export type RevisionRow = {
  revision_no: number;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  admin_email: string | null;
  created_at: string;
};

export async function fetchRevisions(module: CmsModule, id: string): Promise<RevisionRow[]> {
  if (!adminConfigured() || !isUuid(id)) return [];
  const db = createServiceClient();
  const { data } = await db
    .from("content_revisions")
    .select("revision_no,old_value,new_value,admin_email,created_at")
    .eq("entity_type", module)
    .eq("entity_id", id)
    .order("revision_no", { ascending: false })
    .limit(50);
  return (data ?? []) as RevisionRow[];
}

export const moduleConfig = CFG;
