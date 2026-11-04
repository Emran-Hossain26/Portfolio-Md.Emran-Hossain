import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hind_Siliguri, Inter, Sora } from "next/font/google";
import { routing } from "@/i18n/routing";
import { site, siteUrl } from "@/data/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminAccentDemo } from "@/components/AdminAccentDemo";
import "../globals.css";

// Self-hosted fonts (deviation #4): same families/weights as the mockup.
const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-sora",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});
const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "600"],
  variable: "--font-hind",
  display: "swap",
});

// Deviation #7: sets theme before first paint so dark mode never flashes.
const themeScript = `try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function generateMetadata(): Metadata {
  // Pages define their own (locale-aware) title/description/hreflang via
  // src/lib/seo.ts. The layout only supplies the base for relative URLs.
  return { metadataBase: new URL(siteUrl) };
}

function personJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: "IT Infrastructure, Cybersecurity & Full Stack Engineer",
    url: `${siteUrl}/`,
    email: site.email,
    telephone: site.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
    sameAs: [
      site.socials.github,
      site.socials.facebook,
      site.socials.linkedin,
    ],
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(resolved);

  return (
    <html
      lang={resolved}
      className={`${sora.variable} ${inter.variable} ${hind.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          {/* Deviation #8: sr-only skip link, invisible until focused */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:border focus:border-line focus:bg-panel focus:px-3 focus:py-2"
          >
            <SkipLabel />
          </a>
          <Header />
          {children}
          <Footer />
          <AdminAccentDemo />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: personJsonLd() }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

async function SkipLabel() {
  const t = await getTranslations("a11y");
  return <>{t("skip")}</>;
}
