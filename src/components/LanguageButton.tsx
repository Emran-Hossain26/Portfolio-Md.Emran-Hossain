"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Mockup showed the combined "বাং / EN" label on both language versions;
 * kept for pixel parity. aria-label explains the action.
 * Switching locale preserves the current path (/, /projects, /blog/...).
 */
export function LanguageButton() {
  const locale = useLocale();
  const pathname = usePathname();
  const target = locale === "en" ? "bn" : "en";
  return (
    <Link href={pathname} locale={target} aria-label="Switch language">
      বাং / EN
    </Link>
  );
}
