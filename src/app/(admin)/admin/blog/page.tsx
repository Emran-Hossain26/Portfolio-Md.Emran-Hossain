import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, type AdminField } from "@/components/admin/RowForm";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { samplePosts as seedPosts } from "@/data/posts";

type Row = Record<string, unknown> & { id: string };

const SPEC: { name: string; label: string; type: AdminField["type"] }[] = [
  { name: "slug", label: "Slug (URL part, e.g. harden-windows-server)", type: "text" },
  { name: "title_en", label: "Title (EN)", type: "text" },
  { name: "title_bn", label: "Title (BN)", type: "text" },
  { name: "meta_en", label: "Meta line (EN, e.g. date · read time)", type: "text" },
  { name: "meta_bn", label: "Meta line (BN)", type: "text" },
  { name: "body_en", label: "Body (EN, Markdown)", type: "textarea" },
  { name: "body_bn", label: "Body (BN, Markdown)", type: "textarea" },
  { name: "published", label: "Published (appears on site when checked)", type: "check" },
];

export default async function AdminBlogPage() {
  await requireAdmin();

  let rows: Row[];
  if (adminConfigured()) {
    const { data } = await createServiceClient()
      .from("posts")
      .select("id,slug,title_en,title_bn,meta_en,meta_bn,body_en,body_bn,published")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as Row[];
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
    }));
  }

  const blank: Record<string, unknown> = {
    slug: "",
    title_en: "",
    title_bn: "",
    meta_en: "",
    meta_bn: "",
    body_en: "",
    body_bn: "",
    published: false,
  };

  return (
    <AdminShell current="/admin/blog" heading="Blog posts">
      <p className="admin-note">
        Bodies are Markdown (paragraphs, **bold**, lists, links, code). Rendered
        output is sanitised server-side. Posts stay on the site only while
        “Published” is checked.
      </p>
      {rows.map((row) => (
        <RowForm
          key={row.id}
          table="posts"
          id={row.id}
          fields={SPEC.map((field) => ({
            ...field,
            value: (row[field.name] ?? (field.type === "check" ? false : "")) as string | boolean,
          }))}
        />
      ))}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add post</h2>
      <RowForm
        table="posts"
        id="__new"
        fields={SPEC.map((f) => ({ ...f, value: blank[f.name] as string | boolean }))}
      />
    </AdminShell>
  );
}
