import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { RowForm, fieldsFromSpec } from "@/components/admin/RowForm";
import { getServices } from "@/lib/cms";

const SPEC = [
  { name: "title_en", label: "Title (EN)", type: "text" as const },
  { name: "title_bn", label: "Title (BN)", type: "text" as const },
  { name: "desc_en", label: "Description (EN)", type: "textarea" as const },
  { name: "desc_bn", label: "Description (BN)", type: "textarea" as const },
  { name: "icon", label: "Icon (name or url)", type: "text" as const },
  { name: "price", label: "Price (free-form, e.g. From ৳15,000 / project)", type: "text" as const },
  { name: "published", label: "Published", type: "check" as const },
  { name: "sort_order", label: "Sort order", type: "number" as const },
];

export default async function ServicesPage() {
  await requireAdmin();
  const rows = await getServices();
  return (
    <AdminShell current="/admin/services" heading="Services / Expertise cards">
      <p className="admin-note">
        Editable cards shown in the Expertise section. Empty rows are dropped on
        save. New rows: use “Add service”.
      </p>
      {rows.map((r) => (
        <RowForm
          key={r.id}
          table="services"
          id={r.id}
          fields={fieldsFromSpec(SPEC, {
            title_en: r.title.en,
            title_bn: r.title.bn,
            desc_en: r.desc.en,
            desc_bn: r.desc.bn,
            icon: r.icon,
            price: r.price,
            published: true,
            sort_order: r.sort,
          })}
        />
      ))}
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Add service</h3>
        <form action={undefined as never} className="admin-editor">
          <input type="hidden" name="__table" value="services" />
        </form>
        <RowForm
          table="services"
          id="__new"
          fields={fieldsFromSpec(SPEC, {
            title_en: "",
            title_bn: "",
            desc_en: "",
            desc_bn: "",
            icon: "",
            price: "",
            published: true,
            sort_order: rows.length + 1,
          })}
        />
      </div>
    </AdminShell>
  );
}
