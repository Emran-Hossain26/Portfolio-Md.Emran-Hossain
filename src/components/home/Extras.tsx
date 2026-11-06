import { getLocale, getTranslations } from "next-intl/server";
import { getCertifications, getFAQ, getStats } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

export async function Stats() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const rows = await getStats();
  if (!rows.length) return null;
  return (
    <section id="stats" data-sec="stats">
      <div className="wrap">
        <h2>{t("stats")}</h2>
        <div className="grid">
          {rows.map((r) => (
            <div className="card" key={r.id}>
              <b
                style={{ display: "block", fontSize: 34, color: "var(--accent)", fontFamily: "var(--font-sora), sans-serif" }}
                data-countup
                aria-label={r.value}
              >
                {r.value}
              </b>
              <span style={{ display: "block", marginTop: 6, color: "var(--mute)", fontSize: 14 }}>
                {pick(locale, r.label)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function Certifications() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const rows = await getCertifications();
  if (!rows.length) return null;
  return (
    <section id="certifications" data-sec="certifications">
      <div className="wrap">
        <h2>{t("certifications")}</h2>
        {/* Wall layout (Stage 6 #3): badge chip + prominent verify link */}
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {rows.map((r) => (
            <div
              className="card"
              key={r.id}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <span
                className="chip on"
                style={{ alignSelf: "flex-start", fontSize: 12 }}
                aria-hidden="true"
              >
                ✓
              </span>
              <h3 style={{ margin: 0 }}>{pick(locale, r.title)}</h3>
              <p className="mute" style={{ margin: 0, fontSize: 14 }}>
                {[pick(locale, r.issuer), r.year].filter(Boolean).join(" · ")}
              </p>
              {r.href ? (
                <a
                  className="btn"
                  style={{ alignSelf: "flex-start", marginTop: "auto" }}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {locale === "bn" ? "ভেরিফাই করুন →" : "Verify →"}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function Faq() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const rows = await getFAQ();
  if (!rows.length) return null;
  const items = rows.map((r) => ({ q: pick(locale, r.q), a: pick(locale, r.a) }));
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
  return (
    <section id="faq" data-sec="faq">
      <div className="wrap">
        <h2>{t("faq")}</h2>
        <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
          {items.map((it, i) => (
            <details
              key={i}
              className="card"
              style={{ padding: 14 }}
              {...(i === 0 ? { open: true } : {})}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 15.5 }}>
                {it.q}
              </summary>
              <p style={{ marginTop: 10, color: "var(--mute)", fontSize: 15 }}>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </section>
  );
}
