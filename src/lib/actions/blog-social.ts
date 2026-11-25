"use server";

import { cookies, headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { sha256 } from "@/lib/security";
import { turnstileConfigured, verifyTurnstile } from "@/lib/turnstile";
import { SLUG_RE, UUID_RE, VOTER_COOKIE } from "@/lib/blog-social";

/**
 * Public blog engagement: likes (toggle) and comments with one level of
 * replies. Comments are stored as "pending" and only appear after the admin
 * approves them (/admin/comments). Anti-abuse: honeypot, minimum fill time,
 * per-IP rate limits, link limit, optional Turnstile when configured.
 */

export type CommentResult = {
  ok: boolean;
  error?: "validation" | "rate_limited" | "turnstile" | "unavailable" | "not_found";
};
export type LikeResult = { ok: boolean; liked?: boolean; count?: number; error?: string };

const rateMap = new Map<string, { count: number; reset: number }>();
function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const e = rateMap.get(key);
  if (!e || e.reset < now) {
    rateMap.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  e.count += 1;
  return e.count > limit;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

async function voterId(create: boolean): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(VOTER_COOKIE)?.value;
  if (existing && UUID_RE.test(existing)) return existing;
  if (!create) return null;
  const id = randomUUID();
  jar.set(VOTER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}

const TARGET_RE = /^(post:[a-z0-9-]{1,120}|comment:[0-9a-f-]{36})$/;

export async function toggleLikeAction(target: string): Promise<LikeResult> {
  if (!TARGET_RE.test(target)) return { ok: false, error: "validation" };
  if (rateLimited("lk:" + (await clientIp()), 60, 60 * 60 * 1000)) {
    return { ok: false, error: "rate_limited" };
  }
  try {
    const db = createServiceClient();
    if (target.startsWith("comment:")) {
      const id = target.slice(8);
      if (!UUID_RE.test(id)) return { ok: false, error: "validation" };
      const { data } = await db.from("blog_comments").select("id").eq("id", id).eq("status", "approved").maybeSingle();
      if (!data) return { ok: false, error: "not_found" };
    } else {
      const { data } = await db.from("posts").select("slug").eq("slug", target.slice(5)).eq("status", "published").maybeSingle();
      if (!data) return { ok: false, error: "not_found" };
    }
    const voter = (await voterId(true))!;
    const { data: existing } = await db
      .from("blog_likes")
      .select("id")
      .eq("target", target)
      .eq("voter", voter)
      .maybeSingle();
    let liked: boolean;
    if (existing) {
      await db.from("blog_likes").delete().eq("id", (existing as { id: number }).id);
      liked = false;
    } else {
      const { error } = await db.from("blog_likes").insert({ target, voter });
      // 23505 = double click race: it is already liked.
      if (error && (error as { code?: string }).code !== "23505") return { ok: false, error: "unavailable" };
      liked = true;
    }
    const { count } = await db.from("blog_likes").select("id", { count: "exact", head: true }).eq("target", target);
    return { ok: true, liked, count: count ?? 0 };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

const schema = z.object({
  slug: z.string().regex(SLUG_RE),
  parent_id: z.string().regex(UUID_RE).optional(),
  name: z.string().trim().min(1).max(80),
  body: z.string().trim().min(2).max(2000),
});

export async function submitCommentAction(_prev: CommentResult, formData: FormData): Promise<CommentResult> {
  // Honeypot: only bots fill it. Pretend success.
  if (String(formData.get("website") ?? "") !== "") return { ok: true };
  // Humans need more than ~3 s to write a comment.
  const t = Number(formData.get("t") ?? 0);
  if (!t || Date.now() - t < 3000) return { ok: false, error: "validation" };

  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    parent_id: String(formData.get("parent_id") ?? "") || undefined,
    name: formData.get("name"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, error: "validation" };
  const { slug, parent_id, name, body } = parsed.data;
  if ((body.match(/https?:\/\//gi) ?? []).length > 2) return { ok: false, error: "validation" };

  const ip = await clientIp();
  if (turnstileConfigured()) {
    const v = await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip);
    if (!v.ok) return { ok: false, error: "turnstile" };
  }
  if (rateLimited("cm:" + ip, 5, 60 * 60 * 1000) || rateLimited("cmd:" + ip, 20, 24 * 60 * 60 * 1000)) {
    return { ok: false, error: "rate_limited" };
  }

  try {
    const db = createServiceClient();
    const { data: post } = await db.from("posts").select("slug").eq("slug", slug).eq("status", "published").maybeSingle();
    if (!post) return { ok: false, error: "not_found" };
    if (parent_id) {
      // Replies are one level deep: the parent must be an approved top-level comment on this post.
      const { data: parent } = await db
        .from("blog_comments")
        .select("id")
        .eq("id", parent_id)
        .eq("post_slug", slug)
        .eq("status", "approved")
        .is("parent_id", null)
        .maybeSingle();
      if (!parent) return { ok: false, error: "not_found" };
    }
    const { error } = await db.from("blog_comments").insert({
      post_slug: slug,
      parent_id: parent_id ?? null,
      name,
      body,
      status: "pending",
      ip_hash: sha256(ip),
    });
    if (error) return { ok: false, error: "unavailable" };
    return { ok: true };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}
