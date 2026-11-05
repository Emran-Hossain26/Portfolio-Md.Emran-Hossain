import type { Metadata } from "next";
import { site, siteUrl } from "@/data/site";
import type { Locale } from "@/data/types";
import { getPageSeo, getSeoSettings } from "@/lib/cms";

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
  settings?: { title_template?: string; default_description_en?: string; default_description_bn?: string },
  /** Per-locale paths when a page's URL differs per locale (e.g. bn_slug posts). */
  languagePaths?: { en: string; bn: string },
): Metadata {
  const enPath = languagePaths?.en ?? path;
  const bnPath = languagePaths?.bn ?? (path === "/" ? "/bn" : `/bn${path}`);
  const canonical = locale === "bn" ? bnPath : enPath;

  // Apply title template (e.g. "%s | Md Emran Hossain").
  const template = settings?.title_template?.trim();
  const templatedTitle = template && template.includes("%s")
    ? template.replace("%s", title)
    : title;

  // Default description fallback when none provided.
  const defaultDesc =
    locale === "bn"
      ? (settings?.default_description_bn?.trim() || settings?.default_description_en?.trim())
      : (settings?.default_description_en?.trim() || settings?.default_description_bn?.trim());
  const finalDesc = description.trim() || defaultDesc || description;

  return {
    title: templatedTitle,
    description: finalDesc,
    alternates: {
      canonical,
      languages: { en: enPath, bn: bnPath, "x-default": enPath },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: templatedTitle,
      description: finalDesc,
      url: canonical,
      locale: locale === "bn" ? "bn_BD" : "en_US",
    },
    twitter: { card: "summary_large_image", title: templatedTitle, description: finalDesc },
  };
}

/** Chooses the string for `locale`, falling back to the other language. */
function localized(locale: Locale, value: { en: string; bn: string }) {
  return locale === "bn" ? value.bn || value.en : value.en || value.bn;
}

/**
 * pageMetadata with optional admin overrides (page_seo table) taking
 * precedence; the i18n messages serve as the fallback for either language.
 * Also applies the global SEO settings (title template, default description).
 */
export async function resolvePageMetadata(
  locale: Locale,
  path: string,
  fallbackTitle: string,
  fallbackDescription: string,
): Promise<Metadata> {
  const overrides = await getPageSeo(path);
  const settings = await getSeoSettings();
  if (!overrides) {
    return pageMetadata(locale, path, fallbackTitle, fallbackDescription, settings);
  }
  return pageMetadata(
    locale,
    path,
    localized(locale, overrides.title) || fallbackTitle,
    localized(locale, overrides.description) || fallbackDescription,
    settings,
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
