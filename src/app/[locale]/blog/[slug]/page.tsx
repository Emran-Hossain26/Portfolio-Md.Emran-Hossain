import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Root locale param only (Stage 6: nonce CSP makes the layout dynamic;
// slugs render on demand).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { siteUrl } from "@/data/site";
import { getBlogPost, getRelatedPosts, extractToc, blogPostHref } from "@/lib/cms";
import { renderMarkdown } from "@/lib/markdown";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { BlogEngagement } from "@/components/BlogEngagement";
import { ViewCounter } from "@/components/ViewCounter";
import { pick, type Locale } from "@/data/types";
import Link from "next/link";

// Stage 6 item 5: nonce-CSP layout is dynamic — this page renders per request.
export const instant = false;

// CMS-backed post slugs at build time (published posts only). Bangla gets
// its bn_slug variant when the admin has set one.

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
  // Stage 6 item 5: nonce-CSP layout is dynamic — pages render on demand.
  await connection();

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
        {/* Admin-uploaded cover (posts.cover_url); the post is text-only when unset. */}
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={title}
            width={1200}
            height={630}
            priority
            sizes="(min-width: 760px) 720px, calc(100vw - 40px)"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "var(--radius, 12px)",
              border: "1px solid var(--line)",
              marginBottom: 18,
            }}
          />
        ) : null}
        <p className="mute" style={{ marginTop: post.cover_url ? 0 : -16, marginBottom: 18 }}>
          {pick(resolved, post.meta) || `${minutes} ${resolved === "bn" ? "মিনিট পড়া" : "min read"}`}
          {post.view_count > 0 ? (
            <span style={{ marginLeft: 12 }}>
              · {post.view_count} {resolved === "bn" ? "বার পড়া হয়েছে" : "views"}
            </span>
          ) : null}
        </p>

        {toc.length > 0 ? (
          <nav aria-label="Table of contents" className="card" style={{ marginBottom: 24, padding: 16, display: "block", height: "auto" }}>
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

      <BlogEngagement slug={post.slug} locale={resolved} />

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
    { en: `/blog/${post.slug}`, bn: `/bn/blog/${post.bn_slug || post.slug}` },
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
