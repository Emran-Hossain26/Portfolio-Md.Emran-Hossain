import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

/**
 * Small breadcrumb row on subpages, styled with existing tokens (.mute).
 * `items`: the trail AFTER Home; the last item is the current page (not linked).
 */
export async function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  const t = await getTranslations("pages.crumbs");
  return (
    <nav
      aria-label="Breadcrumb"
      className="mute"
      style={{ display: "block", height: "auto", paddingTop: 32, paddingBottom: 14, fontSize: 14, lineHeight: 1.5 }}
    >
      <Link href="/">{t("home")}</Link>
      {items.map((item) => (
        <span key={item.label}>
          {" / "}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <b aria-current="page">{item.label}</b>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Standard page heading matching the mockup's section-h2 look, as h1. */
export function PageHeading({ children }: { children: ReactNode }) {
  return <h1 style={{ fontSize: 30, marginBottom: 26 }}>{children}</h1>;
}
