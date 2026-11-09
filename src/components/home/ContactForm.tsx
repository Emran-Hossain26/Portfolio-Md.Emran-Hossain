"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitContactAction, type PublicActionResult } from "@/lib/actions/public";
import { TurnstileWidget } from "@/components/TurnstileWidget";

const initial: PublicActionResult = { ok: false };

/**
 * The live contact form (Stage 6 #10). Same fields/visuals as the original
 * static form — including the invisible "company" honeypot — but submissions
 * now reach the admin inbox. Success swaps the form for a confirmation.
 */
export function ContactForm() {
  const t = useTranslations("sections");
  const tc = useTranslations("contactForm");
  const [state, action, pending] = useActionState(submitContactAction, initial);

  if (state.ok) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{tc("sent")}</p>
        <p className="mute" style={{ margin: "8px 0 0", fontSize: 14 }}>{tc("sentNote")}</p>
      </div>
    );
  }

  return (
    <form action={action}>
      {/* Deviation #6: sr-only labels added for a11y; honeypot is invisible — visuals unchanged */}
      <label className="sr-only" htmlFor="contact-name">
        {t("name")}
      </label>
      <input
        id="contact-name"
        name="name"
        placeholder={t("namePh")}
        required
        maxLength={120}
        autoComplete="name"
      />
      <label className="sr-only" htmlFor="contact-email">
        {t("email")}
      </label>
      <input
        id="contact-email"
        name="email"
        type="email"
        placeholder={t("emailPh")}
        required
        maxLength={200}
        autoComplete="email"
      />
      <label className="sr-only" htmlFor="contact-message">
        {t("message")}
      </label>
      <textarea
        id="contact-message"
        name="message"
        rows={5}
        placeholder={t("messagePh")}
        required
        minLength={10}
        maxLength={5000}
      />
      {/* Turnstile (item 4) — renders only when the site key is set */}
      <TurnstileWidget />
      {/* Honeypot — invisible, removed from tab order, only bots fill it. */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label>
          <textarea name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.error ? (
        <p role="alert" style={{ color: "var(--bad, #b42318)", margin: 0, fontSize: 14 }}>
          {tc(`error_${state.error}`)}
        </p>
      ) : null}
      <button className="btn p" type="submit" disabled={pending}>
        {pending ? tc("sending") : t("send")}
      </button>
    </form>
  );
}
