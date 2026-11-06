import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AdminChrome } from "@/components/admin/AdminChrome";
import "../globals.css";
import "./admin.css";

// Admin area: never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Suspense fallback={null}>
          <AdminChrome>{children}</AdminChrome>
        </Suspense>
      </body>
    </html>
  );
}
