import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Inter } from "next/font/google";
import "../globals.css";
import "./admin.css";

/**
 * Admin panel lives outside the [locale] tree in the (admin) route group,
 * so it gets its own root layout (next-intl's proxy excludes /admin).
 * English-only UI keeps it simple and predictable.
 * instant=false + connection() + Suspense: pages read the session (cookies)
 * at request time inside the boundary — nothing authed is ever prerendered.
 */
export const instant = false;

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin | Emran Hossain",
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force dynamic rendering (no prerender) — admin pages read cookies/session.
  await connection();
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="wrap" id="main">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}
