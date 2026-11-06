"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { IconMenu, IconX } from "@/components/admin/icons";

/**
 * Admin chrome: sidebar + header + footer around the page content.
 * Auth pages (/login, /admin/logout) render bare — no admin chrome, no
 * navigation, so the login scene stays exactly as designed.
 * On mobile the sidebar collapses behind a hamburger (spec Step 4).
 */
export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/admin/logout") ||
    pathname === "/admin/logout";
  const [open, setOpen] = useState(false);

  if (bare) return <>{children}</>;

  return (
    <div className="admin-wrapper">
      {/* Mobile overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}
        <AdminSidebar open={open} />
      <main className="admin-main flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
          <button
            type="button"
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
          <span className="text-sm font-semibold text-slate-800">Portfolio Admin</span>
          <span className="w-8" aria-hidden="true" />
        </div>
        <AdminHeader />
        <div className="admin-content flex-1">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
        <AdminFooter />
      </main>
    </div>
  );
}
