import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, fieldsFromSpec } from "@/components/admin/RowForm";
import { getCertifications } from "@/lib/cms";

const SPEC = [
  { name: "title_en", label: "Title (EN)", type: "text" as const },
  { name: "title_bn", label: "Title (BN)", type: "text" as const },
  { name: "issuer_en", label: "Issuer (EN)", type: "text" as const },
  { name: "issuer_bn", label: "Issuer (BN)", type: "text" as const },
  { name: "year", label: "Year", type: "text" as const },
  { name: "href", label: "Verify link (URL)", type: "text" as const },
  { name: "published", label: "Published", type: "check" as const },
  { name: "sort_order", label: "Sort order", type: "number" as const },
];

export default async function CertificationsPage() {
  const rows = await getCertifications();
  return (
    <AdminShell current="/admin/certifications" heading="Certifications">
      <p className="admin-note">Cards with title, issuer, year and optional verify link.</p>
      {rows.map((r) => (
        <RowForm
          key={r.id}
          table="certifications"
          id={r.id}
          fields={fieldsFromSpec(SPEC, {
            title_en: r.title.en,
            title_bn: r.title.bn,
            issuer_en: r.issuer.en,
            issuer_bn: r.issuer.bn,
            year: r.year,
            href: r.href,
            published: true,
            sort_order: r.sort,
          })}
        />
      ))}
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Add certification</h3>
        <RowForm
          table="certifications"
          id="__new"
          fields={fieldsFromSpec(SPEC, {
            title_en: "",
            title_bn: "",
            issuer_en: "",
            issuer_bn: "",
            year: "",
            href: "",
            published: true,
            sort_order: rows.length + 1,
          })}
        />
      </div>
    </AdminShell>
  );
}
