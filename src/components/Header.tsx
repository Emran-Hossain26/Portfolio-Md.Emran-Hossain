import { getTranslations } from "next-intl/server";
import { LanguageButton } from "./LanguageButton";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  "expertise",
  "projects",
  "reviews",
  "blog",
  "contact",
] as const;

export async function Header() {
  const t = await getTranslations("nav");
  return (
    <header>
      <div className="wrap">
        <nav aria-label="Main">
          <b>{t("brand")}</b>
          {NAV_ITEMS.map((key) => (
            <a key={key} href={`#${key}`}>
              {t(key)}
            </a>
          ))}
          <LanguageButton />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
