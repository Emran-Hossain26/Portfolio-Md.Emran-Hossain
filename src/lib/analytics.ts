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
