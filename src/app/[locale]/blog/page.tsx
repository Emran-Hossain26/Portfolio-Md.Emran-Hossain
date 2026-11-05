import { hasLocale } from "next-intl";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolvePageMetadata } from "@/lib/seo";
import { getBlogPosts, blogPostHref } from "@/lib/cms";
import { breadcrumbLd } from "@/lib/seo";
import { type Locale } from "@/data/types";
import { Suspense } from "react";

const PER_PAGE = 6;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string; category?: string; tag?: string }>;
}) {
  await connection();
  const { locale } = await params;
  const sp = await searchParams;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: resolved, namespace: "meta" });
  const base = await resolvePageMetadata(resolved, "/blog", t("title"), t("description"));

  const q = sp.q?.trim();
  const category = sp.category?.trim();
  const tag = sp.tag?.trim();
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const filtered = !!(q || category || tag);

  const all = await getBlogPosts({ category: category || undefined, tag: tag || undefined, search: q || undefined });

  if (filtered || all.length === 0) {
    base.robots = { index: false, follow: true };
  }
  if (filtered) {
    base.alternates = { ...base.alternates, canonical: "/blog" };
  } else if (page > 1) {
    base.alternates = { ...base.alternates, canonical: `/blog?page=${page}` };
  }

  return base;
}

async function BlogContent({
  resolved,
  searchParams,
}: {
  resolved: Locale;
  searchParams: Promise<{ q?: string; page?: string; category?: string; tag?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category?.trim() ?? "";
  const tag = sp.tag?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const all = await getBlogPosts({ category: category || undefined, tag: tag || undefined, search: q || undefined });
  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const posts = all.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <>
      <form method="get" action="/blog" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={resolved === "bn" ? "খুঁজুন…" : "Search posts…"}
          style={{ flex: 1, minWidth: 200 }}
        />
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <button type="submit" className="btn p">
          {resolved === "bn" ? "খুঁজুন" : "Search"}
        </button>
        {q || category || tag ? (
          <Link className="btn" href="/blog">
            {resolved === "bn" ? "পরিষ্কার" : "Clear"}
          </Link>
        ) : null}
      </form>

      {category || tag ? (
        <p className="mute" style={{ marginBottom: 16 }}>
          {resolved === "bn" ? "ফিল্টার:" : "Filter:"}{" "}
          {category ? <b>category: {category}</b> : null}{" "}
          {tag ? <b>tag: {tag}</b> : null}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <p className="mute">{resolved === "bn" ? "কোনো পোস্ট পাওয়া যায়নি।" : "No posts found."}</p>
      ) : (
        <div className="grid" style={{ gap: 16 }}>
          {posts.map((p) => (
            <article className="card" key={p.slug}>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>
                <Link href={blogPostHref(resolved, p)}>{resolved === "bn" ? p.title.bn || p.title.en : p.title.en || p.title.bn}</Link>
              </h2>
              <p className="mute" style={{ fontSize: 13, marginBottom: 8 }}>
                {p.meta.en || p.meta.bn
                  ? (resolved === "bn" ? p.meta.bn || p.meta.en : p.meta.en || p.meta.bn)
                  : `${p.reading_time} ${resolved === "bn" ? "মিনিট পড়া" : "min read"}`}
              </p>
              <p style={{ fontSize: 15, color: "var(--mute)" }}>
                {(resolved === "bn" ? p.body.bn || p.body.en : p.body.en || p.body.bn).slice(0, 160)}…
              </p>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {p.categories.map((c) => (
                  <Link key={c} href={`/blog/category/${encodeURIComponent(c)}`}>
                    <span className="tags" style={{ display: "inline-block" }}>{c}</span>
                  </Link>
                ))}
                {p.tags.map((tg) => (
                  <Link key={tg} href={`/blog/tag/${encodeURIComponent(tg)}`}>
                    <span className="tags" style={{ display: "inline-block" }}>#{tg}</span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Pagination" style={{ marginTop: 28, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (category) params.set("category", category);
            if (tag) params.set("tag", tag);
            if (n > 1) params.set("page", String(n));
            const href = params.toString() ? `/blog?${params.toString()}` : "/blog";
            return (
              <Link
                key={n}
                href={href}
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

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string; category?: string; tag?: string }>;
}) {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(resolved);

  const t = await getTranslations({ locale: resolved, namespace: "meta" });

  return (
    <main className="wrap" id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbLd([
              { name: resolved === "bn" ? "হোম" : "Home", path: "/" },
              { name: resolved === "bn" ? "ব্লগ" : "Blog", path: "/blog" },
            ]),
          ),
        }}
      />
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>{t("title")}</h1>
      <p className="mute" style={{ marginBottom: 24 }}>
        {resolved === "bn"
          ? "আইটি ইনফ্রাস্ট্রাকচার, সাইবারসিকিউরিটি ও ফুল-স্ট্যাক ডেভেলপমেন্ট নিয়ে লেখা।"
          : "Notes on IT infrastructure, cybersecurity and full-stack development."}
      </p>

      <Suspense fallback={<p className="mute">Loading…</p>}>
        <BlogContent resolved={resolved} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}