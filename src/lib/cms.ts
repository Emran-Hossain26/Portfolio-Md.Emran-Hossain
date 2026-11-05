import "server-only";
import { cacheTag, cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Project } from "@/data/projects";
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

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheTag("content");
  if (!configured()) return (await import("@/data/projects")).projects;
  try {
    const { data, error } = await db()
      .from("projects")
      .select("slug,title_en,title_bn,desc_en,desc_bn,tags,href,og_image")
      .eq("published", true)
      .order("sort");
    if (error || !data?.length) {
      return (await import("@/data/projects")).projects;
    }
    return data.map((row) => ({
      slug: row.slug as string,
      title: L(row.title_en, row.title_bn),
      desc: L(row.desc_en, row.desc_bn),
      tags: (row.tags as string[]) ?? [],
      href: (row.href as string) || undefined,
      og_image: (row.og_image as string) || undefined,
    }));
  } catch {
    return (await import("@/data/projects")).projects;
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
      .select("slug,title_en,title_bn,body_en,body_bn,meta_en,meta_bn")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error || !data?.length) {
      return (await import("@/data/posts")).samplePosts;
    }
    return data.map((row) => ({
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
      quote: L(row.quote_en, row.quote_bn),
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
    const v = data.value as {
      en: { heading: string; intro: string };
      bn: { heading: string; intro: string };
    };
    return {
      heading: L(v.en?.heading, v.bn?.heading),
      intro: L(v.en?.intro, v.bn?.intro),
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

export type Service = { id: string; title: Localized; desc: Localized; icon: string; sort: number };
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
      id: `seed-${i}`, title: e.title, desc: e.desc, icon: "", sort: i + 1,
    }));
  }
  try {
    const { data, error } = await db().from("services").select("id,title_en,title_bn,desc_en,desc_bn,icon,sort_order").eq("published", true).is("deleted_at", null).order("sort_order");
    if (error || !data?.length) {
      const { expertiseItems } = await import("@/data/expertise");
      return expertiseItems.map((e, i) => ({ id: `seed-${i}`, title: e.title, desc: e.desc, icon: "", sort: i + 1 }));
    }
    return data.map((r) => ({
      id: r.id as string,
      title: L(r.title_en, r.title_bn),
      desc: L(r.desc_en, r.desc_bn),
      icon: (r.icon as string) ?? "",
      sort: (r.sort_order as number) ?? 0,
    }));
  } catch {
    const { expertiseItems } = await import("@/data/expertise");
    return expertiseItems.map((e, i) => ({ id: `seed-${i}`, title: e.title, desc: e.desc, icon: "", sort: i + 1 }));
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
  if (!configured()) return [];
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
  const seed: Stat[] = [
    { id: "st1", value: "5+", label: { en: "Years with servers & networks", bn: "বছর সার্ভার ও নেটওয়ার্কে" }, sort: 1 },
    { id: "st2", value: "20+", label: { en: "Systems administered", bn: "সিস্টেম অ্যাডমিনিস্টার করা" }, sort: 2 },
    { id: "st3", value: "10+", label: { en: "Projects delivered", bn: "প্রজেক্ট সম্পন্ন" }, sort: 3 },
    { id: "st4", value: "24/7", label: { en: "Monitoring mindset", bn: "মনিটরিং মাইন্ডসেট" }, sort: 4 },
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
    const { data, error } = await db().from("messages").select("id,name,email,message,status,created_at").order("created_at", { ascending: false }).limit(50);
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
      seo_title: { en: "", bn: "" }, seo_desc: { en: "", bn: "" }, og_image: "", canonical: "", noindex: false, view_count: 0,
      reading_time: readingTimeMinutes(p.body.en + " " + p.body.bn),
    }));
  }
  try {
    let q = db().from("posts").select("slug,bn_slug,title_en,title_bn,body_en,body_bn,meta_en,meta_bn,status,scheduled_at,categories,tags,seo_title_en,seo_title_bn,seo_desc_en,seo_desc_bn,og_image,canonical,noindex,view_count").order("created_at", { ascending: false });
    if (opts?.category) q = q.contains("categories", [opts.category]);
    if (opts?.tag) q = q.contains("tags", [opts.tag]);
    const { data, error } = await q;
    if (error || !data?.length) {
      const { samplePosts } = await import("@/data/posts");
      return samplePosts.map((p) => ({
        slug: p.slug, bn_slug: "", title: p.title, body: p.body, meta: p.meta,
        status: "published" as const, scheduled_at: null, categories: [], tags: [],
        seo_title: { en: "", bn: "" }, seo_desc: { en: "", bn: "" }, og_image: "", canonical: "", noindex: false, view_count: 0,
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
      seo_title: { en: "", bn: "" }, seo_desc: { en: "", bn: "" }, og_image: "", canonical: "", noindex: false, view_count: 0,
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
  network: boolean;
  trail: boolean;
  ripple: boolean;
  magnetic: boolean;
  tilt: boolean;
  mascot: boolean;
  aurora: boolean;
  parallax: boolean;
  scramble: boolean;
  counters: boolean;
  /** First-visit default for new visitors: Full or Lite (lite = off on touch/slow). */
  default_mode: 'full' | 'lite';
  /** Disable heavy effects (cursor group) on touch/mobile. Default ON. */
  touch_disable: boolean;
  /** Scales particle counts and glow strength. */
  intensity: 'low' | 'medium' | 'high';
};

export const FX_DEFAULTS: EffectsSettings = {
  master: true,
  network: true,
  trail: true,
  ripple: true,
  magnetic: true,
  tilt: true,
  mascot: true,
  aurora: true,
  parallax: true,
  scramble: true,
  counters: true,
  default_mode: 'full',
  touch_disable: true,
  intensity: 'medium',
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
