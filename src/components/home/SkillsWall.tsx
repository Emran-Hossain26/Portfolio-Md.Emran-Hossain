import { getLocale, getTranslations } from "next-intl/server";
import { getSkills } from "@/lib/cms";

/** Task content update: honest category headers with owner-reviewed Bengali
 *  labels (the stored `category` value stays EN in the admin). */
const CATEGORY_BN: Record<string, string> = {
  "Professional experience": "পেশাদার অভিজ্ঞতা",
  "Working knowledge": "কার্যকরী জ্ঞান",
  "Project-based exposure": "প্রজেক্ট-ভিত্তিক অভিজ্ঞতা",
};

/**
 * Stage 6 #4 — tech stack / tools wall. Skills are grouped by their
 * `category` column; the `level` value renders as a relative indicator bar
 * only (numeric % proficiency claims were removed in the content update).
 * Renders nothing when the admin has no published skills.
 */
export async function SkillsWall() {
  const t = await getTranslations("sections");
  const locale = (await getLocale()) as "en" | "bn";
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
              <h3 style={{ marginBottom: 12 }} data-ac="text">
                {locale === "bn" ? CATEGORY_BN[category] ?? category : category}
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                {list.map((s) => (
                  <div key={s.id}>
                    <div style={{ fontSize: 14, marginBottom: 6 }}>
                      <span>{s.name}</span>
                      {/* Task content update: numeric % proficiency labels removed —
                          levels remain only as relative indicator bars (honest
                          presentation, no claimed precision). */}
                    </div>
                    <div
                      role="img"
                      aria-label={`${s.name} — ${s.category}`}
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
