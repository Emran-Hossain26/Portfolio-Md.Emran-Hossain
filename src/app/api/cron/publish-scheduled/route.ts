import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

// Next.js 16 doc excerpt (node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md):
//   "Call `revalidateTag` in a Server Action or Route Handler."
//   "revalidateTag('user', 'max') // Recommended: stale-while-revalidate"
//   "The second argument sets how long stale content can be served while fresh
//    content generates in the background."
// Route Handlers require the cacheLife profile as the second argument.

/**
 * Vercel Cron: flips scheduled posts to published once scheduled_at <= now(),
 * then revalidates the blog list, post pages, sitemap and RSS.
 *
 * Secured by CRON_SECRET (Vercel injects it as Authorization: Bearer ...).
 * vercel.json schedules this daily (Hobby plan allows only daily crons);
 * visitors still see due scheduled posts within the blog cacheLife window
 * because getBlogPosts() is time-aware. On Pro, tighten the schedule in
 * vercel.json to every 15 minutes ("star-slash-15 star star star star").
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let published = 0;
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("posts")
      .select("slug")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString());
    const slugs = (data ?? []).map((r) => r.slug as string);
    if (slugs.length) {
      await db
        .from("posts")
        .update({ status: "published", published: true })
        .in("slug", slugs)
        .eq("status", "scheduled");
      published = slugs.length;
    }
    // Revalidate content tag (blog list, post pages, sitemap, RSS all tagged "content").
    // Next.js 16 requires the cacheLife profile as the second argument.
    revalidateTag("content", "max");
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, published });
}