import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { getPost, samplePosts } from "@/data/posts";
import { pick, type Locale } from "@/data/types";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    samplePosts.map((post) => ({ locale, slug: post.slug })),
  );
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  setRequestLocale(resolved);

  const post = getPost(slug);
  if (!post) notFound();

  const t = await getTranslations("pages.blog");
  const crumbs = await getTranslations("pages.crumbs");

  return (
    <main className="wrap" id="main">
      <Breadcrumbs
        items={[
          { label: crumbs("blog"), href: "/blog" },
          { label: pick(resolved, post.title) },
        ]}
      />
      <article>
        <PageHeading>{pick(resolved, post.title)}</PageHeading>
        <p className="mute" style={{ marginTop: -16, marginBottom: 18 }}>
          {pick(resolved, post.meta)}
        </p>
        <p>{pick(resolved, post.body)}</p>
        <p className="mute" style={{ marginTop: 18 }}>
          {t("note")}
        </p>
      </article>
      <JsonLd
        data={breadcrumbLd([
          { name: crumbs("home"), path: "/" },
          { name: crumbs("blog"), path: "/blog" },
          { name: pick(resolved, post.title), path: `/blog/${post.slug}` },
        ])}
      />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  const post = getPost(slug);
  if (!post) return {};
  return pageMetadata(
    resolved,
    `/blog/${post.slug}`,
    `${pick(resolved, post.title)} | ${resolved === "en" ? "Md Emran Hossain" : "মোঃ ইমরান হোসেন"}`,
    pick(resolved, post.body),
  );
}
