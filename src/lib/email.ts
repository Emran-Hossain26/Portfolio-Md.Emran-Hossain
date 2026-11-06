import "server-only";

/**
 * Email notifications via the Resend REST API (MISSING-TASKS A12) — plain
 * fetch, no SDK dependency. Without RESEND_API_KEY every email feature
 * degrades to a no-op with a clear reason (the admin UI shows the state).
 */

const RESEND_API = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type EmailResult = { ok: boolean; skipped?: boolean; error?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true, error: "not_configured" };
  const from = process.env.RESEND_FROM || "Portfolio Admin <onboarding@resend.dev>";
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `resend_${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Small branded HTML wrapper for admin notifications. */
export function emailHtml(title: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#111">
<h2 style="font-size:18px;margin:0 0 12px">${title}</h2>
${bodyHtml}
<p style="color:#777;font-size:12px;margin-top:24px">Sent from your portfolio admin panel.</p>
</div>`;
}
