import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getBlogPosts } from "@/lib/cms";
import { site, siteUrl } from "@/data/site";

/**
 * Per-locale RSS 2.0 feed (/en/feed.xml, /bn/feed.xml).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const bn = resolved === "bn";
  const posts = await getBlogPosts();

  const base = siteUrl.replace(/\/$/, "");
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const items = posts
    .map((post) => {
      const title = bn ? post.title.bn || post.title.en : post.title.en || post.title.bn;
      const body = bn ? post.body.bn || post.body.en : post.body.en || post.body.bn;
      const meta = bn ? post.meta.bn || post.meta.en : post.meta.en || post.meta.bn;
      const cats = [...post.categories, ...post.tags]
        .map((c) => `      <category>${esc(c)}</category>`)
        .join("\n");
      return `    <item>
      <title>${esc(title)}</title>
      <link>${base}/${resolved === "bn" ? "bn/" : ""}blog/${post.slug}</link>
      <guid isPermaLink="true">${base}/${resolved === "bn" ? "bn/" : ""}blog/${post.slug}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>${esc(meta || body.slice(0, 280))}</description>
${cats}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} — ${bn ? "ব্লগ" : "Blog"}</title>
    <link>${base}/${resolved === "bn" ? "bn/" : ""}blog</link>
    <description>${bn ? "আইটি ইনফ্রাস্ট্রাকচার, সাইবারসিকিউরিটি ও ফুল-স্ট্যাক ডেভেলপমেন্ট নিয়ে লেখা।" : "Notes on IT infrastructure, cybersecurity and full-stack development."}</description>
    <language>${bn ? "bn-BD" : "en-US"}</language>
    <atom:link href="${base}/${resolved === "bn" ? "bn/" : ""}feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}