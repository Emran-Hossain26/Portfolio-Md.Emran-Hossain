import { getLocale, getTranslations } from "next-intl/server";
import { getFooterText, getNewsletterSettings, getModuleSettings } from "@/lib/cms";
import { NewsletterForm } from "./NewsletterForm";
import { CountryBadge } from "./CountryBadge";
import type { Locale } from "@/data/types";

// cacheComponents forbids current-time values in prerender; caching the
// build-time year keeps the prerender deterministic and still fresh per deploy.
async function copyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const year = await copyrightYear();

  // Admin-editable copyright line (site_settings: footer_text); {year} is
  // replaced so admins can keep the current year automatically.
  const custom = await getFooterText();
  const raw = custom ? (locale === "bn" ? custom.bn || custom.en : custom.en || custom.bn) : null;
  const line = raw ? raw.replaceAll("{year}", String(year)) : t("footer", { year });

  const [newsletter, modules] = await Promise.all([
    getNewsletterSettings(),
    getModuleSettings(),
  ]);

  return (
    <footer className="site">
      <div className="wrap" style={{ display: "grid", gap: 14 }}>
        {newsletter.enabled ? <NewsletterForm /> : null}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span data-ac="text">{line}</span>
          {modules.countryBadge ? <CountryBadge /> : null}
        </div>
      </div>
    </footer>
  );
}
