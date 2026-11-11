import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { getCvPath, getHeroTexts } from "@/lib/cms";
import { statusItems } from "@/data/expertise";
import { pick, type Locale } from "@/data/types";

export async function Hero({
  chip,
}: {
  chip?: React.ReactNode;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("hero");
  const texts = await getHeroTexts();
  const cvPath = await getCvPath();

  return (
    <div className="hero">
      <div>
        {texts?.avail !== false ? chip : null}
        <h1 id="h1">{texts ? pick(locale, texts.heading) : t("heading")}</h1>
        <p>{texts ? pick(locale, texts.intro) : t("intro")}</p>
        <div className="cta">
          <a className="btn p" href="#contact">
            {texts?.cta?.en ? (locale === "bn" ? texts.cta.bn || texts.cta.en : texts.cta.en) : t("hire")}
          </a>
          {cvPath ? (
            <a className="btn" href="/api/download-cv" target="_blank" rel="noopener noreferrer">
              {t("cv")}
            </a>
          ) : (
            <button type="button" className="btn" title={t("cvSoon")} disabled aria-disabled="true">
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
          width={520}
          height={520}
          priority
          sizes="(min-width: 761px) 340px, calc(100vw - 40px)"
          style={{ maxWidth: 340, marginLeft: "auto" }}
        />
        <div className="status">
          {statusItems.map((row) => (
            <div key={row}>
              <span>{row}</span>
              <i aria-hidden="true">●</i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
