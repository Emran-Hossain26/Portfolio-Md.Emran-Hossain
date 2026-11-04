import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

/**
 * Global 404 — required because the site's root layout lives in
 * app/[locale] (a top-level dynamic segment). Bypasses all layouts,
 * so it renders a full HTML document. Global styles + light theme
 * tokens + a small copy of the theme script are imported directly.
 */
export const metadata: Metadata = {
  title: "Page not found | মোঃ ইমরান হোসেন",
  robots: { index: false },
};

const themeScript = `try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}`;

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <main className="wrap" id="main">
          <section style={{ paddingTop: 32 }}>
            <h1 style={{ fontSize: 30, marginBottom: 26 }}>
              Page not found / পেজটি পাওয়া যায়নি
            </h1>
            <p className="mute">
              The page you are looking for does not exist or has moved. /
              আপনি যে পেজটি খুঁজছেন সেটি নেই বা সরানো হয়েছে।
            </p>
            <p style={{ marginTop: 18 }}>
              <Link className="btn" href="/">
                Back to home (EN)
              </Link>{" "}
              <Link className="btn" href="/bn">
                হোমে ফিরে যান (BN)
              </Link>
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
