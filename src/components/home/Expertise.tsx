import { getLocale, getTranslations } from "next-intl/server";
import { expertiseItems } from "@/data/expertise";
import { pick, type Locale } from "@/data/types";

export async function Expertise() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");

  return (
    <section id="expertise">
      <h2>{t("expertise")}</h2>
      <div className="grid">
        {expertiseItems.map((item) => (
          <div className="card" key={item.title.en}>
            <h3>{pick(locale, item.title)}</h3>
            <p>{pick(locale, item.desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
