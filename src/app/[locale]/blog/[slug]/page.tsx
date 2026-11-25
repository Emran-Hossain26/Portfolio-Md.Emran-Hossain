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
import { getBlogPost, getBlogPosts, getRelatedPosts, extractToc, blogPostHref } from "@/lib/cms";
import { renderMarkdown } from "@/lib/markdown";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PostToc } from "@/components/PostToc";
import { ReadingProgress } from "@/components/ReadingProgress";
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

  const bn = resolved === "bn";
  const tocLabel = bn ? "সূচিপত্র" : "On this page";

  // Newest-first list → neighbours for the previous / next links.
  const all = await getBlogPosts();
  const idx = all.findIndex((p) => p.slug === post.slug);
  const newer = idx > 0 ? all[idx - 1] : undefined;
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : undefined;

  const shareLinks = (
    <div className="post-share">
      <span className="mute" style={{ fontSize: 13 }}>{bn ? "শেয়ার:" : "Share:"}</span>
      <a className="btn" href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`} target="_blank" rel="noopener noreferrer">X / Twitter</a>
      <a className="btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a className="btn" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer">Facebook</a>
    </div>
  );

  const tagList = post.tags.length ? (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {post.tags.map((tg) => (
        <Link key={tg} href={`/blog/tag/${encodeURIComponent(tg)}`}>
          <span className="tags" style={{ display: "inline-block" }}>#{tg}</span>
        </Link>
      ))}
    </div>
  ) : null;

  return (
    <main className="wrap" id="main">
      <ReadingProgress targetId="post-article" />
      <Breadcrumbs
        items={[
          { label: crumbs("blog"), href: "/blog" },
          { label: title },
        ]}
      />
      <div className="post-grid">
        {/* Left: contents + related (stacks under the article on phones) */}
        <aside className="post-aside" aria-label={bn ? "পাশের তালিকা" : "Sidebar"}>
          {toc.length > 0 ? (
            <div className="post-toc-desktop">
              <PostToc items={toc} label={tocLabel} />
            </div>
          ) : null}
          {related.length ? (
            <section className="post-related">
              <b className="post-side-title">{bn ? "সম্পর্কিত লেখা" : "Related posts"}</b>
              <div className="post-related-list">
                {related.map((r) => (
                  <Link key={r.slug} href={blogPostHref(resolved, r)} className="post-related-item">
                    <b>{pick(resolved, r.title)}</b>
                    <span>{r.reading_time} {bn ? "মিনিট" : "min read"}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>

        <div className="post-main">
          <article id="post-article">
            <h1 className="post-title">{title}</h1>
            <p className="mute post-meta">
              {pick(resolved, post.meta) || `${minutes} ${bn ? "মিনিট পড়া" : "min read"}`}
              {post.view_count > 0 ? (
                <span style={{ marginLeft: 12 }}>
                  · {post.view_count} {bn ? "বার পড়া হয়েছে" : "views"}
                </span>
              ) : null}
            </p>
            {/* Admin-uploaded cover (posts.cover_url): cropped 16:9, never stretched. */}
            {post.cover_url ? (
              <Image
                className="post-cover"
                src={post.cover_url}
                alt={title}
                width={1280}
                height={720}
                quality={90}
                priority
                sizes="(min-width: 1180px) 780px, (min-width: 760px) 60vw, 100vw"
              />
            ) : null}

            {toc.length > 0 ? (
              <details className="post-toc-mobile">
                <summary>{tocLabel}</summary>
                <ul>
                  {toc.map((h) => (
                    <li key={h.id} style={{ paddingLeft: h.level === 3 ? 14 : 0 }}>
                      <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {/* Admin-written Markdown, sanitised server-side */}
            <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />

            <div className="post-inline-share" style={{ marginTop: 28 }}>{shareLinks}</div>
            {tagList ? <div style={{ marginTop: 18 }}>{tagList}</div> : null}
          </article>

          <div className="post-author">
            <span className="post-author-avatar" aria-hidden="true">E</span>
            <div>
              <b>Md Emran Hossain</b>
              <p className="mute">
                {bn
                  ? "আইটি ইনফ্রাস্ট্রাকচার, অপারেশনস ও ডিজিটাল সলিউশনস প্রফেশনাল। "
                  : "IT infrastructure, operations and digital solutions professional. "}
                <Link href="/about">{bn ? "আমার সম্পর্কে" : "About me"}</Link>
              </p>
            </div>
          </div>

          {newer || older ? (
            <div className="post-pager">
              {older ? (
                <Link href={blogPostHref(resolved, older)} className="prev">
                  <small>← {bn ? "আগের লেখা" : "Previous post"}</small>
                  <b>{pick(resolved, older.title)}</b>
                </Link>
              ) : <span />}
              {newer ? (
                <Link href={blogPostHref(resolved, newer)} className="next">
                  <small>{bn ? "পরের লেখা" : "Next post"} →</small>
                  <b>{pick(resolved, newer.title)}</b>
                </Link>
              ) : null}
            </div>
          ) : null}

          <BlogEngagement slug={post.slug} locale={resolved} />
        </div>

        {/* Right rail (wide screens): share + tags stay in view */}
        <div className="post-rail">
          {shareLinks}
          {tagList ? <div style={{ marginTop: 18 }}>{tagList}</div> : null}
        </div>
      </div>

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
