import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { samplePosts } from "@/data/posts";
import { pick, type Locale } from "@/data/types";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  setRequestLocale(resolved);

  const t = await getTranslations("pages.blog");

  return (
    <main className="wrap" id="main">
      <section style={{ paddingTop: 32 }}>
        <h1 style={{ fontSize: 30, marginBottom: 26 }}>{t("heading")}</h1>
        <p>{t("intro")}</p>
        <div className="grid" style={{ marginTop: 26 }}>
          {samplePosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="card"
              style={{ textDecoration: "none" }}
            >
              <h3>{pick(resolved, post.title)}</h3>
              <p className="mute">{pick(resolved, post.meta)}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: resolved, namespace: "meta.pages.blog" });
  return pageMetadata(resolved, "/blog", t("title"), t("description"));
}
