import "server-only";
import { cacheTag, cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Project, ProjectSlide } from "@/data/projects";
import type { Post } from "@/data/posts";
import type { Localized } from "@/data/types";
import type { Locale } from "@/data/types";

/**
 * Public content layer. Reads from Supabase when configured; falls back to
 * the seed data files so the site works before/without a database.
 * Cached under the "content" tag — admin actions call revalidateTag("content").
 */

const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const L = (en: unknown, bn: unknown): Localized => ({
  en: typeof en === "string" ? en : "",
  bn: typeof bn === "string" ? bn : "",
});

// --- Projects ---------------------------------------------------------------

/** Validates the jsonb slides list; keeps entries even without an image
 *  (caption-only slides stay slides — 4c placeholder is rendered for them). */
function parseSlides(raw: unknown): ProjectSlide[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list = raw
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s) => ({
      src: typeof s.src === "string" ? s.src.trim() : "",
      caption_en: typeof s.caption_en === "string" ? s.caption_en : "",
      caption_bn: typeof s.caption_bn === "string" ? s.caption_bn : "",
    }));
  return list.length ? list : undefined;
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheTag("content");
  if (!configured()) return (await import("@/data/projects")).seedProjects;
  try {
    // Stage U2: hidden (published=false) and trashed (deleted_at) rows never
    // reach the public site. Columns arrive with migration 20261117 — the
    // fetch retries down to the pre-U2 shape (published-only) so the real
    // showcase never falls back to seeds mid-upgrade. Featured rows float
    // to the top, then sort_order.
    const P_SELECT = "slug,title_en,title_bn,problem_en,problem_bn,solution_en,solution_bn,tech,media,video,demo_url,slides,sort_order";
    const P_SELECT_CASE = P_SELECT.replace("tech,", "result_en,result_bn,metrics,tech,");
    const P_SELECT_FULL = P_SELECT_CASE.replace("tech,", "status,featured,live_url,repo_url,tech,");
    const fetchProjects = async (select: string, useU2 = true) => {
      let q = db().from("projects").select(select).eq("published", true);
      if (useU2) q = q.is("deleted_at", null).order("featured", { ascending: false });
      const { data, error } = await q.order("sort_order");
      if (error) return null;
      return (data as unknown as Record<string, unknown>[]) ?? null;
    };
    let data = await fetchProjects(P_SELECT_FULL);
    if (!data) data = await fetchProjects(P_SELECT_CASE);
    if (!data) data = await fetchProjects(P_SELECT, false);
    if (!data?.length) {
      return (await import("@/data/projects")).seedProjects;
    }
    return data.map((row) => {
      const problem = L(row.problem_en, row.problem_bn);
      const solution = L(row.solution_en, row.solution_bn);
      const result = L(row.result_en, row.result_bn);
      const media = row.media as Project["media"];
      const metrics = Array.isArray(row.metrics)
        ? (row.metrics as unknown[])
            .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
            .map((m) => ({ label: String(m.label ?? ""), value: String(m.value ?? "") }))
            .filter((m) => m.label && m.value)
        : [];
      return {
        slug: row.slug as string,
        title: L(row.title_en, row.title_bn),
        problem: problem.en || problem.bn ? problem : undefined,
        solution: solution.en || solution.bn ? solution : undefined,
        result: result.en || result.bn ? result : undefined,
        metrics: metrics.length ? metrics : undefined,
        tech: (row.tech as string[]) ?? [],
        media: media === "video" || media === "none" ? media : media === "slides" ? "slides" : undefined,
        video: (row.video as string) || undefined,
        slides: parseSlides(row.slides),
        demo_url: (row.demo_url as string) || undefined,
        live_url: (row.live_url as string) || undefined,
        repo_url: (row.repo_url as string) || undefined,
        status: row.status === "running" || row.status === "planned" || row.status === "paused" || row.status === "completed"
          ? (row.status as Project["status"])
          : undefined,
        featured: row.featured === true ? true : undefined,
      };
    });
  } catch {
    return (await import("@/data/projects")).seedProjects;
  }
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return (await getProjects()).find((p) => p.slug === slug);
}

// --- Posts -------------------------------------------------------------------

export async function getPosts(): Promise<Post[]> {
  "use cache";
  cacheTag("content");
  if (!configured()) return (await import("@/data/posts")).samplePosts;
  try {
    const { data, error } = await db()
      .from("posts")
      .select("slug,title_en,title_bn,body_en,body_bn,meta_en,meta_bn,status")
      .order("created_at", { ascending: false });
    if (error || !data?.length) {
      return (await import("@/data/posts")).samplePosts;
    }
    // Stage 6 audit fix: respect the status lifecycle — a draft/scheduled
    // row with the legacy published checkbox still true must not leak.
    return data
      .filter((row) => ((row.status as string) ?? "published") === "published")
      .map((row) => ({
        slug: row.slug as string,
        title: L(row.title_en, row.title_bn),
        body: L(row.body_en, row.body_bn),
        meta: L(row.meta_en, row.meta_bn),
      }));
  } catch {
    return (await import("@/data/posts")).samplePosts;
  }
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}

// --- Testimonials --------------------------------------------------------

export async function getTestimonials(): Promise<
  { quote: Localized; name: string }[]
> {
  "use cache";
  cacheTag("content");
  if (!configured()) {
    const seed = await import("@/data/testimonials");
    return seed.placeholderTestimonials.map((t) => ({
      quote: t.quote,
      name: t.name.en,
    }));
  }
  try {
    const { data, error } = await db()
      .from("testimonials")
      .select("name,company,quote_en,quote_bn")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error || !data?.length) {
      const seed = await import("@/data/testimonials");
      return seed.placeholderTestimonials.map((t) => ({
        quote: t.quote,
        name: t.name.en,
      }));
    }
    return data.map((row) => ({
      // Public submissions arrive in one language; the other locale falls
      // back to the same text so a card is never blank.
      quote: L(row.quote_en, row.quote_bn || row.quote_en),
      name: [row.name, row.company].filter(Boolean).join(", "),
    }));
  } catch {
    const seed = await import("@/data/testimonials");
    return seed.placeholderTestimonials.map((t) => ({
      quote: t.quote,
      name: t.name.en,
    }));
  }
}

// --- Experience / education ---------------------------------------------

export type TimelineItem = {
  role: Localized;
  org: Localized;
  period: string;
  details: string;
};

export async function getExperience(): Promise<TimelineItem[]> {
  "use cache";
  cacheTag("content");
  if (!configured()) return [];
  try {
    const { data, error } = await db()
      .from("experience")
      .select("role_en,role_bn,org_en,org_bn,period,details")
      .order("sort");
    if (error || !data) return [];
    return data.map((row) => ({
      role: L(row.role_en, row.role_bn),
      org: L(row.org_en, row.org_bn),
      period: row.period ?? "",
      details: row.details ?? "",
    }));
  } catch {
    return [];
  }
}

export async function getEducation(): Promise<TimelineItem[]> {
  "use cache";
  cacheTag("content");
  if (!configured()) return [];
  try {
    const { data, error } = await db()
      .from("education")
      .select("degree_en,degree_bn,org_en,org_bn,period")
      .order("sort");
    if (error || !data) return [];
    return data.map((row) => ({
      role: L(row.degree_en, row.degree_bn),
      org: L(row.org_en, row.org_bn),
      period: row.period ?? "",
      details: "",
    }));
  } catch {
    return [];
  }
}

// --- Settings (theme token type is defined next to getThemeOverrides) --

export async function getHeroTexts(): Promise<{
  heading: Localized;
  intro: Localized;
  cta: Localized;
  avail: boolean;
} | null> {
  "use cache";
  cacheTag("content");
  if (!configured()) return null;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "hero_texts")
      .maybeSingle();
    if (!data?.value) return null;
    // Two writer shapes exist in the wild:
    //  - current /admin/hero: {heading:{en,bn}, intro:{en,bn}, cta, avail}
    //  - legacy /admin/texts: {en:{heading,intro}, bn:{heading,intro}}
    // Support both; treat an all-empty save as unset (messages fallback).
    const v = data.value as {
      heading?: { en: string; bn: string };
      intro?: { en: string; bn: string };
      en?: { heading: string; intro: string };
      bn?: { heading: string; intro: string };
      cta?: { en: string; bn: string };
      avail?: boolean;
    };
    const heading = v.heading
      ? L(v.heading.en, v.heading.bn)
      : L(v.en?.heading, v.bn?.heading);
    const intro = v.intro
      ? L(v.intro.en, v.intro.bn)
      : L(v.en?.intro, v.bn?.intro);
    if (!heading.en && !heading.bn && !intro.en && !intro.bn) return null;
    return {
      heading,
      intro,
      cta: L(v.cta?.en, v.cta?.bn),
      avail: v.avail !== false,
    };
  } catch {
    return null;
  }
}

export async function getCvPath(): Promise<string | null> {
  "use cache";
  cacheTag("content");
  if (!configured()) return null;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "cv_path")
      .maybeSingle();
    return (data?.value as { url?: string } | undefined)?.url ?? null;
  } catch {
    return null;
  }
}

export type ThemeTokens = {
  accent: string;
  bg: string;
  panel: string;
  ink: string;
  mute: string;
  line: string;
};

type TokenType = keyof ThemeTokens;
const TOKEN_KEYS: TokenType[] = ["accent", "bg", "panel", "ink", "mute", "line"];

/** Keeps only valid #RRGGBB strings; missing keys = "no override". */
function pickTokens(raw: unknown): Partial<ThemeTokens> {
  const out: Partial<ThemeTokens> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const key of TOKEN_KEYS) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)) out[key] = v;
  }
  return out;
}

/**
 * Admin theme colour overrides, per theme mode. Partial output means
 * "keep the default for the tokens the admin left untouched".
 */
export async function getThemeOverrides(): Promise<{
  light: Partial<ThemeTokens>;
  dark: Partial<ThemeTokens>;
}> {
  "use cache";
  cacheTag("content");
  if (!configured()) return { light: {}, dark: {} };
  try {
    const { data, error } = await db()
      .from("site_settings")
      .select("key,value")
      .in("key", ["theme_light", "theme_dark"]);
    if (error || !data) return { light: {}, dark: {} };
    const light = pickTokens(data.find((r) => r.key === "theme_light")?.value);
    const dark = pickTokens(data.find((r) => r.key === "theme_dark")?.value);
    return { light, dark };
  } catch {
    return { light: {}, dark: {} };
  }
}

// --- Stage 1: Dynamic Content getters (services, skills, certs, faq, stats, social, contact, sections, flags, presets, messages) ---

export type Service = { id: string; title: Localized; desc: Localized; icon: string; price: string; sort: number };
export type Skill = { id: string; name: string; category: string; level: number; sort: number };
export type Certification = { id: string; title: Localized; issuer: Localized; year: string; href: string; sort: number };
export type Faq = { id: string; q: Localized; a: Localized; sort: number };
export type Stat = { id: string; value: string; label: Localized; sort: number };
export type SocialLink = { id: string; platform: string; url: string; label: Localized; sort: number };
export type ContactInfo = { email: string; phone: string; location: Localized; availability: Localized };
export type Section = { key: string; sort_order: number; enabled: boolean; content: { en: Record<string, unknown>; bn: Record<string, unknown> } };

export async function getServices(): Promise<Service[]> {
  "use cache"; cacheTag("content");
  if (!configured()) {
    const { expertiseItems } = await import("@/data/expertise");
    return expertiseItems.map((e, i) => ({
      id: `seed-${i}`, title: e.title, desc: e.desc, icon: "", price: "", sort: i + 1,
    }));
  }
  try {
    // price arrives with migration 20261113 — retry without it pre-migration.
    const fetchServices = async (select: string): Promise<Record<string, unknown>[] | null> => {
      const { data, error } = await db().from("services").select(select).eq("published", true).is("deleted_at", null).order("sort_order");
      return error ? null : (data as unknown as Record<string, unknown>[]);
    };
    const data = (await fetchServices("id,title_en,title_bn,desc_en,desc_bn,icon,price,sort_order"))
      ?? (await fetchServices("id,title_en,title_bn,desc_en,desc_bn,icon,sort_order"));
    if (!data?.length) {
      const { expertiseItems } = await import("@/data/expertise");
      return expertiseItems.map((e, i) => ({ id: `seed-${i}`, title: e.title, desc: e.desc, icon: "", price: "", sort: i + 1 }));
    }
    return data.map((r) => ({
      id: r.id as string,
      title: L(r.title_en, r.title_bn),
      desc: L(r.desc_en, r.desc_bn),
      icon: (r.icon as string) ?? "",
      price: (r.price as string) ?? "",
      sort: (r.sort_order as number) ?? 0,
    }));
  } catch {
    const { expertiseItems } = await import("@/data/expertise");
    return expertiseItems.map((e, i) => ({ id: `seed-${i}`, title: e.title, desc: e.desc, icon: "", price: "", sort: i + 1 }));
  }
}

export async function getSkills(): Promise<Skill[]> {
  "use cache"; cacheTag("content");
  const seed: Skill[] = [
    { id: "s1", name: "Windows Server", category: "infrastructure", level: 95, sort: 1 },
    { id: "s2", name: "Active Directory", category: "infrastructure", level: 90, sort: 2 },
    { id: "s3", name: "Linux", category: "infrastructure", level: 85, sort: 3 },
    { id: "s4", name: "Networking (LAN/VPN/Firewall)", category: "infrastructure", level: 85, sort: 4 },
    { id: "s5", name: "TypeScript", category: "development", level: 80, sort: 5 },
    { id: "s6", name: "React / Next.js", category: "development", level: 75, sort: 6 },
    { id: "s7", name: "PHP", category: "development", level: 70, sort: 7 },
    { id: "s8", name: "Supabase / PostgreSQL", category: "development", level: 75, sort: 8 },
    { id: "s9", name: "Cloud Security", category: "security", level: 80, sort: 9 },
    { id: "s10", name: "Docker", category: "devops", level: 65, sort: 10 },
  ];
  if (!configured()) return seed;
  try {
    const { data, error } = await db().from("skills").select("id,name,category,level,sort_order").eq("published", true).is("deleted_at", null).order("sort_order");
    if (error || !data?.length) return seed;
    return data.map((r) => ({ id: r.id as string, name: r.name as string, category: (r.category as string) ?? "general", level: (r.level as number) ?? 50, sort: (r.sort_order as number) ?? 0 }));
  } catch { return seed; }
}

export async function getCertifications(): Promise<Certification[]> {
  "use cache"; cacheTag("content");
  // Trainings/learning from the owner CV (CONTENT.md).
  const seed: Certification[] = [
    { id: "c1", title: { en: "Programmable Logic Controller (PLC)", bn: "প্রোগ্রামেবল লজিক কন্ট্রোলার (PLC)" }, issuer: { en: "Engineering Staff College of Bangladesh", bn: "ইঞ্জিনিয়ারিং স্টাফ কলেজ অব বাংলাদেশ" }, year: "2015", href: "", sort: 1 },
    { id: "c2", title: { en: "Substation Construction, Maintenance & Troubleshooting", bn: "সাবস্টেশন নির্মাণ, রক্ষণাবেক্ষণ ও ট্রাবলশুটিং" }, issuer: { en: "Biswas Builders", bn: "বিশ্বাস বিল্ডার্স" }, year: "2014", href: "", sort: 2 },
    { id: "c3", title: { en: "Android App Development (seminar)", bn: "অ্যান্ড্রয়েড অ্যাপ ডেভেলপমেন্ট (সেমিনার)" }, issuer: { en: "Bangladesh Computer Council", bn: "বাংলাদেশ কম্পিউটার কাউন্সিল" }, year: "2018", href: "", sort: 3 },
    { id: "c4", title: { en: "BUET international conferences — electrical, control & computer engineering", bn: "বুয়েট আন্তর্জাতিক কনফারেন্স — ইলেকট্রিক্যাল, কন্ট্রোল ও কম্পিউটার ইঞ্জিনিয়ারিং" }, issuer: { en: "BUET", bn: "বুয়েট" }, year: "2018", href: "", sort: 4 },
  ];
  if (!configured()) return seed;
  try {
    const { data, error } = await db().from("certifications").select("id,title_en,title_bn,issuer_en,issuer_bn,year,href,sort_order").eq("published", true).is("deleted_at", null).order("sort_order");
    if (error || !data?.length) return [];
    return data.map((r) => ({ id: r.id as string, title: L(r.title_en, r.title_bn), issuer: L(r.issuer_en, r.issuer_bn), year: (r.year as string) ?? "", href: (r.href as string) ?? "", sort: (r.sort_order as number) ?? 0 }));
  } catch { return []; }
}

export async function getFAQ(): Promise<Faq[]> {
  "use cache"; cacheTag("content");
  const seed: Faq[] = [
    { id: "f1", q: { en: "What do you help businesses with?", bn: "আপনি ব্যবসায়িক প্রতিষ্ঠানকে কী কাজে সাহায্য করেন?" }, a: { en: "Windows Server and Active Directory environments, Linux servers, LAN/firewall/VPN design, cloud security hardening, backups and monitoring — plus full-stack web applications with AI assistance.", bn: "Windows Server ও Active Directory, Linux সার্ভার, LAN/ফায়ারওয়াল/VPN ডিজাইন, ক্লাউড সিকিউরিটি, ব্যাকআপ ও মনিটরিং — এবং AI সহায়তায় ফুল-স্ট্যাক ওয়েব অ্যাপ্লিকেশন।" }, sort: 1 },
    { id: "f2", q: { en: "Where are you based, and do you work remotely?", bn: "আপনি কোথায় অবস্থিত, এবং রিমোটলি কাজ করেন?" }, a: { en: "I am based in Dhaka, Bangladesh, and I work both on-site (Dhaka area) and remotely with clients anywhere.", bn: "আমি ঢাকা, বাংলাদেশে অবস্থিত; ঢাকায় অন-সাইট এবং যেকোনো জায়গা থেকে রিমোটলি কাজ করি।" }, sort: 2 },
    { id: "f3", q: { en: "Can I see something you have built that is live?", bn: "আপনার বানানো লাইভ কোনো কিছু দেখা যাবে?" }, a: { en: "Yes — Likhon Tools (likhontools.com) is a live production project. The case studies on this site list more work.", bn: "হ্যাঁ — Likhon Tools (likhontools.com) একটি লাইভ প্রোডাকশন প্রজেক্ট। এই সাইটের কেস স্টাডিগুলোতে আরও কাজ দেখুন।" }, sort: 3 },
    { id: "f4", q: { en: "How do we start working together?", bn: "কাজ শুরু করব কীভাবে?" }, a: { en: "Email engremran.it@gmail.com or use the contact form with a short brief — you will get a reply with next steps.", bn: "engremran.it@gmail.com-এ ইমেইল করুন বা সংক্ষিপ্ত বিবরণ নিয়ে যোগাযোগ ফর্ম ব্যবহার করুন — পরবর্তী ধাপসহ উত্তর পাবেন।" }, sort: 4 },
  ];
  if (!configured()) return seed;
  try {
    const { data, error } = await db().from("faqs").select("id,q_en,q_bn,a_en,a_bn,sort_order").eq("published", true).is("deleted_at", null).order("sort_order");
    if (error || !data?.length) return seed;
    return data.map((r) => ({ id: r.id as string, q: L(r.q_en, r.q_bn), a: L(r.a_en, r.a_bn), sort: (r.sort_order as number) ?? 0 }));
  } catch { return seed; }
}

export async function getStats(): Promise<Stat[]> {
  "use cache"; cacheTag("content");
  // Real figures from the owner CV (CONTENT.md) — no invented numbers.
  const seed: Stat[] = [
    { id: "st1", value: "13+", label: { en: "Years in engineering & IT (since 2013)", bn: "বছর প্রকৌশল ও আইটিতে (২০১৩ থেকে)" }, sort: 1 },
    { id: "st2", value: "7+", label: { en: "Years in the IT sector", bn: "বছর আইটি সেক্টরে" }, sort: 2 },
    { id: "st3", value: "5", label: { en: "Industries: media, power, retail, data, construction", bn: "খাত: মিডিয়া, পাওয়ার, রিটেইল, ডেটা, নির্মাণ" }, sort: 3 },
    { id: "st4", value: "B.Sc", label: { en: "Electrical & Electronic Engineering, 2014", bn: "ইলেকট্রিক্যাল অ্যান্ড ইলেকট্রনিক ইঞ্জিনিয়ারিং, ২০১৪" }, sort: 4 },
  ];
  if (!configured()) return seed;
  try {
    const { data, error } = await db().from("stats").select("id,value,label_en,label_bn,sort_order").eq("published", true).is("deleted_at", null).order("sort_order");
    if (error || !data?.length) return seed;
    return data.map((r) => ({ id: r.id as string, value: r.value as string, label: L(r.label_en, r.label_bn), sort: (r.sort_order as number) ?? 0 }));
  } catch { return seed; }
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  "use cache"; cacheTag("content");
  const seed: SocialLink[] = [
    { id: "sl1", platform: "github", url: "https://github.com/Emran-Hossain26", label: { en: "GitHub", bn: "গিটহাব" }, sort: 1 },
    { id: "sl2", platform: "linkedin", url: "https://bd.linkedin.com/in/mohammad-emran-hossain-69198b75", label: { en: "LinkedIn", bn: "লিঙ্কডইন" }, sort: 2 },
    { id: "sl3", platform: "facebook", url: "https://www.facebook.com/emran1997/", label: { en: "Facebook", bn: "ফেসবুক" }, sort: 3 },
  ];
  if (!configured()) return seed;
  try {
    const { data, error } = await db().from("social_links").select("id,platform,url,label_en,label_bn,sort_order").eq("published", true).is("deleted_at", null).order("sort_order");
    if (error || !data?.length) return seed;
    return data.map((r) => ({ id: r.id as string, platform: r.platform as string, url: r.url as string, label: L(r.label_en, r.label_bn), sort: (r.sort_order as number) ?? 0 }));
  } catch { return seed; }
}

export async function getContactInfo(): Promise<ContactInfo> {
  "use cache"; cacheTag("content");
  const seed: ContactInfo = { email: "engremran.it@gmail.com", phone: "+8801924437817", location: { en: "Dhaka, Bangladesh", bn: "ঢাকা, বাংলাদেশ" }, availability: { en: "Available for new projects & consultations", bn: "নতুন প্রজেক্ট ও কনসালটেশনের জন্য উন্মুক্ত" } };
  if (!configured()) return seed;
  try {
    const { data, error } = await db().from("contact_info").select("email,phone,location_en,location_bn,availability_en,availability_bn").eq("key", "main").maybeSingle();
    if (error || !data) return seed;
    return {
      email: (data.email as string) || seed.email,
      phone: (data.phone as string) || seed.phone,
      location: L(data.location_en, data.location_bn),
      availability: L(data.availability_en, data.availability_bn),
    };
  } catch { return seed; }
}

export async function getSections(): Promise<Section[]> {
  "use cache"; cacheTag("content");
  if (!configured()) return [];
  try {
    const { data, error } = await db().from("sections").select("key,sort_order,enabled,content").order("sort_order");
    if (error || !data) return [];
    return data.map((r) => ({ key: r.key as string, sort_order: (r.sort_order as number) ?? 0, enabled: (r.enabled as boolean) ?? true, content: (r.content as { en: Record<string, unknown>; bn: Record<string, unknown> }) ?? { en: {}, bn: {} } }));
  } catch { return []; }
}

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  "use cache"; cacheTag("content");
  if (!configured()) return {};
  try {
    const { data, error } = await db().from("feature_flags").select("key,enabled");
    if (error || !data) return {};
    const out: Record<string, boolean> = {};
    for (const r of data) out[r.key as string] = (r.enabled as boolean) ?? false;
    return out;
  } catch { return {}; }
}

export async function getThemePresets(): Promise<{ id: string; key: string; name: string; nameBn: string; tokens: Record<string, string>; enabled: boolean; isDefault: boolean; sort: number }[]> {
  "use cache"; cacheTag("content");
  const SEED = [
    { id: "light", key: "light", name: "Light", nameBn: "লাইট", tokens: { accent: "#2F6BFF", bg: "#F4F6FA", panel: "#fff", ink: "#0E1B2E", mute: "#5B6678", line: "#DCE1E9", radius: "14px" }, enabled: true, isDefault: true, sort: 1 },
    { id: "dark", key: "dark", name: "Dark", nameBn: "ডার্ক", tokens: { accent: "#5B8CFF", bg: "#0A1120", panel: "#111B30", ink: "#E8EEFB", mute: "#93A2BF", line: "#223050", radius: "14px" }, enabled: true, isDefault: false, sort: 2 },
    { id: "cyber", key: "cyber", name: "Cyber", nameBn: "সাইবার", tokens: { accent: "#2CFF6B", bg: "#050805", panel: "#0B120B", ink: "#CFFFD6", mute: "#6FA77A", line: "#16301A", radius: "4px" }, enabled: true, isDefault: false, sort: 3 },
    { id: "aurora", key: "aurora", name: "Aurora", nameBn: "অরোরা", tokens: { accent: "#9B7BFF", bg: "#120E2B", panel: "#1B1640", ink: "#F1ECFF", mute: "#B3A9DE", line: "#34296B", radius: "22px" }, enabled: true, isDefault: false, sort: 4 },
    { id: "warm", key: "warm", name: "Warm Paper", nameBn: "ওয়ার্ম পেপার", tokens: { accent: "#FFB020", bg: "#F3EFE6", panel: "#FBF7EE", ink: "#2D4147", mute: "#6F8A90", line: "#D4C9B0", radius: "22px" }, enabled: true, isDefault: false, sort: 5 },
    { id: "ocean", key: "ocean", name: "Ocean", nameBn: "ওশান", tokens: { accent: "#0E9AA7", bg: "#0A1929", panel: "#0F2744", ink: "#E0F0FF", mute: "#7BA8D4", line: "#1E3A5F", radius: "12px" }, enabled: true, isDefault: false, sort: 6 },
    { id: "sunset", key: "sunset", name: "Sunset", nameBn: "সানসেট", tokens: { accent: "#FF7A59", bg: "#1C0F1F", panel: "#2A1630", ink: "#FFEBDD", mute: "#D0A9B8", line: "#4A2A55", radius: "18px" }, enabled: true, isDefault: false, sort: 7 },
    { id: "forest", key: "forest", name: "Forest", nameBn: "ফরেস্ট", tokens: { accent: "#1F7A4A", bg: "#EEF3EC", panel: "#FFFFFF", ink: "#14261B", mute: "#4F6657", line: "#D3E0D3", radius: "12px" }, enabled: true, isDefault: false, sort: 8 },
    { id: "contrast", key: "contrast", name: "High Contrast", nameBn: "হাই কনট্রাস্ট", tokens: { accent: "#FFFF00", bg: "#000000", panel: "#000000", ink: "#FFFFFF", mute: "#E6E6E6", line: "#FFFFFF", radius: "0px" }, enabled: true, isDefault: false, sort: 9 },
  ];
  if (!configured()) return SEED;
  try {
    const { data, error } = await db().from("theme_presets").select("id,name_en,name_bn,is_default,is_enabled,colors,fonts,radius,shadows,sort_order").order("sort_order");
    if (error || !data?.length) return SEED;
    return data.map((r) => {
      const colors = (r.colors as Record<string, string>) ?? {};
      const tokens = { ...colors };
      if (r.radius && typeof r.radius === "object") {
        const rad = r.radius as Record<string, string>;
        if (rad.card) tokens.radius = rad.card;
      }
      return {
        id: r.id as string,
        key: (r.name_en as string).toLowerCase().replace(/s+/g, "-"),
        name: r.name_en as string,
        nameBn: r.name_bn as string,
        tokens,
        enabled: (r.is_enabled as boolean) ?? true,
        isDefault: (r.is_default as boolean) ?? false,
        sort: (r.sort_order as number) ?? 0,
      };
    });
  } catch {
    return SEED;
  }
}

export async function getThemeVisitorSwitch(): Promise<boolean> {
  "use cache"; cacheTag("content");
  if (!configured()) return true;
  try {
    const { data } = await db().from("site_settings").select("value").eq("key", "theme_visitor_switch").maybeSingle();
    const v = data?.value;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v === "true";
    return true;
  } catch {
    return true;
  }
}

export async function getMessagesInbox(): Promise<{ id: string; name: string; email: string; message: string; status: string; created_at: string }[]> {
  "use cache"; cacheTag("content");
  if (!configured()) return [];
  try {
    // Visitor messages are RLS-protected (no anon policies) — read through
    // the service role, exactly like the admin pages do.
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const { data, error } = await createServiceClient().from("messages").select("id,name,email,message,status,created_at").order("created_at", { ascending: false }).limit(50);
    if (error || !data) return [];
    return data.map((r) => ({ id: r.id as string, name: r.name as string, email: r.email as string, message: r.message as string, status: (r.status as string) ?? "new", created_at: r.created_at as string }));
  } catch { return []; }
}

// --- Stage 2: Blog enhancements (reading time, TOC, categories, tags, SEO, view counter) ---

export type BlogPost = {
  slug: string;
  /** Optional Bangla URL slug; empty falls back to `slug`. */
  bn_slug: string;
  title: Localized;
  body: Localized;
  meta: Localized;
  status: "draft" | "published" | "scheduled";
  scheduled_at: string | null;
  categories: string[];
  tags: string[];
  seo_title: Localized;
  seo_desc: Localized;
  og_image: string;
  cover_url: string;
  canonical: string;
  noindex: boolean;
  view_count: number;
  reading_time: number;
};

/** Locale-correct URL for a post: /bn/blog/<bn_slug> when available. */
export function blogPostHref(
  locale: Locale,
  post: Pick<BlogPost, "slug" | "bn_slug">,
): string {
  const s = locale === "bn" && post.bn_slug ? post.bn_slug : post.slug;
  return `/blog/${s}`;
}

export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function extractToc(markdown: string): { id: string; text: string; level: number }[] {
  const out: { id: string; text: string; level: number }[] = [];
  const lines = markdown.split(/\n/);
  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].replace(/[*_`]/g, "").trim();
    const id = text.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/g, "-").replace(/^-|-$/g, "");
    out.push({ id, text, level });
  }
  return out;
}

export async function getBlogPosts(opts?: { category?: string; tag?: string; search?: string }): Promise<BlogPost[]> {
  "use cache"; cacheTag("content"); cacheLife("blog");
  if (!configured()) {
    const { samplePosts } = await import("@/data/posts");
    return samplePosts.map((p) => ({
      slug: p.slug, bn_slug: "", title: p.title, body: p.body, meta: p.meta,
      status: "published" as const, scheduled_at: null, categories: [], tags: [],
      seo_title: { en: "", bn: "" }, seo_desc: { en: "", bn: "" }, og_image: "", cover_url: "", canonical: "", noindex: false, view_count: 0,
      reading_time: readingTimeMinutes(p.body.en + " " + p.body.bn),
    }));
  }
  try {
    const fetchPosts = async (select: string): Promise<Record<string, unknown>[] | null> => {
      let q = db().from("posts").select(select).order("created_at", { ascending: false });
      if (opts?.category) q = q.contains("categories", [opts.category]);
      if (opts?.tag) q = q.contains("tags", [opts.tag]);
      const { data, error } = await q;
      if (error) return null;
      return (data as unknown as Record<string, unknown>[]) ?? null;
    };
    // cover_url arrives with migration 20261110 — retry without it pre-migration.
    let data = await fetchPosts("slug,bn_slug,title_en,title_bn,body_en,body_bn,meta_en,meta_bn,status,scheduled_at,categories,tags,seo_title_en,seo_title_bn,seo_desc_en,seo_desc_bn,og_image,cover_url,canonical,noindex,view_count");
    if (!data) data = await fetchPosts("slug,bn_slug,title_en,title_bn,body_en,body_bn,meta_en,meta_bn,status,scheduled_at,categories,tags,seo_title_en,seo_title_bn,seo_desc_en,seo_desc_bn,og_image,canonical,noindex,view_count");
    if (!data?.length) {
      const { samplePosts } = await import("@/data/posts");
      return samplePosts.map((p) => ({
        slug: p.slug, bn_slug: "", title: p.title, body: p.body, meta: p.meta,
        status: "published" as const, scheduled_at: null, categories: [], tags: [],
        seo_title: { en: "", bn: "" }, seo_desc: { en: "", bn: "" }, og_image: "", cover_url: "", canonical: "", noindex: false, view_count: 0,
        reading_time: readingTimeMinutes(p.body.en + " " + p.body.bn),
      }));
    }
    let posts = data
      .filter((r) => {
        const status = (r.status as string) ?? "published";
        const sched = r.scheduled_at as string | null;
        // Scheduled posts become visible the moment their time arrives (the
        // read layer is time-aware so a daily Hobby-plan cron never delays a
        // launch by hours); the cron then flips the DB row durably.
        if (status === "scheduled") {
          return !!sched && new Date(sched) <= new Date();
        }
        if (status !== "published") return false;
        if (sched && new Date(sched) > new Date()) return false;
        return true;
      })
      .map((r) => {
        const body = L(r.body_en, r.body_bn);
        return {
          slug: r.slug as string,
          bn_slug: (r.bn_slug as string) ?? "",
          title: L(r.title_en, r.title_bn),
          body,
          meta: L(r.meta_en, r.meta_bn),
          status: ((r.status as string) ?? "published") as "draft" | "published" | "scheduled",
          scheduled_at: (r.scheduled_at as string) ?? null,
          categories: (r.categories as string[]) ?? [],
          tags: (r.tags as string[]) ?? [],
          seo_title: L(r.seo_title_en, r.seo_title_bn),
          seo_desc: L(r.seo_desc_en, r.seo_desc_bn),
          og_image: (r.og_image as string) ?? "",
          cover_url: (r.cover_url as string) ?? "",
          canonical: (r.canonical as string) ?? "",
          noindex: (r.noindex as boolean) ?? false,
          view_count: (r.view_count as number) ?? 0,
          reading_time: readingTimeMinutes(body.en + " " + body.bn),
        };
      });
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      posts = posts.filter((p) =>
        [p.title.en, p.title.bn, p.body.en, p.body.bn, p.meta.en, p.meta.bn]
          .join(" ").toLowerCase().includes(q),
      );
    }
    return posts;
  } catch {
    const { samplePosts } = await import("@/data/posts");
    return samplePosts.map((p) => ({
      slug: p.slug, bn_slug: "", title: p.title, body: p.body, meta: p.meta,
      status: "published" as const, scheduled_at: null, categories: [], tags: [],
      seo_title: { en: "", bn: "" }, seo_desc: { en: "", bn: "" }, og_image: "", cover_url: "", canonical: "", noindex: false, view_count: 0,
      reading_time: readingTimeMinutes(p.body.en + " " + p.body.bn),
    }));
  }
}

export async function getBlogPost(slug: string, locale: Locale = "en"): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find(
    (p) => p.slug === slug || (locale === "bn" && !!p.bn_slug && p.bn_slug === slug),
  );
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  const posts = await getBlogPosts();
  const current = posts.find((p) => p.slug === slug);
  if (!current) return [];
  const related = posts
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score:
        p.categories.filter((c) => current.categories.includes(c)).length * 2 +
        p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.post);
  if (related.length < limit) {
    const rest = posts.filter((p) => p.slug !== slug && !related.includes(p)).slice(0, limit - related.length);
    related.push(...rest);
  }
  return related;
}

export async function incrementPostViews(slug: string): Promise<void> {
  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const db = createServiceClient();
    const { data } = await db.from("posts").select("view_count").eq("slug", slug).maybeSingle();
    const next = ((data?.view_count as number) ?? 0) + 1;
    await db.from("posts").update({ view_count: next }).eq("slug", slug);
  } catch {}
}

// --- Redirects (301 from DB, cached) ------------------------------------

export type Redirect = { from_url: string; to_url: string; permanent: boolean };

export async function getRedirects(): Promise<Redirect[]> {
  "use cache"; cacheTag("content");
  if (!configured()) return [];
  try {
    const { data, error } = await db()
      .from("redirects")
      .select("from_url,to_url,permanent");
    if (error || !data) return [];
    return data.map((r) => ({
      from_url: r.from_url as string,
      to_url: r.to_url as string,
      permanent: (r.permanent as boolean) ?? true,
    }));
  } catch {
    return [];
  }
}

// --- Stage 3: SEO settings (global defaults, verification codes) ----------

export type SeoSettings = {
  title_template: string;
  default_description_en: string;
  default_description_bn: string;
  gsc_verification: string;
  bing_verification: string;
  analytics_id: string;
};

export async function getSeoSettings(): Promise<SeoSettings> {
  "use cache"; cacheTag("content");
  const seed: SeoSettings = {
    title_template: "%s | Md Emran Hossain",
    default_description_en: "Md Emran Hossain builds and secures servers, networks, cloud and web applications for businesses in Dhaka, Bangladesh.",
    default_description_bn: "মোঃ ইমরান হোসেন ঢাকা, বাংলাদেশে ব্যবসায়িক প্রতিষ্ঠানের জন্য সার্ভার, নেটওয়ার্ক, ক্লাউড ও ওয়েব অ্যাপ্লিকেশন তৈরি ও সুরক্ষিত করেন।",
    gsc_verification: "",
    bing_verification: "",
    analytics_id: "",
  };
  if (!configured()) return seed;
  try {
    const { data } = await db().from("site_settings").select("value").eq("key", "seo_settings").maybeSingle();
    const v = (data?.value ?? {}) as Partial<SeoSettings>;
    return { ...seed, ...v };
  } catch {
    return seed;
  }
}

// --- Per-page SEO ---------------------------------------------------------

export async function getPageSeo(
  path: string,
): Promise<{ title: Localized; description: Localized } | null> {
  "use cache";
  cacheTag("content");
  if (!configured()) return null;
  try {
    const { data, error } = await db()
      .from("page_seo")
      .select("path,lang,title,description")
      .eq("path", path);
    if (error || !data?.length) return null;
    const en = data.find((r) => r.lang === "en");
    const bn = data.find((r) => r.lang === "bn");
    if (!en && !bn) return null;
    return {
      title: L(en?.title, bn?.title),
      description: L(en?.description, bn?.description),
    };
  } catch {
    return null;
  }
}

// --- Stage 5: Effects Manager settings (site_settings: effects_settings) ---

export type EffectsSettings = {
  master: boolean;
  default_mode: "full" | "lite";
  touch_disable: boolean;
  intensity: "low" | "medium" | "high";
  override_reduced: boolean;
  /** Agent Cursors intro: swarm size + duration multiplier. */
  agentCursorCount: number;
  agentCursorSpeed: number;
  // cursor
  mascot: boolean; trail: boolean; ripple: boolean; magnetic: boolean;
  comet: boolean; fairy: boolean; rune: boolean; firefly: boolean;
  // animation
  tilt: boolean; parallax: boolean; scramble: boolean; counters: boolean;
  shimmer: boolean; cardGlow: boolean; sparkleBurst: boolean; floaters: boolean;
  // magical
  aurora: boolean; network: boolean; starField: boolean; nebula: boolean; sparkleField: boolean; swarm: boolean;
};

export const FX_DEFAULTS: EffectsSettings = {
  master: true,
  default_mode: "full",
  touch_disable: true,
  intensity: "medium",
  override_reduced: false,
  agentCursorCount: 12,
  agentCursorSpeed: 1.8,
  // per-effect defaults (all on)
  mascot: true, trail: true, ripple: true, magnetic: true, comet: true, fairy: true, rune: true, firefly: true,
  tilt: true, parallax: true, scramble: true, counters: true, shimmer: true, cardGlow: true, sparkleBurst: true, floaters: true,
  aurora: true, network: true, starField: true, nebula: true, sparkleField: true, swarm: true,
};

export async function getEffectsSettings(): Promise<EffectsSettings> {
  "use cache"; cacheTag("content");
  if (!configured()) return FX_DEFAULTS;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "effects_settings")
      .maybeSingle();
    return { ...FX_DEFAULTS, ...((data?.value ?? {}) as Partial<EffectsSettings>) };
  } catch {
    return FX_DEFAULTS;
  }
}

// --- Session 2: branding / footer / about / maintenance / admin profile ---
// Every helper returns null/false when the admin has not saved anything —
// components then fall back to the next-intl seed strings.

export type Branding = {
  brand_en: string;
  brand_bn: string;
  badge_url: string;
};

export async function getBranding(): Promise<Branding | null> {
  "use cache"; cacheTag("content");
  if (!configured()) return null;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "branding")
      .maybeSingle();
    const v = (data?.value ?? {}) as Partial<Branding>;
    const out: Branding = {
      brand_en: String(v.brand_en ?? "").trim(),
      brand_bn: String(v.brand_bn ?? "").trim(),
      badge_url: String(v.badge_url ?? "").trim(),
    };
    if (!out.brand_en && !out.brand_bn && !out.badge_url) return null;
    return out;
  } catch {
    return null;
  }
}

export async function getFooterText(): Promise<Localized | null> {
  "use cache"; cacheTag("content");
  if (!configured()) return null;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "footer_text")
      .maybeSingle();
    const v = (data?.value ?? {}) as Partial<Localized>;
    const en = String(v.en ?? "").trim();
    const bn = String(v.bn ?? "").trim();
    if (!en && !bn) return null;
    return { en, bn };
  } catch {
    return null;
  }
}

export async function getAboutTexts(): Promise<Localized | null> {
  "use cache"; cacheTag("content");
  if (!configured()) return null;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "about_texts")
      .maybeSingle();
    const v = (data?.value ?? {}) as Partial<Localized>;
    const en = String(v.en ?? "").trim();
    const bn = String(v.bn ?? "").trim();
    if (!en && !bn) return null;
    return { en, bn };
  } catch {
    return null;
  }
}

export async function getMaintenanceMode(): Promise<boolean> {
  "use cache"; cacheTag("content");
  if (!configured()) return false;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    return Boolean((data?.value as { enabled?: boolean } | null)?.enabled);
  } catch {
    return false;
  }
}

export type AdminProfile = {
  display_name: string;
  avatar_url: string;
};

// NOTE: admin_profile is read by the admin layout with a local "use cache"
// helper — importing this cms module there trips Next's prerender detector
// in dev (Date.now). getAdminProfile stays for any future consumer.

export async function getCvDownloads(): Promise<number> {
  "use cache"; cacheTag("content");
  if (!configured()) return 0;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "cv_downloads")
      .maybeSingle();
    const n = (data?.value as { count?: number } | null)?.count;
    return typeof n === "number" && Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function getNewsletterSettings(): Promise<{ enabled: boolean }> {
  "use cache"; cacheTag("content");
  if (!configured()) return { enabled: false };
  try {
    const { data } = await db()
      .from("site_settings")
      .select("value")
      .eq("key", "newsletter_settings")
      .maybeSingle();
    return { enabled: Boolean((data?.value as { enabled?: boolean } | null)?.enabled) };
  } catch {
    return { enabled: false };
  }
}

// --- Stage 6: enrichment modules -------------------------------------------
// One cached read for every module toggle (site_settings keys seeded by
// migration 20261113); list getters follow the usual seed-fallback shape.

export type NowItem = {
  id: string;
  kind: "working" | "learning" | "reading";
  text: Localized;
};

export type BookingSlot = {
  id: string;
  slot_date: string;
  slot_time: string;
  capacity: number;
  booked: number;
  note: string;
};

export type ModuleSettings = {
  skills: boolean;
  now: boolean;
  terminal: boolean;
  palette: boolean;
  services: boolean;
  quote: boolean;
  booking: boolean;
  github: boolean;
  githubUsername: string;
  countryBadge: boolean;
  speedInsights: boolean;
};

export const MODULE_DEFAULTS: ModuleSettings = {
  skills: true,
  now: true,
  terminal: true,
  palette: true,
  services: true,
  quote: true,
  booking: false,
  github: false,
  githubUsername: "",
  countryBadge: false,
  speedInsights: false,
};

export async function getModuleSettings(): Promise<ModuleSettings> {
  "use cache"; cacheTag("content");
  if (!configured()) return MODULE_DEFAULTS;
  try {
    const { data } = await db()
      .from("site_settings")
      .select("key,value")
      .in("key", ["skills_settings", "now_settings", "terminal_settings", "palette_settings", "services_settings", "booking_settings", "github_widget", "country_badge", "speed_insights"]);
    const map = new Map((data ?? []).map((r) => [r.key as string, r.value as Record<string, unknown>]));
    const flag = (k: string, dflt: boolean) => Boolean(map.get(k)?.enabled ?? dflt);
    return {
      skills: flag("skills_settings", true),
      now: flag("now_settings", true),
      terminal: flag("terminal_settings", true),
      palette: flag("palette_settings", true),
      services: flag("services_settings", true),
      quote: Boolean(map.get("services_settings")?.quote_enabled ?? true),
      booking: flag("booking_settings", false),
      github: flag("github_widget", false),
      githubUsername: String(map.get("github_widget")?.username ?? "").trim(),
      countryBadge: flag("country_badge", false),
      speedInsights: flag("speed_insights", false),
    };
  } catch {
    return MODULE_DEFAULTS;
  }
}

export async function getNowItems(): Promise<NowItem[]> {
  "use cache"; cacheTag("content");
  if (!configured()) return [];
  try {
    const { data, error } = await db()
      .from("now_items")
      .select("id,kind,text_en,text_bn")
      .eq("published", true)
      .order("sort");
    if (error || !data?.length) return [];
    return data.map((r) => ({
      id: r.id as string,
      kind: ((r.kind as string) || "working") as NowItem["kind"],
      text: L(r.text_en, r.text_bn),
    }));
  } catch {
    return [];
  }
}

export async function getBookingSlots(): Promise<BookingSlot[]> {
  "use cache"; cacheTag("content");
  if (!configured()) return [];
  try {
    const { data, error } = await db()
      .from("booking_slots")
      .select("id,slot_date,slot_time,capacity,booked,note")
      .eq("published", true)
      .order("slot_date")
      .order("slot_time");
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as string,
      slot_date: r.slot_date as string,
      slot_time: (r.slot_time as string) ?? "",
      capacity: (r.capacity as number) ?? 1,
      booked: (r.booked as number) ?? 0,
      note: (r.note as string) ?? "",
    }));
  } catch {
    return [];
  }
}
