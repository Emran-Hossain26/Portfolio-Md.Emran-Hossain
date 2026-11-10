import { getLocale, getTranslations } from "next-intl/server";
import { getPosts } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

export async function BlogPreview() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  // The mockup\'s home shows two post cards.
  const posts = (await getPosts()).slice(0, 2);

  return (
    <section id="blog" data-sec="blog">
      <h2 data-ac="text">{t("blog")}</h2>
      <div className="grid">
        {posts.map((post) => (
          <article className="card" data-ac="box" key={post.slug}>
            <h3>{pick(locale, post.title)}</h3>
            <p className="mute">{pick(locale, post.meta)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
