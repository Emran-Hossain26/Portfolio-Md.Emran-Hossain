"use client";

import { useEffect, useState } from "react";

/**
 * Stage 6 #13 (optional) — tiny privacy-friendly badge showing VISITORS
 * their own country (from the Vercel geo header via /api/visitor-country).
 * Nothing is stored or sent anywhere; hidden when the country is unknown.
 */
export function CountryBadge() {
  const [country, setCountry] = useState<string>("");

  useEffect(() => {
    fetch("/api/visitor-country")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { country?: string }) => setCountry(String(j.country ?? "")))
      .catch(() => setCountry(""));
  }, []);

  if (!country || country.length !== 2) return null;

  return (
    <span
      className="chip"
      style={{ fontSize: 12 }}
      title="Your own country, detected from the CDN edge — never stored"
    >
      {countryToFlag(country)} {country.toUpperCase()}
    </span>
  );
}

/** ISO-3166 alpha-2 → regional-indicator flag (pure string math). */
function countryToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
