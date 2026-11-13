import { getLocale, getTranslations } from "next-intl/server";
import { getExperience } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

/** Small secondary link to the employer's official website (↗ domain). */
function OrgLink({ url, locale }: { url: string; locale: Locale }) {
  const domain = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  return (
    <a
      className="exp-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={locale === "bn" ? `${domain} — নতুন ট্যাবে খুলবে` : `${domain} — opens in a new tab`}
    >
      <span aria-hidden="true">↗</span> {domain}
    </a>
  );
}

/** Green current-position marker (career status, not uptime). Static under
 *  prefers-reduced-motion — the pulse only runs when motion is allowed. */
function CurrentMark({ locale }: { locale: Locale }) {
  return (
    <span className="exp-current">
      <i aria-hidden="true" />
      {locale === "bn" ? "বর্তমানে কর্মরত" : "Currently Working"}
    </span>
  );
}

/** Task U1/U4/U7 — Experience timeline on the home page: ALL positions,
 *  official company links, and a green marker on the current employer. */
export async function Experience() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("pages.about");
  const rows = await getExperience();
  if (!rows.length) return null;

  return (
    <section id="experience" data-sec="experience">
      <div className="wrap">
        <h2>{t("expTitle")}</h2>
        <div className="timeline">
          {rows.map((item, index) => {
            const parts: React.ReactNode[] = [pick(locale, item.org)];
            if (item.employmentType) parts.push(item.employmentType);
            if (item.period) parts.push(item.period);
            return (
              <div className="timeline-item" key={index}>
                <div className="card" style={{ padding: "14px 16px" }}>
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {pick(locale, item.role)}
                    {item.isCurrent ? <CurrentMark locale={locale} /> : null}
                  </h3>
                  <p className="mute" style={{ margin: "4px 0 0" }}>
                    {parts.map((part, i) => (
                      <span key={i}>{i > 0 ? " · " : ""}{part}</span>
                    ))}
                  </p>
                  {item.websiteUrl ? (
                    <p style={{ margin: "2px 0 0" }}>
                      <OrgLink url={item.websiteUrl} locale={locale} />
                    </p>
                  ) : null}
                  {item.summary ? <p style={{ margin: "8px 0 0" }}>{pick(locale, item.summary)}</p> : null}
                  {item.achievements ? (
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--mute)", fontSize: 14 }}>
                      {pick(locale, item.achievements)
                        .split("\n")
                        .filter(Boolean)
                        .slice(0, 6)
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
