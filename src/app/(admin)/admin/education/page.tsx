import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, type AdminField } from "@/components/admin/RowForm";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";

type Row = Record<string, unknown> & { id: string };

const SPEC: { name: string; label: string; type: AdminField["type"] }[] = [
  { name: "degree_en", label: "Degree (EN)", type: "text" },
  { name: "degree_bn", label: "Degree (BN)", type: "text" },
  { name: "org_en", label: "Institution (EN)", type: "text" },
  { name: "org_bn", label: "Institution (BN)", type: "text" },
  { name: "period", label: "Period (e.g. 2018 – 2022)", type: "text" },
  { name: "sort", label: "Sort order (lower first)", type: "number" },
];

export default async function AdminEducationPage() {
  await requireAdmin();

  let rows: Row[] = [];
  if (adminConfigured()) {
    const { data } = await createServiceClient()
      .from("education")
      .select("id,degree_en,degree_bn,org_en,org_bn,period,sort")
      .order("sort");
    rows = (data ?? []) as Row[];
  }

  const blank: Record<string, unknown> = {
    degree_en: "",
    degree_bn: "",
    org_en: "",
    org_bn: "",
    period: "",
    sort: rows.length,
  };

  return (
    <AdminShell current="/admin/education" heading="Education">
      {rows.length === 0 ? (
        <p className="admin-note">
          No entries yet. Add your real education history — these fields feed
          the About page. Nothing is shown on the site while this list is empty.
        </p>
      ) : null}
      {rows.map((row) => (
        <RowForm
          key={row.id}
          table="education"
          id={row.id}
          fields={SPEC.map((field) => ({
            ...field,
            value: (row[field.name] ??
              (field.type === "number" ? 0 : "")) as string | number,
          }))}
        />
      ))}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add education entry</h2>
      <RowForm
        table="education"
        id="__new"
        fields={SPEC.map((f) => ({ ...f, value: blank[f.name] as string | number }))}
      />
    </AdminShell>
  );
}
