import { getTranslations } from "next-intl/server";

/**
 * Public "back soon" page rendered site-wide while maintenance mode is on
 * (MISSING-TASKS A6). The admin panel and login live on separate routes, so
 * they are unaffected. Uses the site's CSS-variable tokens; noindex keeps
 * the placeholder out of search results.
 */
export async function BackSoon() {
  const t = await getTranslations("maintenance");
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <meta name="robots" content="noindex, nofollow" />
      <div>
        <p aria-hidden="true" style={{ fontSize: 44, margin: 0 }}>
          🛠️
        </p>
        <h1 style={{ fontSize: 30, margin: "10px 0 8px" }}>{t("heading")}</h1>
        <p className="mute" style={{ margin: 0, maxWidth: 460 }}>
          {t("sub")}
        </p>
      </div>
    </div>
  );
}
