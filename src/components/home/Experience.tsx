import { getLocale, getTranslations } from "next-intl/server";
import { getExperience } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

/** Task U1/U4 — Experience timeline on the home page (latest roles). */
export async function Experience() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("pages.about");
  const rows = await getExperience();
  if (!rows.length) return null;
  // Content phase: show ALL six positions (complete career history).
  const show = rows;

  return (
    <section id="experience" data-sec="experience">
      <div className="wrap">
        <h2>{t("expTitle")}</h2>
        <div className="timeline">
          {show.map((item, index) => {
            const orgPart = item.websiteUrl ? (
              <a key="org" href={item.websiteUrl} target="_blank" rel="noopener noreferrer">
                {pick(locale, item.org)}
              </a>
            ) : (
              pick(locale, item.org)
            );
            const parts: React.ReactNode[] = [orgPart];
            if (item.employmentType) parts.push(item.employmentType);
            if (item.period) parts.push(item.period);
            return (
              <div className="timeline-item" key={index}>
                <div className="card" style={{ padding: "14px 16px" }}>
                  <h3 style={{ margin: 0 }}>{pick(locale, item.role)}</h3>
                  <p className="mute" style={{ margin: "4px 0 0" }}>
                    {parts.map((part, i) => (
                      <span key={i}>{i > 0 ? " · " : ""}{part}</span>
                    ))}
                  </p>
                  {item.summary ? <p style={{ margin: "8px 0 0" }}>{pick(locale, item.summary)}</p> : null}
                  {item.achievements ? (
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--mute)", fontSize: 14 }}>
                      {pick(locale, item.achievements)
                        .split("\n")
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
