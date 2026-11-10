/**
 * Per-effect registry for the visitor-facing effects panel.
 *
 * Each effect belongs to one of the three lazy-loaded modules (groups). The
 * admin allows/disallows individual effects; visitors toggle each available
 * effect on/off from the list. Storage key: `fx_effect_<key>`.
 */
export type EffectCategory = "cursor" | "animation" | "magical";
export type EffectGroup = "cursor" | "animation" | "magical";

export type EffectDef = {
  key: string;
  label: string;
  hint: string;
  category: EffectCategory;
  group: EffectGroup;
  /** Optional storage key override (defaults to `fx_effect_<key>`). */
  lsKey?: string;
};

export const EFFECTS: EffectDef[] = [
  // ---- Magical cursor ----
  { key: "mascot", label: "Butterfly mascot", hint: "A butterfly that follows the pointer", category: "cursor", group: "cursor" },
  { key: "trail", label: "Sparkle trail", hint: "Accent sparks following the pointer", category: "cursor", group: "cursor" },
  { key: "ripple", label: "Click ripple", hint: "Quiet ring on every click", category: "cursor", group: "cursor" },
  { key: "magnetic", label: "Magnetic buttons", hint: "Buttons ease toward a nearby pointer", category: "cursor", group: "cursor" },
  { key: "comet", label: "Comet ribbon", hint: "A glowing ribbon tail behind the cursor", category: "cursor", group: "cursor" },
  { key: "fairy", label: "Fairy dust", hint: "Twinkling dust that drifts and fades", category: "cursor", group: "cursor" },
  { key: "rune", label: "Rune circle", hint: "A rotating rune ring around the cursor", category: "cursor", group: "cursor" },
  { key: "firefly", label: "Firefly swarm", hint: "Glowing fireflies orbit the pointer", category: "cursor", group: "cursor" },
  // ---- Animation ----
  { key: "tilt", label: "3D tilt cards", hint: "Cards tilt a few degrees under the pointer", category: "animation", group: "animation" },
  { key: "parallax", label: "Hero parallax", hint: "Portrait drifts while scrolling", category: "animation", group: "animation" },
  { key: "scramble", label: "Text scramble", hint: "Headline resolves from shuffled glyphs", category: "animation", group: "animation" },
  { key: "counters", label: "Animated counters", hint: "Stats count up when scrolled into view", category: "animation", group: "animation" },
  { key: "shimmer", label: "Shimmer text", hint: "A light sweep across headings", category: "animation", group: "animation" },
  { key: "cardGlow", label: "Card glow", hint: "Soft glow follows the pointer on cards", category: "animation", group: "animation" },
  { key: "sparkleBurst", label: "Sparkle burst", hint: "Burst of sparks on click", category: "animation", group: "animation" },
  { key: "floaters", label: "Floating orbs", hint: "Gentle floating orbs in the hero", category: "animation", group: "animation" },
  // ---- Magical animation ----
  { key: "aurora", label: "Aurora glow", hint: "Slow accent blobs behind the page", category: "magical", group: "magical" },
  { key: "network", label: "Network background", hint: "Constellation canvas in the hero", category: "magical", group: "magical" },
  { key: "starField", label: "Star field", hint: "Twinkling starfield backdrop", category: "magical", group: "magical" },
  { key: "nebula", label: "Nebula cloud", hint: "Soft coloured nebula behind content", category: "magical", group: "magical" },
  { key: "sparkleField", label: "Sparkle field", hint: "Drifting sparkles across the page", category: "magical", group: "magical" },
  { key: "agentCursors", label: "Agent Cursors intro", hint: "A swarm of colored cursors rebuilds the page live", category: "magical", group: "magical", lsKey: "effects:agentCursors" },
];

export const EFFECT_KEYS = EFFECTS.map((e) => e.key);

export const GROUP_KEYS = ["cursor", "animation", "magical"] as const;
export type EffectGroupKey = (typeof GROUP_KEYS)[number];

export function effectsByGroup(group: EffectGroupKey): EffectDef[] {
  return EFFECTS.filter((e) => e.group === group);
}

export function effectDef(key: string): EffectDef | undefined {
  return EFFECTS.find((e) => e.key === key);
}

export function storageKey(key: string): string {
  return `fx_effect_${key}`;
}

export function readEffect(key: string, lsKey?: string): boolean | null {
  const k = lsKey ?? storageKey(key);
  try {
    const v = localStorage.getItem(k);
    if (v === "off") return false;
    if (v === "on") return true;
  } catch {}
  return null;
}

export function writeEffect(key: string, on: boolean, lsKey?: string): void {
  const k = lsKey ?? storageKey(key);
  try { localStorage.setItem(k, on ? "on" : "off"); } catch {}
  try { window.dispatchEvent(new CustomEvent("pf:fx")); } catch {}
}

export const FX_EVENT = "pf:fx";
