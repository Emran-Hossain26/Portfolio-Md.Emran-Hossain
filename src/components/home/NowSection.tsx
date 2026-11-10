import { getLocale, getTranslations } from "next-intl/server";
import { getNowItems } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

const KIND_LABEL: Record<string, { en: string; bn: string; glyph: string }> = {
  working: { en: "Working on", bn: "কাজ করছি", glyph: "🛠️" },
  learning: { en: "Learning", bn: "শিখছি", glyph: "📚" },
  reading: { en: "Reading", bn: "পড়ছি", glyph: "📖" },
};

/**
 * Stage 6 #5 — the human "Now" section: what the admin is currently
 * working on / learning / reading. Small by design; renders nothing when
 * the admin has not added items.
 */
export async function NowSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("now");
  const rows = await getNowItems();
  if (!rows.length) return null;

  return (
    <section id="now" data-sec="now">
      <div className="wrap">
        <h2 data-ac="text">{t("title")}</h2>
        <div className="card" data-ac="box" style={{ maxWidth: 760, display: "grid", gap: 10 }}>
          {rows.map((r) => {
            const label = KIND_LABEL[r.kind] ?? KIND_LABEL.working;
            return (
              <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span aria-hidden="true">{label.glyph}</span>
                <span>
                  <b style={{ marginRight: 8, fontSize: 14 }}>
                    {locale === "bn" ? label.bn : label.en}
                  </b>
                  <span style={{ color: "var(--mute)" }}>{pick(locale, r.text)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
