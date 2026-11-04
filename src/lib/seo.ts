import type { Metadata } from "next";
import { site, siteUrl } from "@/data/site";
import type { Locale } from "@/data/types";
import { getPageSeo } from "@/lib/cms";

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

/** Chooses the string for `locale`, falling back to the other language. */
function localized(locale: Locale, value: { en: string; bn: string }) {
  return locale === "bn" ? value.bn || value.en : value.en || value.bn;
}

/**
 * pageMetadata with optional admin overrides (page_seo table) taking
 * precedence; the i18n messages serve as the fallback for either language.
 */
export async function resolvePageMetadata(
  locale: Locale,
  path: string,
  fallbackTitle: string,
  fallbackDescription: string,
): Promise<Metadata> {
  const overrides = await getPageSeo(path);
  if (!overrides) {
    return pageMetadata(locale, path, fallbackTitle, fallbackDescription);
  }
  return pageMetadata(
    locale,
    path,
    localized(locale, overrides.title) || fallbackTitle,
    localized(locale, overrides.description) || fallbackDescription,
  );
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
