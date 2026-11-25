import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageButton } from "./LanguageButton";
import { MobileNav } from "./MobileNav";
import { ThemePicker } from "./ThemePicker";
import { getThemePresets, getThemeVisitorSwitch, getBranding } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";

/**
 * Task U6: the first four entries anchor-scroll to home sections
 * (Expertise / Projects / Experience / FAQ "Common questions"); Blog points
 * off-site (Hashnode — the site carries no posts); Reviews and Contact keep
 * their pages.
 */
const NAV_ITEMS = [
  { key: "expertise", href: "/#expertise" },
  { key: "projects", href: "/#projects" },
  { key: "experience", href: "/#experience" },
  { key: "reviews", href: "/testimonials" },
  { key: "faq", href: "/#faq" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
] as const;

export async function Header() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("nav");
  const links = NAV_ITEMS.map((item) => ({
    href: item.href,
    label: t(item.key),
    external: false as boolean,
  }));

  const presets = await getThemePresets();
  const visitorSwitch = await getThemeVisitorSwitch();
  const defaultPreset = presets.find((p) => p.isDefault)?.key ?? (presets.filter((p) => p.enabled)[0]?.key ?? "light");

  // Admin-editable brand text + optional badge (site_settings: branding);
  // messages are the seed fallback.
  const branding = await getBranding();
  const brand =
    branding && (branding.brand_en || branding.brand_bn)
      ? pick(locale, { en: branding.brand_en, bn: branding.brand_bn }) || t("brand")
      : t("brand");

  return (
    <header>
      <div className="wrap">
        <nav aria-label="Main" style={{ position: "relative" }}>
          <b data-ac="text">
            {branding?.badge_url ? (
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={branding.badge_url}
                  alt=""
                  style={{ width: 22, height: 22, borderRadius: 6, objectFit: "cover" }}
                />
                {brand}
              </Link>
            ) : (
              <Link href="/">{brand}</Link>
            )}
          </b>
          <span className="nav-links">
            {links.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ac="text"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} data-ac="text">
                  {link.label}
                </Link>
              )
            )}
          </span>
          <LanguageButton />
          <ThemePicker
            presets={presets.filter((p) => p.enabled).map((p) => ({ key: p.key, label: p.name }))}
            defaultPreset={defaultPreset}
            visitorSwitch={visitorSwitch}
          />
          <MobileNav links={links} />
        </nav>
      </div>
    </header>
  );
}
