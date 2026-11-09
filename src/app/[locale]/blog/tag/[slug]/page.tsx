import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Root locale param only (Stage 6: nonce CSP makes the layout dynamic;
// slugs render on demand).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
import { resolvePageMetadata } from "@/lib/seo";
import { getBlogPosts, getPageSeo } from "@/lib/cms";
import { breadcrumbLd } from "@/lib/seo";
import { type Locale } from "@/data/types";
import Link from "next/link";
import { Suspense } from "react";

// Stage 6 item 5: nonce-CSP layout is dynamic — this page renders per request.
export const instant = false;

const PER_PAGE = 6;


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  const posts = await getBlogPosts({ tag: slug });
  const override = await getPageSeo(`/blog/tag/${slug}`);
  const title = override
    ? (resolved === "bn" ? override.title.bn || override.title.en : override.title.en || override.title.bn)
    : `#${slug}`;
  const desc = override
    ? (resolved === "bn" ? override.description.bn || override.description.en : override.description.en || override.description.bn)
    : (resolved === "bn" ? `#${slug} ট্যাগের সব লেখা।` : `All posts tagged #${slug}.`);
  const meta = await resolvePageMetadata(resolved, `/blog/tag/${slug}`, title, desc);
  if (posts.length < 2) {
    meta.robots = { index: false, follow: true };
  }
  return meta;
}

async function ArchiveInner({
  resolved,
  slug,
  searchParams,
}: {
  resolved: Locale;
  slug: string;
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const posts = await getBlogPosts({ tag: slug });
  if (posts.length === 0) notFound();

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = posts.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const override = await getPageSeo(`/blog/tag/${slug}`);
  const heading = override
    ? (resolved === "bn" ? override.title.bn || override.title.en || `#${slug}` : override.title.en || override.title.bn || `#${slug}`)
    : `#${slug}`;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    numberOfItems: posts.length,
    itemListElement: posts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://emran-portfolio.vercel.app/blog/${p.slug}`,
      name: resolved === "bn" ? p.title.bn || p.title.en : p.title.en || p.title.bn,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd([
          { name: resolved === "bn" ? "হোম" : "Home", path: "/" },
          { name: resolved === "bn" ? "ব্লগ" : "Blog", path: "/blog" },
          { name: heading, path: `/blog/tag/${slug}` },
        ])) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>{heading}</h1>
      {override ? (
        <p className="mute" style={{ marginBottom: 24 }}>
          {resolved === "bn" ? override.description.bn || override.description.en : override.description.en || override.description.bn}
        </p>
      ) : (
        <p className="mute" style={{ marginBottom: 24 }}>
          {posts.length} {resolved === "bn" ? "টি পোস্ট" : "posts"}
        </p>
      )}

      <div className="grid" style={{ gap: 16 }}>
        {visible.map((p) => (
          <article className="card" key={p.slug}>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>
              <Link href={`/blog/${p.slug}`}>{resolved === "bn" ? p.title.bn || p.title.en : p.title.en || p.title.bn}</Link>
            </h2>
            <p className="mute" style={{ fontSize: 13, marginBottom: 8 }}>
              {p.reading_time} {resolved === "bn" ? "মিনিট পড়া" : "min read"}
            </p>
            <p style={{ fontSize: 15, color: "var(--mute)" }}>
              {(resolved === "bn" ? p.body.bn || p.body.en : p.body.en || p.body.bn).slice(0, 160)}…
            </p>
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" style={{ marginTop: 28, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            return (
              <Link
                key={n}
                href={n === 1 ? `/blog/tag/${slug}` : `/blog/tag/${slug}?page=${n}`}
                className={"btn" + (n === safePage ? " p" : "")}
                aria-current={n === safePage ? "page" : undefined}
              >
                {n}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}

export default async function TagArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(resolved);
  // Stage 6 item 5: nonce-CSP layout is dynamic — pages render on demand.
  await connection();

  return (
    <main className="wrap" id="main">
      <Suspense fallback={<p className="mute">Loading…</p>}>
        <ArchiveInner resolved={resolved} slug={slug} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}