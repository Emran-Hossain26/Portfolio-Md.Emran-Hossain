import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { getProjects, getBlogPosts } from "@/lib/cms";

/**
 * Dynamic sitemap: every public route in both locales, plus each project and
 * blog post, with hreflang alternates. Excludes drafts, scheduled-future,
 * noindex posts, thin archives, /login, /admin, /api.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getBlogPosts()]);
  const base = siteUrl.replace(/\/$/, "");
  const now = new Date();

  const staticPaths = [
    { path: "/", priority: 1, freq: "weekly" as const },
    { path: "/projects", priority: 0.9, freq: "monthly" as const },
    { path: "/blog", priority: 0.8, freq: "weekly" as const },
    { path: "/about", priority: 0.7, freq: "monthly" as const },
    { path: "/testimonials", priority: 0.6, freq: "monthly" as const },
    { path: "/contact", priority: 0.7, freq: "monthly" as const },
  ];

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    /** Bangla URL when it is not just the /bn-prefixed path (bn_slug posts). */
    bnPath?: string,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path === "/" ? "/" : path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        en: `${base}${path === "/" ? "/" : path}`,
        bn: `${base}${bnPath ?? (path === "/" ? "/bn" : `/bn${path}`)}`,
        "x-default": `${base}${path === "/" ? "/" : path}`,
      },
    },
  });

  const out: MetadataRoute.Sitemap = staticPaths.map((p) =>
    entry(p.path, p.priority, p.freq),
  );
  for (const project of projects) {
    out.push(entry(`/projects/${project.slug}`, 0.8, "monthly"));
  }
  // Only published, currently-visible, non-noindex posts.
  for (const post of posts) {
    if (post.noindex) continue;
    out.push(entry(`/blog/${post.slug}`, 0.6, "monthly", `/blog/${post.bn_slug || post.slug}`));
  }
  // Category and tag archives with 2+ posts (per locale).
  const catCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    if (post.noindex) continue;
    for (const c of post.categories) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
    for (const t of post.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  for (const [cat, n] of catCounts) {
    if (n < 2) continue;
    out.push(entry(`/blog/category/${encodeURIComponent(cat)}`, 0.5, "monthly"));
  }
  for (const [tag, n] of tagCounts) {
    if (n < 2) continue;
    out.push(entry(`/blog/tag/${encodeURIComponent(tag)}`, 0.5, "monthly"));
  }
  return out;
}