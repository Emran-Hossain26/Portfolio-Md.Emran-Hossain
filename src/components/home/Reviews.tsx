import { getLocale, getTranslations } from "next-intl/server";
import { getTestimonials } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

export async function Reviews() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const testimonials = await getTestimonials();

  return (
    <section id="reviews">
      <h2>{t("reviews")}</h2>
      <div className="grid">
        {testimonials.map((item, index) => (
          <div className="card" key={index}>
            <blockquote>
              {pick(locale, item.quote)}
              <footer>{item.name}</footer>
            </blockquote>
          </div>
        ))}
      </div>
    </section>
  );
}
