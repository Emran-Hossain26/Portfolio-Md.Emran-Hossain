import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { statusItems } from "@/data/expertise";

export async function Hero() {
  const t = await getTranslations("hero");
  const ts = await getTranslations("status");

  return (
    <div className="hero">
      <div>
        <h1>{t("heading")}</h1>
        <p>{t("intro")}</p>
        <div className="cta">
          <a className="btn p" href="#contact">
            {t("hire")}
          </a>
          {/* Deviation #5: CV file doesn't exist yet — disabled until admin upload (flagged, visual unchanged) */}
          <button
            type="button"
            className="btn"
            title={t("cvSoon")}
            disabled
            aria-disabled="true"
          >
            {t("cv")}
          </button>
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
