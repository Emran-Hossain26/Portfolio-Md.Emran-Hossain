import { getLocale, getTranslations } from "next-intl/server";
import { getExperience } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

/** Stage U1 — Experience timeline on the home page (latest 2–3 roles). */
export async function Experience() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("pages.about");
  const rows = await getExperience();
  if (!rows.length) return null;
  const show = rows.slice(0, 3);

  return (
    <section id="experience" data-sec="experience">
      <div className="wrap">
        <h2>{t("expTitle")}</h2>
        <div className="timeline">
          {show.map((item, index) => (
            <div className="timeline-item" key={index}>
              <div className="card" style={{ padding: "14px 16px" }}>
                <h3 style={{ margin: 0 }}>{pick(locale, item.role)}</h3>
                <p className="mute" style={{ margin: "4px 0 0" }}>
                  {[pick(locale, item.org), item.period].filter(Boolean).join(" · ")}
                </p>
                {/* details: single mixed-language DB column — omitted on home, full text lives on /about */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
