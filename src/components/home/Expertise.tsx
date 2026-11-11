import { getLocale, getTranslations } from "next-intl/server";
import { getServices } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

/** Render the admin-provided inline SVG icon (trusted admin authoring). */
function ServiceIcon({ svg, name }: { svg?: string; name?: string }) {
  const safe = svg?.trim().replace(/<script[\s\S]*?<\/script>/gi, "");
  if (safe && /^<svg[\s>]/i.test(safe)) {
    return (
      <span
        aria-hidden="true"
        style={{ display: "inline-flex", width: 26, height: 26, color: "var(--accent)" }}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }
  if (name) return <span aria-hidden="true" style={{ fontSize: 20 }}>◆</span>;
  return null;
}

/** Task U4 — "What I do" reads the services module (published only). */
export async function Expertise() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const services = await getServices();
  const sorted = [...services].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  return (
    <section id="expertise" data-sec="expertise">
      <div className="wrap">
        <h2 data-ac="text">{t("expertise")}</h2>
        <div className="grid">
          {sorted.map((item) => (
            <div className="card" data-ac="box" key={item.id}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                <ServiceIcon svg={item.iconSvg} name={item.icon} />
                <h3 data-ac="text" style={{ margin: 0 }}>{pick(locale, item.title)}</h3>
                {item.featured ? <span aria-hidden="true" title="Featured">★</span> : null}
              </div>
              <p data-ac="text">{pick(locale, item.desc)}</p>
              {item.tags?.length ? (
                <div className="tags" style={{ marginTop: 10 }}>
                  {item.tags.slice(0, 6).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
