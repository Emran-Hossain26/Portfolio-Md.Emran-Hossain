import { getTranslations } from "next-intl/server";

// cacheComponents forbids current-time values in prerender; caching the
// build-time year keeps the prerender deterministic and still fresh per deploy.
async function copyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export async function Footer() {
  const t = await getTranslations("sections");
  const year = await copyrightYear();
  return (
    <footer className="site">
      <div className="wrap">{t("footer", { year })}</div>
    </footer>
  );
}
