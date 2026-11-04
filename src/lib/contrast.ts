/** WCAG relative luminance + contrast ratio for #RRGGBB colours. */

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
}

function channel(value: number) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: string, bg: string) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export type Check = { pair: string; fg: string; bg: string; ratio: number; threshold: number; pass: boolean };

/**
 * Checks for one theme's tokens:
 *  - body text (ink) on page bg and card panel  → 4.5 (AA normal text)
 *  - muted text on bg and panel                 → 4.5
 *  - white text on accent (primary .btn)        → 4.5
 */
export function contrastChecks(tokens: {
  ink: string; mute: string; accent: string; bg: string; panel: string;
}): Check[] {
  const mk = (pair: string, fg: string, bg: string, threshold = 4.5): Check => {
    const ratio = contrastRatio(fg, bg);
    return { pair, fg, bg, ratio: Math.round(ratio * 100) / 100, threshold, pass: ratio >= threshold };
  };
  return [
    mk("ink / bg", tokens.ink, tokens.bg),
    mk("ink / panel", tokens.ink, tokens.panel),
    mk("mute / bg", tokens.mute, tokens.bg),
    mk("mute / panel", tokens.mute, tokens.panel),
    mk("white on accent (.btn.p)", "#FFFFFF", tokens.accent),
  ];
}
