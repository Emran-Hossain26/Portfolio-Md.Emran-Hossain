import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { getCvPath, getHeroTexts } from "@/lib/cms";
import { statusItems } from "@/data/expertise";
import { pick, type Locale } from "@/data/types";

export async function Hero({
  chip,
}: {
  /** Optional availability chip, rendered above the headline (admin-controlled). */
  chip?: React.ReactNode;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("hero");
  const ts = await getTranslations("status");
  // Admin-editable hero copy; messages are the seed fallback.
  const texts = await getHeroTexts();
  const cvPath = await getCvPath();

  return (
    <div className="hero">
      <div>
        {/* Availability chip is admin-controlled (hero_texts.avail; default on) */}
        {texts?.avail === false ? null : chip}
        {/* id="h1" — targeted by the visitor preview panel's headline box */}
        <h1 id="h1">{texts ? pick(locale, texts.heading) : t("heading")}</h1>
        <p>{texts ? pick(locale, texts.intro) : t("intro")}</p>
        <div className="cta">
          <a className="btn p" href="#contact">
            {texts ? pick(locale, texts.cta) || t("hire") : t("hire")}
          </a>
          {/* CV enabled once the admin uploads one (storage bucket "cv"); the
              counting route increments the download counter, then redirects.
              Disabled until an upload exists. */}
          {cvPath ? (
            <a className="btn" href="/api/download-cv" target="_blank" rel="noopener noreferrer">
              {t("cv")}
            </a>
          ) : (
            <button
              type="button"
              className="btn"
              title={t("cvSoon")}
              disabled
              aria-disabled="true"
            >
              {t("cv")}
            </button>
          )}
        </div>
      </div>
      <div>
        <Image
          className="photo"
          src="/images/emran-hossain.jpg"
          alt={t("photoAlt")}
          width={640}
          height={640}
          preload
          sizes="(min-width: 761px) 431px, calc(100vw - 40px)"
        />
        <div className="card status" style={{ marginTop: 14 }}>
          {statusItems.map((row) => (
            <div key={row}>
              <span>{row}</span>
              <i aria-hidden="true">
                {ts("online")}
              </i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
