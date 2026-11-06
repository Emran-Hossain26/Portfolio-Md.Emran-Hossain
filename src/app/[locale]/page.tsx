import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolvePageMetadata } from "@/lib/seo";
import { getContactInfo, getSections, getSkills, getNowItems } from "@/lib/cms";
import type { Locale } from "@/data/types";
import { Hero } from "@/components/home/Hero";
import { Expertise } from "@/components/home/Expertise";
import { SkillsWall } from "@/components/home/SkillsWall";
import { Projects } from "@/components/home/Projects";
import { Reviews } from "@/components/home/Reviews";
import { BlogPreview } from "@/components/home/BlogPreview";
import { Contact } from "@/components/home/Contact";
import { Certifications, Faq, Stats } from "@/components/home/Extras";
import { NowSection } from "@/components/home/NowSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: resolved, namespace: "meta" });
  return resolvePageMetadata(resolved, "/", t("title"), t("description"));
}

/** Every renderable home section, keyed by the sections-table key. */
const SECTION_MAP: Record<string, () => React.ReactNode> = {
  expertise: () => <Expertise />,
  skills: () => <SkillsWall />,
  stats: () => <Stats />,
  projects: () => <Projects />,
  certifications: () => <Certifications />,
  reviews: () => <Reviews />,
  faq: () => <Faq />,
  now: () => <NowSection />,
  blog: () => <BlogPreview />,
  contact: () => <Contact />,
};

const DEFAULT_ORDER = [
  "expertise",
  "skills",
  "stats",
  "projects",
  "certifications",
  "reviews",
  "faq",
  "now",
  "blog",
  "contact",
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(resolved);

  const [contact, sections, skills, nowItems] = await Promise.all([
    getContactInfo(),
    getSections(),
    getSkills(),
    getNowItems(),
  ]);

  // The admin Sections manager is authoritative: enabled=false drops a
  // section, sort_order orders them. Pre-migration the table only holds the
  // old six keys — in that partial state the default ORDER is kept and only
  // the stored enabled flags apply, so no section silently disappears.
  const rows = new Map(sections.map((s) => [s.key, s]));
  let keys: string[];
  if (sections.length && DEFAULT_ORDER.every((k) => rows.has(k))) {
    keys = sections
      .filter((s) => s.enabled && s.key !== "hero" && SECTION_MAP[s.key])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.key);
  } else {
    keys = DEFAULT_ORDER.filter((k) => rows.get(k)?.enabled !== false);
  }

  const rendered = keys
    .filter((k) => (k === "skills" ? skills.length > 0 : true))
    .filter((k) => (k === "now" ? nowItems.length > 0 : true))
    .map((k) => SECTION_MAP[k]?.())
    .filter(Boolean);

  // id="avail" — targeted by the visitor preview panel's availability toggle
  const availabilityChip = (
    <p className="chip on" id="avail">
      <i aria-hidden="true" />
      {resolved === "bn"
        ? contact.availability.bn || contact.availability.en
        : contact.availability.en || contact.availability.bn}
    </p>
  );

  return (
    <main className="wrap" id="main">
      {/* Hero stays un-revealed: it holds the LCP element. Sections below
          carry data-reveal — the lazy "Animation" module hides only what is
          below the fold and reveals it on first scroll. data-sec keys match
          the sections table that the admin Sections manager controls. */}
      <Hero chip={availabilityChip} />
      {rendered.map((node, i) => (
        <div data-reveal key={i}>{node}</div>
      ))}
    </main>
  );
}
