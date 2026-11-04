"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Mockup showed the combined "বাং / EN" label on both language versions;
 * kept for pixel parity. aria-label explains the action.
 */
export function LanguageButton() {
  const locale = useLocale();
  const target = locale === "en" ? "bn" : "en";
  return (
    <Link href="/" locale={target} aria-label="Switch language">
      বাং / EN
    </Link>
  );
}
