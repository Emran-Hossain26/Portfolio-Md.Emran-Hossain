import type { Metadata } from "next";
import { site, siteUrl } from "@/data/site";
import type { Locale } from "@/data/types";

/**
 * Per-page, per-locale SEO metadata. Titles < 60 chars, descriptions < 160.
 * `path` is the English path ("/", "/projects", "/blog/[slug]"…);
 * the Bangla mirror gets a /bn prefix.
 */
export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Metadata {
  const enPath = path;
  const bnPath = path === "/" ? "/bn" : `/bn${path}`;
  const canonical = locale === "bn" ? bnPath : enPath;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { en: enPath, bn: bnPath, "x-default": enPath },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url: canonical,
      locale: locale === "bn" ? "bn_BD" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** BreadcrumbList JSON-LD for subpages. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path === "/" ? "/" : item.path}`,
    })),
  };
}
