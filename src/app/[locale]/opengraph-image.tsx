import { ImageResponse } from "next/og";
import { site, siteUrl } from "@/data/site";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export const alt = `${site.name} — portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Cache the font buffer so we don't fetch on every request.
let fontCache: ArrayBuffer | null = null;
async function loadFont(): Promise<ArrayBuffer | undefined> {
  if (fontCache) return fontCache;
  try {
    const res = await fetch(
      "https://fonts.gstatic.com/s/hindsiliguri/v15/ijwTs5juUUTl0RKmk8U.woff2",
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return undefined;
    fontCache = await res.arrayBuffer();
    return fontCache;
  } catch {
    return undefined;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const bn = resolved === "bn";
  const font = await loadFont();

  const title = bn ? site.nameBn : site.name;
  const tagline = bn
    ? "আইটি ইনফ্রাস্ট্রাকচার · সাইবারসিকিউরিটি · ফুল-স্ট্যাক + এআই"
    : "IT Infrastructure · Operations · Digital Solutions · AI-Assisted Development";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          flexDirection: "column", justifyContent: "space-between",
          background: "linear-gradient(135deg, #0C1524 0%, #122035 100%)",
          color: "#E8EDF5", padding: "72px",
          fontFamily: font ? "Hind Siliguri, sans-serif" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 54, height: 54, borderRadius: 14,
              background: "#2F6BFF", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 30, fontWeight: 700, color: "#fff",
            }}
          >
            E
          </div>
          <div style={{ fontSize: 26, color: "#93A0B5" }}>
            {siteUrl.replace(/^https:\/\//, "")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontSize: 34, color: "#93A0B5" }}>{tagline}</div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 120, height: 8, background: "#2F6BFF", borderRadius: 4 }} />
          <div style={{ fontSize: 24, color: "#93A0B5" }}>Dhaka, Bangladesh</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Hind Siliguri", data: font, weight: 400, style: "normal" }]
        : [],
    },
  );
}