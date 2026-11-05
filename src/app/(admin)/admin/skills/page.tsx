import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, fieldsFromSpec } from "@/components/admin/RowForm";
import { getSkills } from "@/lib/cms";

const SPEC = [
  { name: "name", label: "Skill name", type: "text" as const },
  { name: "category", label: "Category (infrastructure/development/security/devops)", type: "text" as const },
  { name: "level", label: "Level (0–100)", type: "number" as const },
  { name: "published", label: "Published", type: "check" as const },
  { name: "sort", label: "Sort order", type: "number" as const },
];

export default async function SkillsPage() {
  const rows = await getSkills();
  return (
    <AdminShell current="/admin/skills" heading="Skills">
      <p className="admin-note">Proficiency levels shown as bars on the public site.</p>
      {rows.map((r) => (
        <RowForm
          key={r.id}
          table="skills"
          id={r.id}
          fields={fieldsFromSpec(SPEC, {
            name: r.name,
            category: r.category,
            level: r.level,
            published: true,
            sort: r.sort,
          })}
        />
      ))}
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Add skill</h3>
        <RowForm
          table="skills"
          id="__new"
          fields={fieldsFromSpec(SPEC, {
            name: "",
            category: "general",
            level: 50,
            published: true,
            sort: rows.length + 1,
          })}
        />
      </div>
    </AdminShell>
  );
}
