import { getTranslations } from "next-intl/server";
import { getSkills } from "@/lib/cms";

/**
 * Stage 6 #4 — tech stack / tools wall with proficiency. Skills are grouped
 * by their `category` column; the `level` percentage renders as a bar.
 * Renders nothing when the admin has no published skills.
 */
export async function SkillsWall() {
  const t = await getTranslations("sections");
  const rows = await getSkills();
  if (!rows.length) return null;

  const groups = new Map<string, typeof rows>();
  for (const s of rows) {
    const key = s.category || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <section id="skills" data-sec="skills">
      <div className="wrap">
        <h2 data-ac="text">{t("skillsTitle")}</h2>
        <div className="grid">
          {[...groups.entries()].map(([category, list]) => (
            <div className="card" data-ac="box" key={category}>
              <h3 style={{ marginBottom: 12 }} data-ac="text">{category}</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {list.map((s) => (
                  <div key={s.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      <span>{s.name}</span>
                      <span className="mute">{s.level}%</span>
                    </div>
                    <div
                      role="img"
                      aria-label={`${s.name} ${s.level}%`}
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "var(--line)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, s.level))}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
