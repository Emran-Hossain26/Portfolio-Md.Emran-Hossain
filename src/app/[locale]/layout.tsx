import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hind_Siliguri, Inter, Sora } from "next/font/google";
import { routing } from "@/i18n/routing";
import { headers } from "next/headers";

// Stage 6 item 5: the nonce-CSP layout reads request headers, so the whole
// locale subtree renders per request (blocking route). Data stays cached
// through the "use cache" layer — only the HTML shell re-renders.
export const instant = false;
import { site, siteUrl } from "@/data/site";
import { getThemeOverrides, getSeoSettings, getThemePresets, getThemeVisitorSwitch, getEffectsSettings, getMaintenanceMode, getModuleSettings, getBlogPosts, getProjects } from "@/lib/cms";
import { EFFECTS } from "@/lib/fx/effects";
import { blogPostHref } from "@/lib/cms";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { BackSoon } from "@/components/BackSoon";
import { VisitorTracker } from "@/components/VisitorTracker";
import { CommandPalette } from "@/components/CommandPalette";
import { PreviewDock } from "@/components/PreviewDock";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    "@id": `${siteUrl}/#professional-service`,
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
    "@id": `${siteUrl}/#website`,
    name: site.name,
    url: `${siteUrl}/`,
    description:
      "IT infrastructure, cybersecurity and full-stack development portfolio",
    inLanguage: ["en", "bn"],
    publisher: { "@type": "Person", "@id": `${siteUrl}/#person`, name: site.name },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
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
  // Unknown top-level paths can reach this dynamic segment when middleware is
  // skipped (e.g. "/llms.txt" has a dot). They must 404, never render home.
  if (!hasLocale(routing.locales, locale)) notFound();
  const resolved = locale;
  setRequestLocale(resolved);

  // Stage 6 item 5 — per-request nonce from the proxy; stamps the inline
  // theme/effects scripts so they pass the nonce-based CSP.
  const nonce = (await headers()).get("x-nonce") ?? "";
  // Portfolio route only (Stage 6/7 spec): the intro + its controls live here.
  const px = (await headers()).get("x-pathname") ?? "";
  const isHome = px === "/" || px === "/bn" || px === "/en";

  const themeStyle = buildThemeStyle(await getThemeOverrides());
  const seoSettings = await getSeoSettings();
  const presets = await getThemePresets();
  const visitorSwitch = await getThemeVisitorSwitch();
  const fxSettings = await getEffectsSettings();
  const maintenance = await getMaintenanceMode();
  const modules = await getModuleSettings();
  const [palettePosts, paletteProjects] = modules.palette
    ? await Promise.all([getBlogPosts(), getProjects()])
    : [[], []];

  // Command palette index: static pages + posts + projects (locale-aware).
  const p = resolved === "bn" ? "/bn" : "";
  const paletteItems = [
    { label: resolved === "bn" ? "হোম" : "Home", href: `${p}/`, kind: "page" as const },
    { label: resolved === "bn" ? "প্রজেক্ট" : "Projects", href: `${p}/projects`, kind: "page" as const },
    { label: resolved === "bn" ? "সার্ভিস" : "Services", href: `${p}/services`, kind: "page" as const },
    { label: resolved === "bn" ? "ব্লগ" : "Blog", href: `${p}/blog`, kind: "page" as const },
    { label: resolved === "bn" ? "রিভিউ" : "Reviews", href: `${p}/testimonials`, kind: "page" as const },
    { label: resolved === "bn" ? "আমার সম্পর্কে" : "About", href: `${p}/about`, kind: "page" as const },
    { label: resolved === "bn" ? "যোগাযোগ" : "Contact", href: `${p}/contact`, kind: "page" as const },
    ...palettePosts.slice(0, 20).map((post) => ({
      label: post.title.en || post.title.bn,
      href: `${p}${blogPostHref(resolved as never, post)}`,
      kind: "post" as const,
    })),
    ...paletteProjects.map((proj) => ({
      label: proj.title.en || proj.title.bn,
      href: `${p}/projects/${proj.slug}`,
      kind: "project" as const,
    })),
  ];

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

  // Effects defaults from the admin Effects Manager, applied pre-paint.
  // Three visitor groups; a group exists only if the admin left at least one
  // of its effects on (master gates everything). Visitors can switch an
  // available group off — never on a disabled one. First-visit default is
  // Full or Lite (lite = off on touch/slow devices). Reduced motion starts
  // every group off.
  const effectsScript = `try{
var s=${JSON.stringify(fxSettings)};
var touch=matchMedia("(pointer: coarse)").matches;
var slow=(navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.connection&&navigator.connection.saveData);
document.documentElement.dataset.fxRmOverride=${fxSettings.override_reduced}?"1":"0";
var rm=(${fxSettings.override_reduced}?false:matchMedia("(prefers-reduced-motion: reduce)").matches);
function allow(names){if(!s.master)return false;for(var i=0;i<names.length;i++){if(s[names[i]]===true)return true;}return false;}
var cursorAllowed=!(touch&&s.touch_disable!==false);
var av={};
for(var ei=0;ei<${JSON.stringify(EFFECTS.map(e=>e.key))}.length;ei++){
  var ek=${JSON.stringify(EFFECTS.map(e=>e.key))}[ei];
  var grp=${JSON.stringify(EFFECTS.map(e=>e.group))}[ei];
  var gok = grp==="cursor"?cursorAllowed:true;
  av[ek]=gok && allow([ek]);
  document.documentElement.setAttribute("data-fx-"+ek, (av[ek]?"on":"off"));
}
var lite=s.default_mode==="lite"&&(touch||slow)&&!localStorage.getItem("fx_chosen");
var out={};
${JSON.stringify(EFFECTS.map(e=>e.key))}.forEach(function(k){
var v=false;
if(av[k]&&!rm&&!lite){try{v=localStorage.getItem("fx_effect_"+k)!=="off";}catch(e){v=true;}}
out[k]=v;
document.documentElement.setAttribute("data-fx-"+k,v?"on":"off");
});
}catch(e){}
try{var th=(JSON.parse(localStorage.getItem("pf")||"{}").themes)||{};document.querySelectorAll(".theme-select select option").forEach(function(o){if(th[o.value]===false){o.disabled=true;o.hidden=true;}});}catch(e){}
try{if(sessionStorage.getItem("pf_nav")==="1"){document.documentElement.setAttribute("data-nav","1");}else{sessionStorage.setItem("pf_nav","1");}setTimeout(function(){document.documentElement.setAttribute("data-nav","1");},400);}catch(e){}`;

  // Agent Cursors intro — pre-paint gate. Adds `ac-run` to <html> before first
  // paint when: the visitor explicitly turned it on (runs even with
  // reduced-motion — explicit consent), or the choice is unset and the
  // Task U7: the intro no longer autoplays — the boot script must NOT add
  // `ac-run` pre-paint (that would hide the page on load). The page renders
  // fully built; AgentCursors adds ac-run itself when the visitor's first
  // scroll (~120px) arms the show. Failsafe stays: if ac-run ever exists
  // without the component's `data-ac-alive` heartbeat (JS blocked), remove
  // it after 12s so the page is never stuck hidden.
  const agentCursorsScript = `try{
(function(){var acStart=Date.now();var acIv=setInterval(function(){try{
if(!document.documentElement.classList.contains('ac-run')||Date.now()-acStart>1200000){clearInterval(acIv);return;}
if(!document.documentElement.getAttribute('data-ac-alive')&&Date.now()-acStart>12000){document.documentElement.classList.remove('ac-run');clearInterval(acIv);}
}catch(e){clearInterval(acIv);}},2000);})();`;

  return (
    <html
      lang={resolved}
      className={`${sora.variable} ${inter.variable} ${hind.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: effectsScript }} />
        {/* Agent Cursors boot: portfolio route only (Stage 6/7 spec). */}
        {isHome ? (
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: agentCursorsScript }} />
        ) : null}
        {themeStyle ? (
          <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        ) : null}
        {seoSettings.gsc_verification ? (
          <meta name="google-site-verification" content={seoSettings.gsc_verification} />
        ) : null}
        {seoSettings.bing_verification ? (
          <meta name="msvalidate.01" content={seoSettings.bing_verification} />
        ) : null}
        {/* Icons are inline SVG; the old FontAwesome CDN stylesheet was a
            third-party render-blocking request (Lighthouse LCP 3.8s). */}
      </head>
      <body>
        {maintenance ? (
          // Maintenance mode (admin toggle): visitors get the back-soon page;
          // /admin and /login are separate routes and stay reachable.
          <BackSoon />
        ) : (
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
          <VisitorTracker />
          <PreviewDock
            allowed={{
              animation: fxSettings.master && (fxSettings.tilt || fxSettings.parallax || fxSettings.scramble || fxSettings.counters),
              cursor: fxSettings.master && (fxSettings.mascot || fxSettings.trail || fxSettings.ripple || fxSettings.magnetic),
              magical: fxSettings.master && (fxSettings.aurora || fxSettings.network),
            }}
            sections={[
              { key: "expertise", label: resolved === "bn" ? "আমি যা করি" : "What I do" },
              { key: "skills", label: resolved === "bn" ? "টেক স্ট্যাক" : "Tech stack" },
              { key: "stats", label: resolved === "bn" ? "সংখ্যায়" : "Stats" },
              { key: "projects", label: resolved === "bn" ? "প্রজেক্ট" : "Projects" },
              { key: "certifications", label: resolved === "bn" ? "সার্টিফিকেট" : "Certifications" },
              { key: "reviews", label: resolved === "bn" ? "রিভিউ" : "Reviews" },
              { key: "faq", label: "FAQ" },
              { key: "now", label: resolved === "bn" ? "এখন" : "Now" },
              { key: "blog", label: resolved === "bn" ? "ব্লগ" : "Blog" },
              { key: "contact", label: resolved === "bn" ? "যোগাযোগ" : "Contact" },
            ]}
            themes={presets.filter((th) => th.enabled).map((th) => ({ key: th.key, label: th.name }))}
          />
          {modules.speedInsights ? <SpeedInsights /> : null}
          {modules.palette ? (
            <CommandPalette
              items={paletteItems}
              themes={presets.filter((th) => th.enabled).map((th) => ({ key: th.key, label: th.name }))}
            />
          ) : null}
          {/* Agent Cursors intro + its Effects button mount on the portfolio
              page (src/app/[locale]/page.tsx) only — spec scope. */}
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
        )}
      </body>
    </html>
  );
}

async function SkipLabel() {
  const t = await getTranslations("a11y");
  return <>{t("skip")}</>;
}
