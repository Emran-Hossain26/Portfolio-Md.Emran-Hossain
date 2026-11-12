import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { getProjects } from "@/lib/cms";

/**
 * Dynamic sitemap: every public route in both locales plus each project,
 * with hreflang alternates. Task U6: the blog lives off-site (Hashnode) —
 * no /blog routes are listed (posts are not served from this site).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();
  const base = siteUrl.replace(/\/$/, "");
  const now = new Date();

  const staticPaths = [
    { path: "/", priority: 1, freq: "weekly" as const },
    { path: "/projects", priority: 0.9, freq: "monthly" as const },
    { path: "/services", priority: 0.8, freq: "monthly" as const },
    { path: "/about", priority: 0.7, freq: "monthly" as const },
    { path: "/testimonials", priority: 0.6, freq: "monthly" as const },
    { path: "/contact", priority: 0.7, freq: "monthly" as const },
  ];

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path === "/" ? "/" : path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        en: `${base}${path === "/" ? "/" : path}`,
        bn: `${base}${path === "/" ? "/bn" : `/bn${path}`}`,
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
  return out;
}
