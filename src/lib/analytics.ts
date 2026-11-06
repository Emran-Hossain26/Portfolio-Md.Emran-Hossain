import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * First-party analytics readers for /admin/analytics (MISSING-TASKS A8).
 * All aggregation happens in SQL (public.analytics_* views, created by
 * migration 20261110) — raw rows are never loaded. Every reader degrades
 * to empty/zero when the views do not exist yet (pre-migration) so the
 * admin page always renders. No "use cache": admin pages are dynamic and
 * the numbers should be live.
 */

export type DailyPoint = { day: string; visitors: number; views: number };
export type CountRow = { label: string; visitors: number; views?: number };

function sinceDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/** Daily visitors/views for the last `days` days, zero-filled. */
export async function getDaily(days = 30): Promise<DailyPoint[]> {
  try {
    const { data, error } = await createServiceClient()
      .from("analytics_daily")
      .select("day,visitors,views")
      .gte("day", sinceDate(days));
    if (error || !data) return [];
    const map = new Map<string, { visitors: number; views: number }>();
    for (const r of data) {
      map.set(String(r.day).slice(0, 10), {
        visitors: (r.visitors as number) ?? 0,
        views: (r.views as number) ?? 0,
      });
    }
    const out: DailyPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      const hit = map.get(key);
      out.push({ day: key, visitors: hit?.visitors ?? 0, views: hit?.views ?? 0 });
    }
    return out;
  } catch {
    return [];
  }
}

export type Summary = { visitors: number; views: number };

export async function getSummary(days = 30): Promise<Summary> {
  const daily = await getDaily(days);
  return daily.reduce<Summary>(
    (acc, p) => ({ visitors: acc.visitors + p.visitors, views: acc.views + p.views }),
    { visitors: 0, views: 0 },
  );
}

export async function getTopPages(): Promise<CountRow[]> {
  try {
    const { data, error } = await createServiceClient()
      .from("analytics_top_pages")
      .select("page_path,visitors,views")
      .limit(20);
    if (error || !data) return [];
    return (data as unknown as { page_path: string; visitors: number; views: number }[])
      .map((r) => ({
        label: String(r.page_path ?? "Unknown"),
        visitors: r.visitors ?? 0,
        views: r.views ?? 0,
      }))
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  } catch {
    return [];
  }
}

export async function getReferrers(): Promise<CountRow[]> {
  try {
    const { data, error } = await createServiceClient()
      .from("analytics_referrers")
      .select("referrer,visitors")
      .limit(20);
    if (error || !data) return [];
    return (data as unknown as { referrer: string; visitors: number }[])
      .map((r) => ({ label: String(r.referrer ?? "Unknown"), visitors: r.visitors ?? 0 }))
      .sort((a, b) => b.visitors - a.visitors);
  } catch {
    return [];
  }
}

export async function getCountries(): Promise<CountRow[]> {
  try {
    const { data, error } = await createServiceClient()
      .from("analytics_countries")
      .select("country,visitors")
      .limit(20);
    if (error || !data) return [];
    return data
      .map((r) => ({ label: String(r.country ?? "Unknown"), visitors: (r.visitors as number) ?? 0 }))
      .sort((a, b) => b.visitors - a.visitors);
  } catch {
    return [];
  }
}

export async function getDevices(): Promise<CountRow[]> {
  try {
    const { data, error } = await createServiceClient()
      .from("analytics_devices")
      .select("device_type,visitors");
    if (error || !data) return [];
    return data
      .map((r) => ({ label: String(r.device_type ?? "Unknown"), visitors: (r.visitors as number) ?? 0 }))
      .sort((a, b) => b.visitors - a.visitors);
  } catch {
    return [];
  }
}

/** Mockup slide "Overview" → "Visitor choices": effects/theme/locale/device mix. */
export type VisitorChoices = {
  effectsOn: number; // % of views with effects on
  darkThemes: number; // % of views on non-light themes
  bangla: number; // % of views on /bn paths
  mobile: number; // % of views on mobile/tablet
  total: number;
};

const DARK_THEMES = new Set(["dark", "cyber", "aurora", "ocean", "sunset", "forest", "contrast"]);

export async function getVisitorChoices(): Promise<VisitorChoices> {
  const empty = { effectsOn: 0, darkThemes: 0, bangla: 0, mobile: 0, total: 0 };
  try {
    const { data, error } = await createServiceClient()
      .from("visitor_events")
      .select("theme,effects_on,device_type,page_path")
      .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString())
      .limit(5000);
    if (error || !data?.length) return empty;
    let effects = 0, dark = 0, bn = 0, mobile = 0;
    for (const e of data as { theme: string | null; effects_on: boolean | null; device_type: string | null; page_path: string }[]) {
      if (e.effects_on === true) effects++;
      const th = (e.theme ?? "").toLowerCase();
      if (th && DARK_THEMES.has(th)) dark++;
      if ((e.page_path ?? "").startsWith("/bn")) bn++;
      if (e.device_type === "mobile" || e.device_type === "tablet") mobile++;
    }
    const total = data.length;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return {
      effectsOn: pct(effects),
      darkThemes: pct(dark),
      bangla: pct(bn),
      mobile: pct(mobile),
      total,
    };
  } catch {
    return empty;
  }
}
