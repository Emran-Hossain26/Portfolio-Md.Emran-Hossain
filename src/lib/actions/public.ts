"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendEmail, emailHtml, escapeHtml } from "@/lib/email";

/**
 * Public (visitor-facing) server actions: newsletter subscribe and the
 * testimonial submit form (MISSING-TASKS A3/A13). Both are rate limited
 * per IP in memory (same per-instance trade-off as /api/views), use a
 * honeypot field for bots, and write through the service client because
 * the corresponding tables have no anon-write policies.
 */

export type PublicActionResult = {
  ok: boolean;
  error?: "rate_limited" | "validation" | "unavailable" | "server";
};

const rateMap = new Map<string, { count: number; reset: number }>();

function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || entry.reset < now) {
    rateMap.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribeNewsletterAction(
  _prev: PublicActionResult,
  formData: FormData,
): Promise<PublicActionResult> {
  // Honeypot: hidden field, only bots fill it. Pretend success.
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "en") === "bn" ? "bn" : "en";
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return { ok: false, error: "validation" };
  }
  if (rateLimited("nl:" + (await clientIp()), 5, 60 * 60 * 1000)) {
    return { ok: false, error: "rate_limited" };
  }

  try {
    const db = createServiceClient();
    const { data: existing } = await db
      .from("newsletter_subscribers")
      .select("id,status")
      .ilike("email", email)
      .maybeSingle();
    if (existing) {
      if ((existing as { status?: string }).status === "unsubscribed") {
        await db
          .from("newsletter_subscribers")
          .update({ status: "active" })
          .eq("id", (existing as { id: string }).id);
      }
      return { ok: true };
    }
    const { error } = await db.from("newsletter_subscribers").insert({ email, locale });
    if (error) {
      // Unique-violation race (same email twice in flight) → already in.
      if ((error as { code?: string }).code === "23505") return { ok: true };
      return { ok: false, error: "unavailable" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export async function submitTestimonialAction(
  _prev: PublicActionResult,
  formData: FormData,
): Promise<PublicActionResult> {
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const rating = Math.min(5, Math.max(1, Math.trunc(Number(formData.get("rating") ?? 5)) || 5));

  if (!name || name.length > 120 || company.length > 160) {
    return { ok: false, error: "validation" };
  }
  if (quote.length < 20 || quote.length > 2000) {
    return { ok: false, error: "validation" };
  }
  if (rateLimited("tm:" + (await clientIp()), 5, 60 * 60 * 1000)) {
    return { ok: false, error: "rate_limited" };
  }

  try {
    const db = createServiceClient();
    let { error } = await db.from("testimonials").insert({
      name,
      company,
      quote_en: quote,
      quote_bn: "",
      rating,
      status: "pending",
      source: "public",
    });
    if (error) {
      // Pre-migration fallback: rating/source columns may not exist yet.
      ({ error } = await db.from("testimonials").insert({
        name,
        company,
        quote_en: quote,
        quote_bn: "",
        status: "pending",
      }));
    }
    if (error) return { ok: false, error: "unavailable" };

    // Best-effort admin alert — silently skipped without RESEND_API_KEY.
    const to = process.env.ADMIN_EMAIL;
    if (to) {
      await sendEmail({
        to,
        subject: "New testimonial awaiting approval",
        html: emailHtml(
          "New testimonial awaiting approval",
          `<p><b>${escapeHtml(name)}</b>${
            company ? ` — ${escapeHtml(company)}` : ""
          } rated ${rating}/5:</p><blockquote>${escapeHtml(quote)}</blockquote>
           <p>Approve or hide it in the admin panel → <b>Reviews</b>.</p>`,
        ),
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
