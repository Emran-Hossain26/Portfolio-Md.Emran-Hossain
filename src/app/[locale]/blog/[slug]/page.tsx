import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { siteUrl } from "@/data/site";
import { getBlogPost, getRelatedPosts, extractToc, blogPostHref } from "@/lib/cms";
import { renderMarkdown } from "@/lib/markdown";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ViewCounter } from "@/components/ViewCounter";
import { pick, type Locale } from "@/data/types";
import Link from "next/link";

// CMS-backed post slugs at build time (published posts only). Bangla gets
// its bn_slug variant when the admin has set one.
export async function generateStaticParams() {
  const posts = await (await import("@/lib/cms")).getBlogPosts();
  const out: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    if (locale === "bn") {
      const slugs = new Set(posts.flatMap((p) => (p.bn_slug ? [p.slug, p.bn_slug] : [p.slug])));
      for (const slug of slugs) out.push({ locale, slug });
    } else {
      for (const post of posts) out.push({ locale, slug: post.slug });
    }
  }
  return out;
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

  const post = await getBlogPost(slug, resolved);
  if (!post) notFound();

  // Locale-correct public URL; view counting always uses the canonical slug.
  const urlSlug = resolved === "bn" && post.bn_slug ? post.bn_slug : post.slug;
  const url = `/blog/${urlSlug}`;

  const body = pick(resolved, post.body);
  const title = pick(resolved, post.title);
  const toc = extractToc(body);
  const related = await getRelatedPosts(slug, 3);
  const crumbs = await getTranslations("pages.crumbs");
  const minutes = post.reading_time;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${siteUrl}${url}#article`,
    headline: title,
    description: (post.seo_desc.en || post.seo_desc.bn || post.meta.en || post.meta.bn || body.slice(0, 155)),
    datePublished: post.scheduled_at ?? undefined,
    dateModified: post.scheduled_at ?? undefined,
    inLanguage: resolved === "bn" ? "bn-BD" : "en-US",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}${url}` },
    image: post.og_image || undefined,
    author: { "@type": "Person", "@id": `${siteUrl}/#person`, name: "Md Emran Hossain" },
    publisher: { "@type": "Person", "@id": `${siteUrl}/#person`, name: "Md Emran Hossain" },
    keywords: post.tags.join(", "),
    wordCount: body.split(/\s+/).filter(Boolean).length,
  };

  const shareUrl = encodeURIComponent(`${siteUrl}${url}`);
  const shareTitle = encodeURIComponent(title);

  return (
    <main className="wrap" id="main">
      <Breadcrumbs
        items={[
          { label: crumbs("blog"), href: "/blog" },
          { label: title },
        ]}
      />
      <article>
        <PageHeading>{title}</PageHeading>
        <p className="mute" style={{ marginTop: -16, marginBottom: 18 }}>
          {pick(resolved, post.meta) || `${minutes} ${resolved === "bn" ? "মিনিট পড়া" : "min read"}`}
          {post.view_count > 0 ? (
            <span style={{ marginLeft: 12 }}>
              · {post.view_count} {resolved === "bn" ? "বার পড়া হয়েছে" : "views"}
            </span>
          ) : null}
        </p>

        {toc.length > 0 ? (
          <nav aria-label="Table of contents" className="card" style={{ marginBottom: 24, padding: 16 }}>
            <b style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
              {resolved === "bn" ? "সূচিপত্র" : "On this page"}
            </b>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
              {toc.map((h) => (
                <li key={h.id} style={{ paddingLeft: h.level === 3 ? 16 : 0 }}>
                  <a href={`#${h.id}`} style={{ fontSize: 14, color: "var(--mute)" }}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* Admin-written Markdown, sanitised server-side */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
        />

        {/* Share buttons */}
        <div style={{ marginTop: 28, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="mute" style={{ fontSize: 13, alignSelf: "center" }}>
            {resolved === "bn" ? "শেয়ার:" : "Share:"}
          </span>
          <a
            className="btn"
            href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            X / Twitter
          </a>
          <a
            className="btn"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a
            className="btn"
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
        </div>

        {/* Tags */}
        {post.tags.length ? (
          <div style={{ marginTop: 20, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {post.tags.map((tg) => (
              <Link key={tg} href={`/blog/tag/${encodeURIComponent(tg)}`}>
                <span className="tags" style={{ display: "inline-block" }}>#{tg}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </article>

      {related.length ? (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>
            {resolved === "bn" ? "সম্পর্কিত লেখা" : "Related posts"}
          </h2>
          <div className="grid" style={{ gap: 14 }}>
            {related.map((r) => (
              <Link key={r.slug} href={blogPostHref(resolved, r)} className="card" style={{ textDecoration: "none" }}>
                <h3 style={{ fontSize: 17 }}>{pick(resolved, r.title)}</h3>
                <p className="mute" style={{ fontSize: 13 }}>
                  {r.reading_time} {resolved === "bn" ? "মিনিট" : "min"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Counts against the canonical slug so both URL forms share one counter */}
      <ViewCounter slug={post.slug} />
      <JsonLd data={breadcrumbLd([
        { name: crumbs("home"), path: "/" },
        { name: crumbs("blog"), path: "/blog" },
        { name: title, path: url },
      ])} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
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
  const post = await getBlogPost(slug, resolved);
  if (!post) return {};
  const title = pick(resolved, post.seo_title) || pick(resolved, post.title);
  const desc = pick(resolved, post.seo_desc) || pick(resolved, post.body).slice(0, 155);
  const meta = pageMetadata(
    resolved,
    `/blog/${post.slug}`,
    `${title} | ${resolved === "en" ? "Md Emran Hossain" : "মোঃ ইমরান হোসেন"}`,
    desc,
    undefined,
    // hreflang pair uses each locale's own URL form (bn_slug for Bangla).
    { en: `/blog/${post.slug}`, bn: `/blog/${post.bn_slug || post.slug}` },
  );
  if (post.noindex) {
    meta.robots = { index: false, follow: false };
  }
  if (post.og_image) {
    meta.openGraph = { ...meta.openGraph, images: [post.og_image] };
    meta.twitter = { ...meta.twitter, images: [post.og_image] };
  }
  if (post.canonical) {
    meta.alternates = { ...meta.alternates, canonical: post.canonical };
  }
  return meta;
}
