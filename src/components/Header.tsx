import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageButton } from "./LanguageButton";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { key: "expertise", href: "/#expertise" },
  { key: "projects", href: "/projects" },
  { key: "reviews", href: "/testimonials" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
] as const;

export async function Header() {
  const t = await getTranslations("nav");
  return (
    <header>
      <div className="wrap">
        <nav aria-label="Main">
          <b>
            <Link href="/">{t("brand")}</Link>
          </b>
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} href={item.href}>
              {t(item.key)}
            </Link>
          ))}
          <LanguageButton />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
