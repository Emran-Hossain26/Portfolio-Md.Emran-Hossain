import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { getPost, getPosts } from "@/lib/cms";
import { renderMarkdown } from "@/lib/markdown";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { pick, type Locale } from "@/data/types";

// CMS-backed post slugs at build time (published posts only).
export async function generateStaticParams() {
  const posts = await getPosts();
  return routing.locales.flatMap((locale) =>
    posts.map((post) => ({ locale, slug: post.slug })),
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

  const post = await getPost(slug);
  if (!post) notFound();

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
        {/* Admin-written Markdown, sanitised server-side */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(pick(resolved, post.body)) }}
        />
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
  const post = await getPost(slug);
  if (!post) return {};
  return pageMetadata(
    resolved,
    `/blog/${post.slug}`,
    `${pick(resolved, post.title)} | ${resolved === "en" ? "Md Emran Hossain" : "মোঃ ইমরান হোসেন"}`,
    pick(resolved, post.body).slice(0, 155),
  );
}
