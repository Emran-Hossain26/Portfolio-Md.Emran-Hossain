import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AdminV2Chrome } from "@/components/admin/AdminV2Chrome";
import { createServiceClient, adminConfigured } from "@/lib/supabase/service";
import "../globals.css";
import "./admin.css";

// Admin area: never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const inter = Inter({ subsets: ["latin"] });

async function inboxCount(): Promise<number> {
  if (!adminConfigured()) return 0;
  try {
    const db = createServiceClient();
    const { count } = await db
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function InboxBadge() {
  const n = await inboxCount();
  if (!n) return null;
  return <b className="av2-badge">{n}</b>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Suspense fallback={null}>
          <AdminV2Chrome badge={<Suspense fallback={null}><InboxBadge /></Suspense>}>
            {children}
          </AdminV2Chrome>
        </Suspense>
      </body>
    </html>
  );
}
