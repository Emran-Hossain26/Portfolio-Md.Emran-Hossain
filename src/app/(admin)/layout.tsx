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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const unread = await inboxCount();
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Suspense fallback={null}>
          <AdminV2Chrome inboxCount={unread}>{children}</AdminV2Chrome>
        </Suspense>
      </body>
    </html>
  );
}
