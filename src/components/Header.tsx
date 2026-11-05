import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageButton } from "./LanguageButton";
import { MobileNav } from "./MobileNav";
import { ThemePicker } from "./ThemePicker";
import { getThemePresets, getThemeVisitorSwitch } from "@/lib/cms";

const NAV_ITEMS = [
  { key: "expertise", href: "/#expertise" },
  { key: "projects", href: "/projects" },
  { key: "reviews", href: "/testimonials" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
] as const;

export async function Header() {
  const t = await getTranslations("nav");
  const links = NAV_ITEMS.map((item) => ({
    href: item.href,
    label: t(item.key),
  }));

  const presets = await getThemePresets();
  const visitorSwitch = await getThemeVisitorSwitch();
  const defaultPreset = presets.find((p) => p.isDefault)?.key ?? (presets.filter((p) => p.enabled)[0]?.key ?? "light");

  return (
    <header>
      <div className="wrap">
        <nav aria-label="Main" style={{ position: "relative" }}>
          <b>
            <Link href="/">{t("brand")}</Link>
          </b>
          <span className="nav-links">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
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
