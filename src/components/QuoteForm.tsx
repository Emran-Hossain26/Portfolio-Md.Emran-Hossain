"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitQuoteAction, type PublicActionResult } from "@/lib/actions/public";
import { TurnstileWidget } from "@/components/TurnstileWidget";

const initial: PublicActionResult = { ok: false };

/** Stage 6 #8 — "Request a quote" form on the /services page. */
export function QuoteForm() {
  const t = useTranslations("quote");
  const [state, action, pending] = useActionState(submitQuoteAction, initial);

  if (state.ok) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{t("success")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>{t("title")}</h3>
      <p className="mute" style={{ margin: 0, fontSize: 14 }}>{t("intro")}</p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <label>
          {t("name")}
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          {t("email")}
          <input name="email" type="email" required maxLength={200} autoComplete="email" />
        </label>
        <label>
          {t("budget")}
          <input name="budget" maxLength={80} />
        </label>
      </div>
      <label>
        {t("details")}
        <textarea name="details" required minLength={10} maxLength={5000} rows={4} placeholder={t("detailsPh")} />
      </label>
      <TurnstileWidget />
      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      {state.error ? (
        <p role="alert" style={{ color: "var(--bad, #b42318)", margin: 0, fontSize: 14 }}>
          {t(`error_${state.error}`)}
        </p>
      ) : null}
      <div>
        <button className="btn p" type="submit" disabled={pending}>
          {pending ? t("sending") : t("submit")}
        </button>
      </div>
    </form>
  );
}
