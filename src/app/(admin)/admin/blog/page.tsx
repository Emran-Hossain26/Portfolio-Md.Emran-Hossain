import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { TabbedForm } from "@/components/admin/TabbedForm";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { samplePosts as seedPosts } from "@/data/posts";

type Row = Record<string, unknown> & { id: string };

const CONTENT_FIELDS = [
  { name: "slug", label: "Slug (URL part)", type: "text" as const },
  { name: "title_en", label: "Title (EN)", type: "text" as const },
  { name: "title_bn", label: "Title (BN)", type: "text" as const },
  { name: "cover_url", label: "Cover image URL (optional — shown above the post)", type: "text" as const },
  { name: "meta_en", label: "Meta line (EN)", type: "text" as const },
  { name: "meta_bn", label: "Meta line (BN)", type: "text" as const },
  { name: "body_en", label: "Body (EN, Markdown)", type: "textarea" as const },
  { name: "body_bn", label: "Body (BN, Markdown)", type: "textarea" as const },
];

const SEO_FIELDS = [
  { name: "seo_title_en", label: "SEO title (EN)", type: "text" as const },
  { name: "seo_title_bn", label: "SEO title (BN)", type: "text" as const },
  { name: "seo_desc_en", label: "SEO description (EN)", type: "textarea" as const },
  { name: "seo_desc_bn", label: "SEO description (BN)", type: "textarea" as const },
  { name: "og_image", label: "OG image URL", type: "text" as const },
  { name: "canonical", label: "Canonical URL (optional)", type: "text" as const },
  { name: "noindex", label: "Noindex (hide from search)", type: "check" as const },
];

const SETTINGS_FIELDS = [
  { name: "status", label: "Status (draft/published/scheduled)", type: "text" as const },
  { name: "scheduled_at", label: "Scheduled publish (ISO, optional)", type: "text" as const },
  { name: "categories", label: "Categories (comma-separated)", type: "text" as const },
  { name: "tags", label: "Tags (comma-separated)", type: "text" as const },
  { name: "published", label: "Published", type: "check" as const },
];

export default async function AdminBlogPage() {
  await requireAdmin();

  let rows: Row[];
  if (adminConfigured()) {
    const db = createServiceClient();
    const base = "id,slug,title_en,title_bn,meta_en,meta_bn,body_en,body_bn,published,status,scheduled_at,categories,tags,seo_title_en,seo_title_bn,seo_desc_en,seo_desc_bn,og_image,cover_url,canonical,noindex,view_count";
    const { data } = await db.from("posts").select(base).order("created_at", { ascending: false });
    if (data) {
      rows = data as unknown as Row[];
    } else {
      // Pre-migration: cover_url column missing — retry without it.
      const retry = await db
        .from("posts")
        .select(base.replace(",og_image,cover_url,", ",og_image,"))
        .order("created_at", { ascending: false });
      rows = (retry.data ?? []) as unknown as Row[];
    }
  } else {
    rows = seedPosts.map((p, index) => ({
      id: `seed-${index}`,
      slug: p.slug,
      title_en: p.title.en,
      title_bn: p.title.bn,
      meta_en: p.meta.en,
      meta_bn: p.meta.bn,
      body_en: p.body.en,
      body_bn: p.body.bn,
      published: true,
      status: "published",
      scheduled_at: null,
      categories: [],
      tags: [],
      seo_title_en: "",
      seo_title_bn: "",
      seo_desc_en: "",
      seo_desc_bn: "",
      og_image: "",
      cover_url: "",
      canonical: "",
      noindex: false,
    }));
  }

  const blank: Record<string, unknown> = {
    slug: "",
    title_en: "",
    title_bn: "",
    cover_url: "",
    meta_en: "",
    meta_bn: "",
    body_en: "",
    body_bn: "",
    published: false,
    status: "draft",
    scheduled_at: "",
    categories: "",
    tags: "",
    seo_title_en: "",
    seo_title_bn: "",
    seo_desc_en: "",
    seo_desc_bn: "",
    og_image: "",
    canonical: "",
    noindex: false,
  };

  const normalize = (row: Row) => {
    const r = { ...row };
    if (Array.isArray(r.categories)) r.categories = (r.categories as string[]).join(", ");
    if (Array.isArray(r.tags)) r.tags = (r.tags as string[]).join(", ");
    return r;
  };

  const toFields = (spec: { name: string; label: string; type: "text" | "textarea" | "check" | "number" | "select" }[], row: Record<string, unknown>) =>
    spec.map((f) => ({
      ...f,
      value: (row[f.name] ?? (f.type === "check" ? false : "")) as string | boolean,
    }));

  return (
    <AdminShell current="/admin/blog" heading="Blog posts">
      {/* Mockup slide \"Blog & projects\": overview table with status/views */}
      {rows.length ? (
        <div className="c" style={{ marginBottom: 18, overflowX: "auto" }}>
          <table>
            <thead>
              <tr><th>Title</th><th>Status</th><th>Views</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{String(row.title_en || row.title_bn || row.slug || "(untitled)")}</td>
                  <td>
                    <span className={"chip " + (row.status === "published" ? "ok" : row.status === "scheduled" ? "warn" : "")}>
                      {String(row.status ?? "draft")}
                    </span>
                  </td>
                  <td>{typeof row.view_count === "number" ? row.view_count : 0}</td>
                  <td>
                    {row.slug ? (
                      <a className="btn s" href={`/admin/preview/${String(row.slug)}`}>Preview</a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="admin-note">
        Bodies are Markdown (paragraphs, **bold**, lists, links, code blocks, tables).
        Rendered output is sanitised server-side. Set Status to &quot;published&quot; to make a
        post live; use &quot;scheduled&quot; with a future ISO date for scheduled publishing.
      </p>
      {rows.map((row) => {
        const r = normalize(row);
        return (
          <TabbedForm
            key={row.id}
            table="posts"
            id={row.id}
            groups={[
              { label: "Content", fields: toFields(CONTENT_FIELDS, r) },
              { label: "SEO", fields: toFields(SEO_FIELDS, r) },
              { label: "Settings", fields: toFields(SETTINGS_FIELDS, r) },
            ]}
          />
        );
      })}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add post</h2>
      <TabbedForm
        table="posts"
        id="__new"
        groups={[
          { label: "Content", fields: toFields(CONTENT_FIELDS, blank) },
          { label: "SEO", fields: toFields(SEO_FIELDS, blank) },
          { label: "Settings", fields: toFields(SETTINGS_FIELDS, blank) },
        ]}
      />
    </AdminShell>
  );
}
