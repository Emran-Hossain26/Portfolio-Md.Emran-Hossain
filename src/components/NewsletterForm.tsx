"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { subscribeNewsletterAction, type PublicActionResult } from "@/lib/actions/public";

const initial: PublicActionResult = { ok: false };

/**
 * Footer subscribe box (MISSING-TASKS A13, optional toggle from admin).
 * Honeypot field "website" is hidden from humans and ignored by the action.
 */
export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [state, action, pending] = useActionState(subscribeNewsletterAction, initial);

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius, 12px)",
        padding: "14px 16px",
      }}
    >
      <form action={action}>
        <input type="hidden" name="locale" value={locale} />
        <label htmlFor="nl-email" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
          {t("title")}
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            id="nl-email"
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder={t("placeholder")}
            style={{ flex: "1 1 220px", minWidth: 0 }}
          />
          {/* Honeypot — hidden from humans, catnip for bots */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ display: "none" }}
          />
          <button type="submit" className="btn p" disabled={pending}>
            {pending ? t("joining") : t("button")}
          </button>
        </div>
      </form>
      <p aria-live="polite" className="mute" style={{ fontSize: 13, margin: "8px 0 0" }}>
        {state.ok
          ? t("success")
          : state.error
            ? t(`error_${state.error}`)
            : t("hint")}
      </p>
    </div>
  );
}
