"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Admin Sidebar Navigation
 * Provides navigation between admin pages with grouping and icons.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "Overview",
      items: [
        { href: "/admin", label: "Dashboard", icon: "fa-solid fa-house" },
      ],
    },
    {
      title: "Appearance",
      items: [
        { href: "/admin/hero", label: "Hero texts", icon: "fa-solid fa-heading" },
        { href: "/admin/theme", label: "Theme colours", icon: "fa-solid fa-palette" },
        { href: "/admin/themes", label: "Visitor themes", icon: "fa-solid fa-eye" },
      ],
    },
    {
      title: "Content",
      items: [
        { href: "/admin/projects", label: "Projects", icon: "fa-solid fa-briefcase" },
        { href: "/admin/blog", label: "Blog", icon: "fa-solid fa-feather-pointed" },
        { href: "/admin/testimonials", label: "Testimonials", icon: "fa-solid fa-star" },
        { href: "/admin/experience", label: "Experience", icon: "fa-solid fa-timeline" },
        { href: "/admin/education", label: "Education", icon: "fa-solid fa-graduation-cap" },
      ],
    },
    {
      title: "System & SEO",
      items: [
        { href: "/admin/cv", label: "CV upload", icon: "fa-solid fa-file-arrow-up" },
        { href: "/admin/seo", label: "SEO", icon: "fa-solid fa-magnifying-glass-chart" },
        { href: "/admin/redirects", label: "Redirects", icon: "fa-solid fa-shuffle" },
        { href: "/admin/seo-health", label: "SEO Health", icon: "fa-solid fa-heart-pulse" },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="admin-sidebar">
      <div className="overflow-y-auto p-5 custom-scrollbar">
        {/* Brand */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-bolt text-sm"></i>
            </div>
            Portfolio Admin
          </h1>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "admin-nav-link",
                      isActive(item.href) && "admin-nav-link-active"
                    )}
                  >
                    <i className={item.icon + " w-5 text-center"} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Logout Section */}
      <div className="admin-sidebar-footer">
        <Link
          href="/login"
          className="admin-logout-link"
        >
          <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center" />
          Log out
        </Link>
      </div>
    </aside>
  );
}