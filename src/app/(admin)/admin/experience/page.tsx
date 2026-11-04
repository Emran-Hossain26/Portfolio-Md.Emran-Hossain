import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, type AdminField } from "@/components/admin/RowForm";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";

type Row = Record<string, unknown> & { id: string };

const SPEC: { name: string; label: string; type: AdminField["type"] }[] = [
  { name: "role_en", label: "Role (EN)", type: "text" },
  { name: "role_bn", label: "Role (BN)", type: "text" },
  { name: "org_en", label: "Company / org (EN)", type: "text" },
  { name: "org_bn", label: "Company / org (BN)", type: "text" },
  { name: "period", label: "Period (e.g. 2022 – present)", type: "text" },
  { name: "details", label: "Details (plain text)", type: "textarea" },
  { name: "sort", label: "Sort order (lower first)", type: "number" },
];

export default async function AdminExperiencePage() {
  await requireAdmin();

  let rows: Row[] = [];
  if (adminConfigured()) {
    const { data } = await createServiceClient()
      .from("experience")
      .select("id,role_en,role_bn,org_en,org_bn,period,details,sort")
      .order("sort");
    rows = (data ?? []) as Row[];
  }

  const blank: Record<string, unknown> = {
    role_en: "",
    role_bn: "",
    org_en: "",
    org_bn: "",
    period: "",
    details: "",
    sort: rows.length,
  };

  return (
    <AdminShell current="/admin/experience" heading="Experience">
      {rows.length === 0 ? (
        <p className="admin-note">
          No entries yet. Add your real work history — these fields feed the
          About page timeline. Nothing is shown on the site while this list is
          empty (placeholder note is displayed instead).
        </p>
      ) : null}
      {rows.map((row) => (
        <RowForm
          key={row.id}
          table="experience"
          id={row.id}
          fields={SPEC.map((field) => ({
            ...field,
            value: (row[field.name] ??
              (field.type === "number" ? 0 : "")) as string | number,
          }))}
        />
      ))}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add experience entry</h2>
      <RowForm
        table="experience"
        id="__new"
        fields={SPEC.map((f) => ({ ...f, value: blank[f.name] as string | number }))}
      />
    </AdminShell>
  );
}
