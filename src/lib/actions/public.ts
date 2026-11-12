"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { verifyTurnstile } from "@/lib/turnstile";
import { updateTag } from "next/cache";
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
  error?: "rate_limited" | "validation" | "unavailable" | "server" | "taken" | "turnstile";
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

// Stage 6 item 6 — zod input schemas for every public form.
const nameSchema = z.string().trim().min(1).max(120);
const emailSchema = z.string().trim().email().max(200);
const messageSchema = z.string().trim().min(10).max(5000);
const quoteSchema = z.string().trim().min(20).max(2000);

/** Turnstile gate (item 4): server-verified token; honeypot stays too. */
async function gateTurnstile(formData: FormData): Promise<PublicActionResult | null> {
  const ip = await clientIp();
  const verdict = await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip);
  if (!verdict.ok) return { ok: false, error: "turnstile" };
  return null;
}


export async function subscribeNewsletterAction(
  _prev: PublicActionResult,
  formData: FormData,
): Promise<PublicActionResult> {
  // Honeypot: hidden field, only bots fill it. Pretend success.
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "en") === "bn" ? "bn" : "en";
  if (!emailSchema.safeParse(email).success) {
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

  const gate = await gateTurnstile(formData);
  if (gate) return gate;

  const nameParsed = nameSchema.safeParse(formData.get("name"));
  const quoteParsed = quoteSchema.safeParse(formData.get("quote"));
  const company = String(formData.get("company") ?? "").trim().slice(0, 160);
  const rating = Math.min(5, Math.max(1, Math.trunc(Number(formData.get("rating") ?? 5)) || 5));
  if (!nameParsed.success || !quoteParsed.success) {
    return { ok: false, error: "validation" };
  }
  const name = nameParsed.data;
  const quote = quoteParsed.data;
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
    updateTag("content");

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

/**
 * Stage 6 #10 — the real contact form. Writes to the same `messages` table
 * the admin inbox reads; honeypot field is "company" (the form shipped with
 * it). Rate limited per IP; admins get an email alert when Resend is set.
 */
export async function submitContactAction(
  _prev: PublicActionResult,
  formData: FormData,
): Promise<PublicActionResult> {
  if (
    String(formData.get("website") ?? "") !== "" ||
    String(formData.get("company") ?? "") !== ""
  ) {
    return { ok: true };
  }

  const gate = await gateTurnstile(formData);
  if (gate) return gate;

  const parsed = nameSchema.safeParse(formData.get("name"));
  const emailParsed = emailSchema.safeParse(formData.get("email"));
  const messageParsed = messageSchema.safeParse(formData.get("message"));
  if (!parsed.success || !emailParsed.success || !messageParsed.success) {
    return { ok: false, error: "validation" };
  }
  const name = parsed.data;
  const email = emailParsed.data;
  const message = messageParsed.data;
  if (rateLimited("ct:" + (await clientIp()), 5, 60 * 60 * 1000)) {
    return { ok: false, error: "rate_limited" };
  }

  try {
    const db = createServiceClient();
    const { error } = await db.from("messages").insert({
      name,
      email,
      subject: "",
      message,
      status: "new",
    });
    if (error) return { ok: false, error: "unavailable" };
    updateTag("content");

    const to = process.env.ADMIN_EMAIL;
    if (to) {
      await sendEmail({
        to,
        subject: `New contact message from ${name}`,
        replyTo: email,
        html: emailHtml(
          "New contact message",
          `<p><b>${escapeHtml(name)}</b> (${escapeHtml(email)}) wrote:</p>
           <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>
           <p>Reply from the admin inbox → <b>Inbox</b>.</p>`,
        ),
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

/**
 * Stage 6 #8 — "Request a quote" from the /services page. Lands in the
 * admin inbox as a message with a "Quote request" subject so it shares the
 * existing status/quick-reply flow.
 */
export async function submitQuoteAction(
  _prev: PublicActionResult,
  formData: FormData,
): Promise<PublicActionResult> {
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  const gate = await gateTurnstile(formData);
  if (gate) return gate;

  const nameParsed = nameSchema.safeParse(formData.get("name"));
  const emailParsed = emailSchema.safeParse(formData.get("email"));
  const detailsParsed = messageSchema.safeParse(formData.get("details"));
  if (!nameParsed.success || !emailParsed.success || !detailsParsed.success) {
    return { ok: false, error: "validation" };
  }
  const name = nameParsed.data;
  const email = emailParsed.data;
  const budget = String(formData.get("budget") ?? "").trim().slice(0, 80);
  const details = detailsParsed.data;
  if (rateLimited("qt:" + (await clientIp()), 5, 60 * 60 * 1000)) {
    return { ok: false, error: "rate_limited" };
  }

  try {
    const db = createServiceClient();
    const subject = `Quote request${budget ? ` — budget: ${budget}` : ""}`;
    const { error } = await db.from("messages").insert({
      name,
      email,
      subject,
      message: details,
      status: "new",
    });
    if (error) return { ok: false, error: "unavailable" };
    updateTag("content");

    const to = process.env.ADMIN_EMAIL;
    if (to) {
      await sendEmail({
        to,
        replyTo: email,
        subject,
        html: emailHtml(
          "New quote request",
          `<p><b>${escapeHtml(name)}</b> (${escapeHtml(email)})${budget ? ` — budget: ${escapeHtml(budget)}` : ""}:</p>
           <p>${escapeHtml(details).replaceAll("\n", "<br/>")}</p>`,
        ),
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

/**
 * Stage 6 #9 — consultation booking against a published slot with spare
 * capacity. The booked counter is incremented conditionally (only when
 * booked < capacity) so parallel requests cannot overbook.
 */
export async function submitBookingAction(
  _prev: PublicActionResult,
  formData: FormData,
): Promise<PublicActionResult> {
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  const gate = await gateTurnstile(formData);
  if (gate) return gate;

  const slotId = String(formData.get("slot_id") ?? "").trim();
  const nameParsed = nameSchema.safeParse(formData.get("name"));
  const emailParsed = emailSchema.safeParse(formData.get("email"));
  if (!slotId || !nameParsed.success || !emailParsed.success) {
    return { ok: false, error: "validation" };
  }
  const name = nameParsed.data;
  const email = emailParsed.data;
  const topic = String(formData.get("topic") ?? "").trim();
  if (topic.length < 5 || topic.length > 1000) return { ok: false, error: "validation" };
  if (rateLimited("bk:" + (await clientIp()), 5, 60 * 60 * 1000)) {
    return { ok: false, error: "rate_limited" };
  }

  try {
    const db = createServiceClient();
    const { data: slot } = await db
      .from("booking_slots")
      .select("id,slot_date,slot_time,capacity,booked,published")
      .eq("id", slotId)
      .maybeSingle();
    const s = slot as
      | { id: string; slot_date: string; slot_time: string; capacity: number; booked: number; published: boolean }
      | null;
    if (!s || !s.published) return { ok: false, error: "validation" };
    if (s.booked >= s.capacity) return { ok: false, error: "taken" };

    // Conditional increment: only books when the slot still has room.
    const { data: claimed, error: claimErr } = await db
      .from("booking_slots")
      .update({ booked: s.booked + 1 })
      .eq("id", s.id)
      .eq("booked", s.booked)
      .select("id");
    if (claimErr || !claimed?.length) return { ok: false, error: "taken" };

    const subject = `Booking: ${s.slot_date} ${s.slot_time}`.trim();
    const { error } = await db.from("messages").insert({
      name,
      email,
      subject,
      message: topic,
      status: "new",
    });
    if (error) return { ok: false, error: "unavailable" };
    updateTag("content");

    // Confirmation to the visitor + alert to the admin (no-op without key).
    const from = process.env.ADMIN_EMAIL;
    const when = `${s.slot_date} ${s.slot_time}`.trim();
    await sendEmail({
      to: email,
      subject: `Consultation booked — ${when}`,
      html: emailHtml(
        "Your consultation is booked",
        `<p>Hi ${escapeHtml(name)},</p><p>Your session is scheduled for <b>${escapeHtml(when)}</b>.</p>
         <p>Topic: ${escapeHtml(topic)}</p>`,
      ),
    });
    if (from) {
      await sendEmail({
        to: from,
        replyTo: email,
        subject,
        html: emailHtml(
          "New booking",
          `<p><b>${escapeHtml(name)}</b> (${escapeHtml(email)}) booked <b>${escapeHtml(when)}</b>.</p>
           <p>Topic: ${escapeHtml(topic)}</p>`,
        ),
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
