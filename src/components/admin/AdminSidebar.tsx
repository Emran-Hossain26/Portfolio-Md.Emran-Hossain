"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(admin)/actions";
import { cn } from "@/lib/utils";
import {
  IconZap, IconHome, IconHeading, IconPalette, IconEye,
  IconBriefcase, IconFeather, IconStar, IconTimeline, IconGraduation,
  IconFileUp, IconSearch, IconShuffle, IconPulse, IconLogout,
} from "@/components/admin/icons";

/**
 * Admin sidebar (approved mockup): grouped navigation with SVG icons,
 * active state, log out pinned to the bottom (real server sign-out).
 * Mobile: slides in behind the hamburger; desktop: static flex column.
 */
export function AdminSidebar({ open }: { open?: boolean }) {
  const pathname = usePathname();

  const groups = [
    {
      title: "Overview",
      items: [{ href: "/admin", label: "Dashboard", icon: IconHome }],
    },
    {
      title: "Appearance",
      items: [
        { href: "/admin/texts", label: "Hero texts", icon: IconHeading },
        { href: "/admin/theme", label: "Theme colours", icon: IconPalette },
        { href: "/admin/themes", label: "Visitor themes", icon: IconEye },
      ],
    },
    {
      title: "Content",
      items: [
        { href: "/admin/projects", label: "Projects", icon: IconBriefcase },
        { href: "/admin/blog", label: "Blog", icon: IconFeather },
        { href: "/admin/testimonials", label: "Testimonials", icon: IconStar },
        { href: "/admin/experience", label: "Experience", icon: IconTimeline },
        { href: "/admin/education", label: "Education", icon: IconGraduation },
      ],
    },
    {
      title: "System & SEO",
      items: [
        { href: "/admin/cv", label: "CV upload", icon: IconFileUp },
        { href: "/admin/seo", label: "SEO", icon: IconSearch },
        { href: "/admin/redirects", label: "Redirects", icon: IconShuffle },
        { href: "/admin/seo-health", label: "SEO Health", icon: IconPulse },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className={"admin-sidebar" + (open ? " active" : "")}>      <div className="overflow-y-auto p-5">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-3 mb-8">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
            <IconZap size={16} />
          </span>
          Portfolio Admin
        </h1>

        <nav className="space-y-6" aria-label="Admin">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all duration-200 text-sm font-medium",
                      isActive(item.href) && "bg-blue-50 text-blue-700",
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-5 border-t border-slate-100">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            <IconLogout className="w-5 h-5 shrink-0" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
