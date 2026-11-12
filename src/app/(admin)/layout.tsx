import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AdminV2Chrome } from "@/components/admin/AdminV2Chrome";
import { cacheTag } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createServiceClient, adminConfigured } from "@/lib/supabase/service";
import "../globals.css";
import "./admin.css";

// Admin area: never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const inter = Inter({ subsets: ["latin"] });

async function inboxCount(): Promise<number> {
  "use cache";
  cacheTag("content");
  if (!adminConfigured()) return 0;
  try {
    const db = createServiceClient();
    const { count } = await db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function pendingTestimonialsCount(): Promise<number> {
  "use cache";
  cacheTag("content");
  if (!adminConfigured()) return 0;
  try {
    const db = createServiceClient();
    const { count } = await db
      .from("testimonials")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Read locally (not via @/lib/cms): importing the cms module into the admin
// layout trips Next's prerender detector (Date.now) in dev — the local
// "use cache" pattern from inboxCount is safe.
async function adminProfile(): Promise<{ display_name: string; avatar_url: string }> {
  "use cache";
  cacheTag("content");
  const fallback = { display_name: "Administrator", avatar_url: "" };
  if (!adminConfigured()) return fallback;
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("site_settings")
      .select("value")
      .eq("key", "admin_profile")
      .maybeSingle();
    const v = (data?.value ?? {}) as { display_name?: string; avatar_url?: string };
    return {
      display_name: String(v.display_name ?? "").trim() || "Administrator",
      avatar_url: String(v.avatar_url ?? "").trim(),
    };
  } catch {
    return fallback;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stage 6 item 1: route-level default guard, OUTSIDE the chrome's
  // Suspense hole — unauthenticated requests get a real 307 to /login
  // before any admin UI renders. /login renders bare and skips this.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/logout")) {
    await requireAdmin();
  }
  const [unread, pendingReviews, profile] = await Promise.all([
    inboxCount(),
    pendingTestimonialsCount(),
    adminProfile(),
  ]);
  return (
      <html lang="en" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- admin mockup fonts (Bricolage + Hind Siliguri), single admin area */}
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Hind+Siliguri:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Suspense fallback={null}>
          <AdminV2Chrome
            inboxCount={unread}
            pendingTestimonials={pendingReviews}
            adminName={profile.display_name}
            adminAvatar={profile.avatar_url}
          >
            {children}
          </AdminV2Chrome>
        </Suspense>
      </body>
    </html>
  );
}
