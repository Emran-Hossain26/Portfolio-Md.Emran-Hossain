import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { RowForm, fieldsFromSpec } from "@/components/admin/RowForm";
import { getFAQ } from "@/lib/cms";

const SPEC = [
  { name: "q_en", label: "Question (EN)", type: "text" as const },
  { name: "q_bn", label: "Question (BN)", type: "text" as const },
  { name: "a_en", label: "Answer (EN)", type: "textarea" as const },
  { name: "a_bn", label: "Answer (BN)", type: "textarea" as const },
  { name: "published", label: "Published", type: "check" as const },
  { name: "sort_order", label: "Sort order", type: "number" as const },
];

export default async function FaqPage() {
  await requireAdmin();
  const rows = await getFAQ();
  return (
    <AdminShell current="/admin/faq" heading="FAQ">
      <p className="admin-note">Accordion on the homepage; emitted as FAQPage JSON-LD for Google rich results.</p>
      {rows.map((r) => (
        <RowForm
          key={r.id}
          table="faqs"
          id={r.id}
          fields={fieldsFromSpec(SPEC, {
            q_en: r.q.en,
            q_bn: r.q.bn,
            a_en: r.a.en,
            a_bn: r.a.bn,
            published: true,
            sort_order: r.sort,
          })}
        />
      ))}
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Add question</h3>
        <RowForm
          table="faqs"
          id="__new"
          fields={fieldsFromSpec(SPEC, {
            q_en: "",
            q_bn: "",
            a_en: "",
            a_bn: "",
            published: true,
            sort_order: rows.length + 1,
          })}
        />
      </div>
    </AdminShell>
  );
}
