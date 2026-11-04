import "server-only";
import { cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Project } from "@/data/projects";
import type { Post } from "@/data/posts";
import type { Localized } from "@/data/types";

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
      .select("slug,title_en,title_bn,desc_en,desc_bn,tags,href")
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
