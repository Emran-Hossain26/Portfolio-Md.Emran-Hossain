import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, fieldsFromSpec } from "@/components/admin/RowForm";
import { getStats } from "@/lib/cms";

const SPEC = [
  { name: "value", label: "Value (e.g. 5+)", type: "text" as const },
  { name: "label_en", label: "Label (EN)", type: "text" as const },
  { name: "label_bn", label: "Label (BN)", type: "text" as const },
  { name: "published", label: "Published", type: "check" as const },
  { name: "sort_order", label: "Sort order", type: "number" as const },
];

export default async function StatsPage() {
  const rows = await getStats();
  return (
    <AdminShell current="/admin/stats" heading="Stats (Proof in numbers)">
      <p className="admin-note">Number + label cards under the expertise section.</p>
      {rows.map((r) => (
        <RowForm
          key={r.id}
          table="stats"
          id={r.id}
          fields={fieldsFromSpec(SPEC, {
            value: r.value,
            label_en: r.label.en,
            label_bn: r.label.bn,
            published: true,
            sort_order: r.sort,
          })}
        />
      ))}
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Add stat</h3>
        <RowForm
          table="stats"
          id="__new"
          fields={fieldsFromSpec(SPEC, {
            value: "",
            label_en: "",
            label_bn: "",
            published: true,
            sort_order: rows.length + 1,
          })}
        />
      </div>
    </AdminShell>
  );
}
