import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

export type SocialComment = {
  id: string;
  parent_id: string | null;
  name: string;
  body: string;
  created_at: string;
  likes: number;
  liked: boolean;
};

export type Social = {
  likes: number;
  liked: boolean;
  comments: SocialComment[];
};

export const SLUG_RE = /^[a-z0-9-]{1,120}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const VOTER_COOKIE = "bv";

/** Likes + approved comments for one post. `voter` = the visitor's cookie id. */
export async function getSocial(slug: string, voter: string | null): Promise<Social> {
  const db = createServiceClient();
  const { data: rows } = await db
    .from("blog_comments")
    .select("id,parent_id,name,body,created_at")
    .eq("post_slug", slug)
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(500);
  const comments = (rows ?? []) as Omit<SocialComment, "likes" | "liked">[];
  const targets = ["post:" + slug, ...comments.map((c) => "comment:" + c.id)];
  const { data: likeRows } = await db
    .from("blog_likes")
    .select("target,voter")
    .in("target", targets)
    .limit(10000);
  const count = new Map<string, number>();
  const mine = new Set<string>();
  for (const l of (likeRows ?? []) as { target: string; voter: string }[]) {
    count.set(l.target, (count.get(l.target) ?? 0) + 1);
    if (voter && l.voter === voter) mine.add(l.target);
  }
  return {
    likes: count.get("post:" + slug) ?? 0,
    liked: mine.has("post:" + slug),
    comments: comments.map((c) => ({
      ...c,
      likes: count.get("comment:" + c.id) ?? 0,
      liked: mine.has("comment:" + c.id),
    })),
  };
}
