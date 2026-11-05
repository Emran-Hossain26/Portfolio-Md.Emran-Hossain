/**
 * Effects group contract (Stage 5.1). Three visitor-facing groups:
 *  - animation: reveal, page transitions, count-up, parallax, scramble, tilt
 *  - cursor:    mascot, sparkle trail, click ripple, magnetic buttons
 *  - magical:   aurora glow, network/particle background, glow effects
 *
 * Each group is one persisted on/off flag ("fx_group_<key>"). Admin settings
 * decide which groups are available at all; visitors can only turn an
 * available group off, never enable a group the admin disabled.
 */

export type GroupKey = "animation" | "cursor" | "magical";

export const GROUP_KEYS: GroupKey[] = ["animation", "cursor", "magical"];

export const GROUP_EVENT = "pf:fxg";

export function storageKey(group: GroupKey): string {
  return `fx_group_${group}`;
}

export function readGroup(group: GroupKey): boolean {
  try {
    const v = localStorage.getItem(storageKey(group));
    if (v === "off") return false;
    if (v === "on") return true;
  } catch {}
  return true; // callers pass availability; default on when allowed
}

export function writeGroup(group: GroupKey, on: boolean) {
  try { localStorage.setItem(storageKey(group), on ? "on" : "off"); } catch {}
  window.dispatchEvent(new Event(GROUP_EVENT));
}

export function subscribeGroups(cb: () => void) {
  window.addEventListener(GROUP_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(GROUP_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Applies the group flags to <html data-fx-*> for CSS (reveal, page fade). */
export function applyGroupFlags(state: Record<GroupKey, boolean>) {
  document.documentElement.dataset.fxAnimation = state.animation ? "on" : "off";
  document.documentElement.dataset.fxCursor = state.cursor ? "on" : "off";
  document.documentElement.dataset.fxMagical = state.magical ? "on" : "off";
}
