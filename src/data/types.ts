export type Locale = "en" | "bn";

export type Localized = { en: string; bn: string };

export function pick(locale: Locale, value: Localized): string {
  return value[locale];
}
