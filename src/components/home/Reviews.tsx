import { getLocale, getTranslations } from "next-intl/server";
import { getTestimonials } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

export async function Reviews() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const testimonials = await getTestimonials();

  return (
    <section id="reviews" data-sec="reviews">
      <h2 data-ac="text">{t("reviews")}</h2>
      <div className="grid">
        {testimonials.map((item, index) => (
          <div className="card" data-ac="box" key={index}>
            <blockquote>
              <p style={{ margin: 0 }} data-ac="text">{pick(locale, item.quote)}</p>
              <footer data-ac="text">{item.name}</footer>
            </blockquote>
          </div>
        ))}
      </div>
    </section>
  );
}
