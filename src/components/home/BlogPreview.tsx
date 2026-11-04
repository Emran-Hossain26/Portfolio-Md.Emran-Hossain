import { getLocale, getTranslations } from "next-intl/server";
import { samplePosts } from "@/data/posts";
import { pick, type Locale } from "@/data/types";

export async function BlogPreview() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");

  return (
    <section id="blog">
      <h2>{t("blog")}</h2>
      <div className="grid">
        {samplePosts.map((post) => (
          <article className="card" key={post.title.en}>
            <h3>{pick(locale, post.title)}</h3>
            <p className="mute">{pick(locale, post.meta)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
