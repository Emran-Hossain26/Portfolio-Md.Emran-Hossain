import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, type AdminField } from "@/components/admin/RowForm";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { projects as seedProjects } from "@/data/projects";

type Row = Record<string, unknown> & { id: string };

const SPEC: { name: string; label: string; type: AdminField["type"] }[] = [
  { name: "slug", label: "Slug (URL part, e.g. likhon-tools)", type: "text" },
  { name: "title_en", label: "Title (EN)", type: "text" },
  { name: "title_bn", label: "Title (BN)", type: "text" },
  { name: "desc_en", label: "Description (EN)", type: "textarea" },
  { name: "desc_bn", label: "Description (BN)", type: "textarea" },
  { name: "tags", label: "Tags (comma-separated)", type: "text" },
  { name: "href", label: "Live site link (empty = private case study)", type: "text" },
  { name: "published", label: "Published", type: "check" },
  { name: "sort", label: "Sort order (lower first)", type: "number" },
];

export default async function AdminProjectsPage() {
  await requireAdmin();

  let rows: Row[];
  if (adminConfigured()) {
    const { data } = await createServiceClient()
      .from("projects")
      .select("id,slug,title_en,title_bn,desc_en,desc_bn,tags,href,published,sort")
      .order("sort");
    rows = (data ?? []) as Row[];
  } else {
    rows = seedProjects.map((p, index) => ({
      id: `seed-${index}`,
      slug: p.slug,
      title_en: p.title.en,
      title_bn: p.title.bn,
      desc_en: p.desc.en,
      desc_bn: p.desc.bn,
      tags: p.tags.join(", "),
      href: p.href ?? "",
      published: true,
      sort: index,
    }));
  }

  const blank: Record<string, unknown> = {
    slug: "",
    title_en: "",
    title_bn: "",
    desc_en: "",
    desc_bn: "",
    tags: "",
    href: "",
    published: true,
    sort: rows.length,
  };

  return (
    <AdminShell current="/admin/projects" heading="Projects">
      <p className="admin-note">
        Seed data shown until Supabase is configured. Tags are comma-separated;
        “Live site link” only for projects with public URLs.
      </p>
      {rows.map((row) => (
        <RowForm
          key={row.id}
          table="projects"
          id={row.id}
          fields={SPEC.map((field) => ({
            ...field,
            value:
              field.name === "tags"
                ? Array.isArray(row.tags)
                  ? (row.tags as string[]).join(", ")
                  : String(row.tags ?? "")
                : (row[field.name] ?? (field.type === "check" ? false : "")) as string | number | boolean,
          }))}
        />
      ))}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add project</h2>
      <RowForm table="projects" id="__new" fields={SPEC.map((f) => ({ ...f, value: blank[f.name] as string | number | boolean }))} />
    </AdminShell>
  );
}
