"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitTestimonialAction, type PublicActionResult } from "@/lib/actions/public";
import { TurnstileWidget } from "@/components/TurnstileWidget";

const initial: PublicActionResult = { ok: false };

/**
 * Public testimonial submit form (MISSING-TASKS A3): a visitor review goes
 * in with status "pending" and only appears after the admin approves it in
 * the panel. Honeypot field "website" is hidden from humans.
 */
export function TestimonialSubmitForm() {
  const t = useTranslations("pages.testimonials.form");
  const [state, action, pending] = useActionState(submitTestimonialAction, initial);

  if (state.ok) {
    return (
      <div className="card" style={{ marginTop: 26 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{t("success")}</p>
        <p className="mute" style={{ margin: "8px 0 0" }}>{t("pendingNote")}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 20, marginTop: 0 }}>{t("heading")}</h2>
      <form action={action} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label>
            {t("name")}
            <input name="name" required maxLength={120} />
          </label>
          <label>
            {t("company")}
            <input name="company" maxLength={160} placeholder={t("companyOptional")} />
          </label>
          <label>
            {t("rating")}
            <select name="rating" defaultValue="5">
              <option value="5">5 ★</option>
              <option value="4">4 ★</option>
              <option value="3">3 ★</option>
              <option value="2">2 ★</option>
              <option value="1">1 ★</option>
            </select>
          </label>
        </div>
        <label>
          {t("quote")}
          <textarea name="quote" required minLength={20} maxLength={2000} rows={4} />
        </label>
        <TurnstileWidget />
        {/* Honeypot — hidden from humans, catnip for bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ display: "none" }}
        />
        {state.error ? (
          <p role="alert" style={{ color: "var(--bad, #b42318)", margin: 0 }}>
            {t(`error_${state.error}`)}
          </p>
        ) : null}
        <div>
          <button type="submit" className="btn p" disabled={pending}>
            {pending ? t("sending") : t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
