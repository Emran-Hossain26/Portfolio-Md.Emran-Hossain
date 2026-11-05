import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hind_Siliguri, Inter, Sora } from "next/font/google";
import { routing } from "@/i18n/routing";
import { site, siteUrl } from "@/data/site";
import { getThemeOverrides, getSeoSettings, getThemePresets, getThemeVisitorSwitch, getEffectsSettings } from "@/lib/cms";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { AdminPreview } from "@/components/AdminPreview";
import { ScrollProgress } from "@/components/ScrollProgress";
import { CursorTrail } from "@/components/fx/CursorTrail";
import { TiltCards } from "@/components/fx/TiltCards";
import { Mascot } from "@/components/fx/Mascot";
import { ClickRipple } from "@/components/fx/ClickRipple";
import { MagneticButtons } from "@/components/fx/MagneticButtons";
import { AuroraGlow } from "@/components/fx/AuroraGlow";
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
// The noFlashScript (below) replaces this — kept for reference only.

/**
 * Admin theme colours (site_settings: theme_light / theme_dark) injected as
 * an override <style> AFTER globals.css mirrors the mockup's cascade.
 * Specificity is doubled (`:root:root`, `:root[data-theme=dark]:root[data-theme=dark]`)
 * so admin colours always win over the shipped defaults, per mode
 * (light system users, explicit-light users, explicit-dark users;
 * system-dark defaults stay dark). Tokens = 6-digit hex, validated in cms.ts.
 */
function buildThemeStyle(overrides: {
  light: Partial<Record<string, string>>;
  dark: Partial<Record<string, string>>;
}) {
  const decl = (tokens: Partial<Record<string, string>>) =>
    Object.entries(tokens)
      .map(([key, value]) => `--${key}:${value};`)
      .join("");
  const light = decl(overrides.light);
  const dark = decl(overrides.dark);
  if (!light && !dark) return null;
  return [
    light
      ? `:root[data-theme=light]:root{${light}}`
      : "",
    light
      ? `@media (prefers-color-scheme: light){:root:not([data-theme=dark]):not([data-theme=light]){${light}}}`
      : "",
    dark ? `:root[data-theme=dark]:root[data-theme=dark]{${dark}}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

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
    "@id": `${siteUrl}/#person`,
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

function professionalServiceJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `${site.name} — IT Infrastructure & Cybersecurity`,
    url: `${siteUrl}/`,
    description:
      "IT infrastructure, cybersecurity, networking and full-stack web development services for businesses in Dhaka, Bangladesh.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
    areaServed: "BD",
    priceRange: "$$",
  });
}

function websiteJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: `${siteUrl}/`,
    description:
      "IT infrastructure, cybersecurity and full-stack development portfolio",
    inLanguage: ["en", "bn"],
    publisher: { "@type": "Person", name: site.name },
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

  const themeStyle = buildThemeStyle(await getThemeOverrides());
  const seoSettings = await getSeoSettings();
  const presets = await getThemePresets();
  const visitorSwitch = await getThemeVisitorSwitch();
  const fxSettings = await getEffectsSettings();

  // Inject allowed preset keys + default into the no-flash script.
  const allowedKeys = presets.filter((p) => p.enabled).map((p) => p.key);
  const defaultKey = presets.find((p) => p.isDefault)?.key ?? (allowedKeys[0] ?? "light");
  const noFlashScript = `try{
var allowed=${JSON.stringify(allowedKeys)};
var def="${defaultKey}";
var c=document.cookie.match(/(?:^|; )theme=([^;]+)/);
var t=(c?decodeURIComponent(c[1]):null)||localStorage.getItem("theme")||def;
if(allowed.indexOf(t)<0||!${visitorSwitch})t=def;
if(allowed.indexOf(t)<0)t=allowed[0]||"light";
document.documentElement.dataset.theme=t;
}catch(e){document.documentElement.dataset.theme="light";}`;

  // Effects defaults from the admin Effects Manager, applied pre-paint:
  // admin-OFF effects are forced off; admin-ON is the default the visitor
  // can override (overrides persist in localStorage per effect key). On
  // slow devices with lite_mode enabled, effects start off until the
  // visitor explicitly turns them on (the drawer marks "fx_chosen").
  const effectsScript = `try{
var fxd=${JSON.stringify(fxSettings)};
var slow=(navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.connection&&navigator.connection.saveData);
for(var k in fxd){
if(k==="master"||k==="lite_mode")continue;
if(fxd[k]===false){localStorage.setItem(k,"off");}
else if(localStorage.getItem(k)===null){localStorage.setItem(k,"on");}
}
if(fxd.master===false){document.documentElement.dataset.effects="off";}
else if(slow&&fxd.lite_mode&&!localStorage.getItem("fx_chosen")){document.documentElement.dataset.effects="off";}
}catch(e){}`;

  return (
    <html
      lang={resolved}
      className={`${sora.variable} ${inter.variable} ${hind.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <script dangerouslySetInnerHTML={{ __html: effectsScript }} />
        {themeStyle ? (
          <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        ) : null}
        {seoSettings.gsc_verification ? (
          <meta name="google-site-verification" content={seoSettings.gsc_verification} />
        ) : null}
        {seoSettings.bing_verification ? (
          <meta name="msvalidate.01" content={seoSettings.bing_verification} />
        ) : null}
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
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          {children}
          <Footer />
          <Analytics id={seoSettings.analytics_id} />
          <AdminPreview />
          <ScrollProgress />
          <CursorTrail />
          <TiltCards />
          <Mascot />
          <ClickRipple />
          <MagneticButtons />
          <AuroraGlow />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: personJsonLd() }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: professionalServiceJsonLd() }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: websiteJsonLd() }}
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
