"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(admin)/actions";
import { cn } from "@/lib/utils";
import {
  IconZap, IconHome, IconEye, IconStar, IconHeading, IconPalette,
  IconBriefcase, IconFeather, IconPulse, IconLogout, IconSearch, IconShuffle,
} from "@/components/admin/icons";

/**
 * Admin v2 chrome (advanced mockup): grouped sidebar, topbar with page
 * title + admin dark/light toggle + "View site", avatar. Login/logout
 * pages render bare. Icons are the shared Lucide-style SVG set.
 */

export const V2_NAV = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Overview", icon: IconHome, key: "/admin" }],
  },
  {
    title: "Inbox & people",
    items: [
      { href: "/admin/inbox", label: "Inbox", icon: IconEye, key: "/admin/inbox", badge: true },
      { href: "/admin/testimonials", label: "Reviews", icon: IconStar, key: "/admin/testimonials" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/sections", label: "Sections", icon: IconPalette, key: "/admin/sections" },
      { href: "/admin/blog", label: "Blog & projects", icon: IconFeather, key: "/admin/blog" },
      { href: "/admin/hero", label: "Hero editor", icon: IconHeading, key: "/admin/hero" },
    ],
  },
  {
    title: "Appearance",
    items: [
      { href: "/admin/themes", label: "Visitor themes", icon: IconPalette, key: "/admin/themes" },
      { href: "/admin/effects", label: "Effects", icon: IconZap, key: "/admin/effects" },
    ],
  },
  {
    title: "Growth & system",
    items: [
      { href: "/admin/seo-health", label: "SEO health", icon: IconSearch, key: "/admin/seo-health" },
      { href: "/admin/cv", label: "System & CV", icon: IconShuffle, key: "/admin/cv" },
    ],
  },
] as const;

const TITLES: Record<string, string> = Object.fromEntries(
  V2_NAV.flatMap((g) => g.items.map((i) => [i.key, i.label])),
);

export function AdminV2Chrome({
  children,
  inboxCount = 0,
}: {
  children: React.ReactNode;
  inboxCount?: number;
}) {
  const pathname = usePathname();
  const bare =
    pathname?.startsWith("/login") || pathname?.startsWith("/admin/logout");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try { setDark(localStorage.getItem("admdark") === "1"); } catch {}
  }, []);
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem("admdark", next ? "1" : "0"); } catch {}
  };

  if (bare) return <>{children}</>;

  const title = TITLES[pathname ?? "/admin"] ?? "Portfolio Admin";

  return (
    <div className="av2" data-admdark={dark ? "1" : undefined}>
      <aside className="av2-aside" aria-label="Admin navigation">
        <div className="av2-brand">
          <i><IconZap size={15} /></i>
          Portfolio Admin
        </div>
        <nav aria-label="Admin">
          {V2_NAV.map((group) => (
            <div key={group.title}>
              <p className="av2-grp">{group.title}</p>
              {group.items.map((item) => {
                const active =
                  item.key === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.key);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("av2-nv", active && "on")}
                  >
                    <item.icon size={16} />
                    {item.label}
                    {((item as { badge?: boolean }).badge) && inboxCount > 0 ? (
                      <b>{inboxCount}</b>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="av2-side-f">
          <form action={logoutAction}>
            <button
              type="submit"
              className="av2-nv"
              style={{ color: "var(--bad2)" }}
            >
              <IconLogout size={16} /> Log out
            </button>
          </form>
          Signed in as Administrator
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <div className="av2-top">
          <h1>{title}</h1>
          <button
            type="button"
            className="av2-btn"
            aria-label="Toggle admin theme"
            onClick={toggleDark}
          >
            ◐
          </button>
          <Link className="av2-btn" href="/" target="_blank">
            View site ↗
          </Link>
          <div className="av2-av" title="Administrator">A</div>
        </div>
        <div className="av2-pg" tabIndex={-1}>
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
