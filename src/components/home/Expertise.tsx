import { getLocale, getTranslations } from "next-intl/server";
import { getServices } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

export async function Expertise() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const services = await getServices();

  return (
    <section id="expertise" data-sec="expertise">
      <div className="wrap">
        <h2 data-ac="text">{t("expertise")}</h2>
        <div className="grid">
          {services.map((item) => (
            <div className="card" data-ac="box" key={item.id}>
              <h3 data-ac="text">{pick(locale, item.title)}</h3>
              <p data-ac="text">{pick(locale, item.desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
