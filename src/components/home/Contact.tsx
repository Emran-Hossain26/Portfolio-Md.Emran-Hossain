import { getLocale, getTranslations } from "next-intl/server";
import { getContactInfo, getSocialLinks, getModuleSettings, getBookingSlots } from "@/lib/cms";
import { site } from "@/data/site";
import { pick, type Locale } from "@/data/types";
import { ContactForm } from "./ContactForm";
import { BookingPicker } from "@/components/BookingPicker";

/**
 * Stage 6 #10 + #9 — the contact section is live: submissions land in the
 * admin inbox (messages table) with a honeypot + rate limit; WhatsApp /
 * Telegram quick buttons appear when the admin adds those platforms in
 * Social links; and when booking is enabled, open consultation slots render
 * a picker below the form.
 */
export async function Contact() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const tq = await getTranslations("contactQuick");
  const [info, socials, modules, slots] = await Promise.all([
    getContactInfo(),
    getSocialLinks(),
    getModuleSettings(),
    getBookingSlots(),
  ]);

  const quick = socials
    .filter((s) => ["whatsapp", "telegram"].includes(s.platform.toLowerCase()))
    .map((s) => ({
      platform: s.platform.toLowerCase(),
      url: s.url,
      label: s.platform.charAt(0).toUpperCase() + s.platform.slice(1),
    }));

  const email = info.email || site.email;
  const phone = info.phone || site.phone;
  const location = info.location.en || info.location.bn
    ? pick(locale, info.location)
    : pick(locale, site.location);

  return (
    <section id="contact" data-sec="contact">
      <h2>{t("contact")}</h2>
      <ContactForm />

      {quick.length ? (
        <p style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="mute" style={{ fontSize: 14 }}>{tq("title")}</span>
          {quick.map((q) => (
            <a
              key={q.platform}
              className="btn"
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {q.label}
            </a>
          ))}
        </p>
      ) : null}

      {modules.booking ? (
        <div style={{ marginTop: 22 }}>
          <BookingPicker slots={slots} />
        </div>
      ) : null}

      <p className="mute" style={{ marginTop: 18 }}>
        {[email, phone, location].filter(Boolean).join(" · ")}
        <br />
        {socials
          .filter((s) => !["whatsapp", "telegram"].includes(s.platform.toLowerCase()))
          .map((s) => (
            <span key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}
              </a>{" "}
            </span>
          ))}
        {!socials.length ? (
          <>
            <a href={site.socials.github}>GitHub</a> ·{" "}
            <a href={site.socials.linkedin}>LinkedIn</a> ·{" "}
            <a href={site.socials.facebook}>Facebook</a>
          </>
        ) : null}
      </p>
    </section>
  );
}
