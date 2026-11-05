import { getLocale, getTranslations } from "next-intl/server";
import { site } from "@/data/site";
import { pick, type Locale } from "@/data/types";

export async function Contact() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");

  return (
    <section id="contact" data-sec="contact">
      <h2>{t("contact")}</h2>
      <form action="#">
        {/* Deviation #6: sr-only labels added for a11y; honeypot is invisible — visuals unchanged */}
        <label className="sr-only" htmlFor="contact-name">
          {t("name")}
        </label>
        <input
          id="contact-name"
          name="name"
          placeholder={t("namePh")}
          required
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
        />
        {/* Honeypot for the future server action — kept invisible, removed from tab order. */}
        <div style={{ display: "none" }} aria-hidden="true">
          <label>
           <textarea name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <button
          className="btn p"
          type="submit"
          title={t("sendSoon")}
          disabled
          aria-disabled="true"
        >
          {t("send")}
        </button>
      </form>
      <p className="mute" style={{ marginTop: 18 }}>
        {site.email} · {site.phone} · {pick(locale, site.location)}
        <br />
        <a href={site.socials.github}>GitHub</a> ·{" "}
        <a href={site.socials.linkedin}>LinkedIn</a> ·{" "}
        <a href={site.socials.facebook}>Facebook</a>
      </p>
    </section>
  );
}
