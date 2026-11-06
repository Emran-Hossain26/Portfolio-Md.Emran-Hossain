"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(admin)/actions";

/**
 * Admin v2 chrome — markup mirrors portfolio-admin-advanced-mockup.html
 * exactly (aside > .brand + nav > .nv, main > .top + .pg). All styling
 * comes from the verbatim mockup CSS in admin.css — zero Tailwind here.
 * Login/logout pages render bare.
 */

const NAV: [string, [string, string, string][]][] = [
  ["Overview", [
    ["/admin", "Overview", "◧"],
    ["/admin/analytics", "Analytics", "◔"],
  ]],
  ["Inbox & people", [
    ["/admin/inbox", "Inbox", "✉"],
    ["/admin/testimonials", "Reviews", "★"],
    ["/admin/newsletter", "Newsletter", "@"],
  ]],
  ["Content", [
    ["/admin/sections", "Sections", "☰"],
    ["/admin/blog", "Blog & projects", "✎"],
    ["/admin/hero", "Hero editor", "Aa"],
    ["/admin/branding", "Branding", "◆"],
  ]],
  ["Appearance", [
    ["/admin/themes", "Visitor themes", "◐"],
    ["/admin/effects", "Effects", "✨"],
  ]],
  ["Growth & system", [
    ["/admin/seo-health", "SEO health", "⌕"],
    ["/admin/system", "System", "⚙"],
    ["/admin/audit", "Audit log", "≣"],
    ["/admin/profile", "Profile & security", "●"],
  ]],
];

export function AdminV2Chrome({
  children,
  inboxCount = 0,
  pendingTestimonials = 0,
  adminName = "Administrator",
  adminAvatar = "",
}: {
  children: React.ReactNode;
  inboxCount?: number;
  pendingTestimonials?: number;
  adminName?: string;
  adminAvatar?: string;
}) {
  const pathname = usePathname();
  const bare =
    pathname?.startsWith("/login") || pathname?.startsWith("/admin/logout");
  const [dark, setDark] = useState(false);

  if (bare) return <>{children}</>;

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  let title = "Overview";
  for (const [, items] of NAV) {
    for (const [href, label] of items) {
      if (active(href)) title = label;
    }
  }
  const initial = (adminName || "A").trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="av2" data-t={dark ? "dark" : "light"}>
      <aside aria-label="Admin navigation">
        <div className="brand"><i>E</i>Portfolio Admin</div>
        <div>
          {NAV.map(([group, items]) => (
            <div key={group}>
              <p className="grp">{group}</p>
              {items.map(([href, label, glyph]) => (
                <Link
                  key={href}
                  href={href}
                  className={"nv" + (active(href) ? " on" : "")}
                  aria-current={active(href) ? "page" : undefined}
                >
                  <span aria-hidden="true">{glyph}</span>
                  {label}
                  {href === "/admin/inbox" && inboxCount > 0 ? (
                    <b>{inboxCount}</b>
                  ) : null}
                  {href === "/admin/testimonials" && pendingTestimonials > 0 ? (
                    <b>{pendingTestimonials}</b>
                  ) : null}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="side-f">
          <form action={logoutAction}>
            <button type="submit" className="nv" style={{ color: "var(--bad)" }}>
              <span aria-hidden="true">⇥</span> Log out
            </button>
          </form>
          Signed in as {adminName}
        </div>
      </aside>

      <main>
        <div className="top">
          <h1>{title}</h1>
          <button
            className="btn"
            aria-label="Toggle admin theme"
            onClick={() => setDark((v) => !v)}
          >
            ◐
          </button>
          <Link className="btn p" href="/" target="_blank">View site ↗</Link>
          {adminAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="av" src={adminAvatar} alt={adminName} title={adminName} />
          ) : (
            <div className="av" title={adminName}>{initial}</div>
          )}
        </div>
        <div className="pg" tabIndex={-1}>
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
