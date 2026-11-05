import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, fieldsFromSpec } from "@/components/admin/RowForm";
import { getSocialLinks } from "@/lib/cms";

const SPEC = [
  { name: "platform", label: "Platform (github/linkedin/facebook/x)", type: "text" as const },
  { name: "url", label: "URL", type: "text" as const },
  { name: "label_en", label: "Label (EN)", type: "text" as const },
  { name: "label_bn", label: "Label (BN)", type: "text" as const },
  { name: "published", label: "Published", type: "check" as const },
  { name: "sort", label: "Sort order", type: "number" as const },
];

export default async function SocialPage() {
  const rows = await getSocialLinks();
  return (
    <AdminShell current="/admin/social" heading="Social links">
      <p className="admin-note">Links shown in the footer and contact section.</p>
      {rows.map((r) => (
        <RowForm
          key={r.id}
          table="social_links"
          id={r.id}
          fields={fieldsFromSpec(SPEC, {
            platform: r.platform,
            url: r.url,
            label_en: r.label.en,
            label_bn: r.label.bn,
            published: true,
            sort: r.sort,
          })}
        />
      ))}
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Add social link</h3>
        <RowForm
          table="social_links"
          id="__new"
          fields={fieldsFromSpec(SPEC, {
            platform: "",
            url: "",
            label_en: "",
            label_bn: "",
            published: true,
            sort: rows.length + 1,
          })}
        />
      </div>
    </AdminShell>
  );
}
