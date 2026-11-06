import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, type AdminField } from "@/components/admin/RowForm";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";

type Row = Record<string, unknown> & { id: string };

const SPEC: {
  name: string;
  label: string;
  type: AdminField["type"];
  options?: { value: string; label: string }[];
}[] = [
  {
    name: "kind",
    label: "Kind",
    type: "select",
    options: [
      { value: "working", label: "Working on" },
      { value: "learning", label: "Learning" },
      { value: "reading", label: "Reading" },
    ],
  },
  { name: "text_en", label: "Text (EN)", type: "text" },
  { name: "text_bn", label: "Text (BN)", type: "text" },
  { name: "published", label: "Published", type: "check" },
  { name: "sort", label: "Sort order", type: "number" },
];

export default async function AdminNowPage() {
  await requireAdmin();

  let rows: Row[] = [];
  if (adminConfigured()) {
    try {
      const { data } = await createServiceClient()
        .from("now_items")
        .select("id,kind,text_en,text_bn,published,sort")
        .order("sort");
      rows = (data ?? []) as Row[];
    } catch {
      rows = [];
    }
  }

  const blank: Record<string, unknown> = {
    kind: "working",
    text_en: "",
    text_bn: "",
    published: true,
    sort: rows.length + 1,
  };

  return (
    <AdminShell current="/admin/now" heading="Now items">
      <p className="admin-note">
        The human “Now” section on the homepage — what you are currently
        working on / learning / reading (Stage 6 #5). Needs the 20261113
        migration. Visibility also follows the Sections manager.
      </p>
      {rows.map((row) => (
        <RowForm
          key={row.id}
          table="now_items"
          id={row.id}
          fields={SPEC.map((field) => ({
            ...field,
            value: (row[field.name] ?? (field.type === "check" ? false : "")) as string | boolean,
          }))}
        />
      ))}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add item</h2>
      <RowForm
        table="now_items"
        id="__new"
        fields={SPEC.map((f) => ({ ...f, value: blank[f.name] as string | boolean }))}
      />
    </AdminShell>
  );
}
