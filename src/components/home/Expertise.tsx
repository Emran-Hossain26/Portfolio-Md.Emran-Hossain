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
        <h2>{t("expertise")}</h2>
        <div className="grid">
          {services.map((item) => (
            <div className="card" key={item.id}>
              <h3>{pick(locale, item.title)}</h3>
              <p>{pick(locale, item.desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
