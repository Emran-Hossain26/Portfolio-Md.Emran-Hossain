import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { getCvPath, getHeroTexts } from "@/lib/cms";
import { statusItems } from "@/data/expertise";
import { pick, type Locale } from "@/data/types";

export async function Hero() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("hero");
  const ts = await getTranslations("status");
  // Admin-editable hero copy; messages are the seed fallback.
  const texts = await getHeroTexts();
  const cvPath = await getCvPath();

  return (
    <div className="hero">
      <div>
        <h1>{texts ? pick(locale, texts.heading) : t("heading")}</h1>
        <p>{texts ? pick(locale, texts.intro) : t("intro")}</p>
        <div className="cta">
          <a className="btn p" href="#contact">
            {t("hire")}
          </a>
          {/* CV enabled once the admin uploads one (storage bucket "cv"); disabled otherwise */}
          {cvPath ? (
            <a className="btn" href={cvPath} target="_blank" rel="noopener noreferrer">
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
          priority
          sizes="(min-width: 761px) 431px, calc(100vw - 40px)"
        />
        <div className="card status" style={{ marginTop: 14 }}>
          {statusItems.map((row) => (
            <div key={row}>
              <span>{row}</span>
              <i aria-hidden="true">
                ● {ts("online")}
              </i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
