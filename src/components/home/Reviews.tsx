import { getLocale, getTranslations } from "next-intl/server";
import { placeholderTestimonials } from "@/data/testimonials";
import { pick, type Locale } from "@/data/types";

export async function Reviews() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");

  return (
    <section id="reviews">
      <h2>{t("reviews")}</h2>
      <div className="grid">
        {placeholderTestimonials.map((item, index) => (
          <div className="card" key={index}>
            <blockquote>
              {pick(locale, item.quote)}
              <footer>{pick(locale, item.name)}</footer>
            </blockquote>
          </div>
        ))}
      </div>
    </section>
  );
}
