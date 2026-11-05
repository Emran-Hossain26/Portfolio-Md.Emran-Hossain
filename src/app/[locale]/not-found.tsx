import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found | Md Emran Hossain",
  robots: { index: false },
};

export default async function NotFound() {
  const t = await getTranslations("pages.notFound");
  return (
    <main className="wrap" id="main">
      <section style={{ paddingTop: 32 }}>
        <h1 style={{ fontSize: 30, marginBottom: 26 }}>{t("heading")}</h1>
        <p className="mute">{t("text")}</p>
        <p style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn p" href="/">
            {t("back")}
          </Link>
          <Link className="btn" href="/projects">
            Projects
          </Link>
          <Link className="btn" href="/contact">
            Contact
          </Link>
        </p>
      </section>
    </main>
  );
}
