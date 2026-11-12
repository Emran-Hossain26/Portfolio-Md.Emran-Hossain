"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(admin)/actions";

/**
 * Admin v2 chrome — markup mirrors portfolio-admin-advanced-mockup.html
 * (aside > .brand + nav > .nv, main > .top + .pg). All styling comes from
 * the verbatim mockup CSS in admin.css — zero Tailwind here.
 *
 * Task U5: every admin dashboard is reachable from this nav (7 groups,
 * collapsible via <details>, off-canvas drawer on mobile). Login/logout
 * pages render bare.
 */

const NAV: [string, [string, string, string][]][] = [
  ["Overview", [
    ["/admin", "Overview", "◧"],
  ]],
  ["Portfolio Management", [
    ["/admin/projects", "My Projects", "◈"],
    ["/admin/services", "What I Do", "◆"],
    ["/admin/experience", "Experience", "⏱"],
    ["/admin/education", "Education", "🎓"],
    ["/admin/skills", "Skills", "⋮⋮"],
    ["/admin/certifications", "Certifications", "◈"],
    ["/admin/stats", "Stats", "#"],
    ["/admin/faq", "FAQ", "?"],
  ]],
  ["Content", [
    ["/admin/blog", "Blog", "✎"],
    ["/admin/sections", "Sections", "☰"],
    ["/admin/hero", "Hero editor", "Aa"],
    ["/admin/branding", "Branding", "◇"],
    ["/admin/now", "Now items", "◉"],
  ]],
  ["Inbox & people", [
    ["/admin/inbox", "Inbox", "✉"],
    ["/admin/testimonials", "Reviews", "★"],
    ["/admin/booking", "Booking", "▦"],
    ["/admin/newsletter", "Newsletter", "@"],
  ]],
  ["Appearance", [
    ["/admin/themes", "Visitor themes", "◐"],
    ["/admin/theme", "Theme colours", "◑"],
    ["/admin/effects", "Effects", "✨"],
  ]],
  ["Growth", [
    ["/admin/seo", "SEO settings", "⌕"],
    ["/admin/seo-health", "SEO health", "♥"],
    ["/admin/redirects", "Redirects", "⇄"],
    ["/admin/analytics", "Analytics", "◔"],
  ]],
  ["Settings", [
    ["/admin/contact-info", "Contact info", "☎"],
    ["/admin/social", "Social links", "⌁"],
    ["/admin/cv", "CV upload", "⛁"],
    ["/admin/media", "Media library", "▣"],
    ["/admin/extras", "Extras", "✦"],
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
  const [navOpen, setNavOpen] = useState(false);

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
    <div className={"av2" + (navOpen ? " nav-open" : "")} data-t={dark ? "dark" : "light"}>
      {navOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside aria-label="Admin navigation">
        <div className="brand"><i>E</i>Portfolio Admin</div>
        <div>
          {NAV.map(([group, items]) => (
            <details key={group} className="grp-d" open>
              <summary className="grp">{group}</summary>
              {items.map(([href, label, glyph]) => (
                <Link
                  key={href}
                  href={href}
                  className={"nv" + (active(href) ? " on" : "")}
                  aria-current={active(href) ? "page" : undefined}
                  onClick={() => setNavOpen(false)}
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
            </details>
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
          <button
            type="button"
            className="btn menu-btn"
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            ☰
          </button>
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
