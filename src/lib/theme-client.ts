/**
 * Shared client-side theme store. Single source of truth for the active
 * preset, used by both the header ThemePicker and the visitor preview
 * panel so the two controls can never fight over data-theme (they did:
 * the panel used to stomp the picker's choice on every reload).
 *
 * Persistence contract (matches the no-flash inline script in the layout):
 * - localStorage "theme" + cookie "theme" hold the chosen preset key.
 * - <html data-theme> mirrors it; the inline script applies it pre-paint.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

export function subscribeTheme(cb: Listener) {
  listeners.add(cb);
  // Fires cross-tab; "pf:theme" fires same-tab (storage events don't).
  window.addEventListener("storage", cb);
  window.addEventListener("pf:theme", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
    window.removeEventListener("pf:theme", cb);
  };
}

/** Active preset: stored choice if still enabled, else system preference. */
export function readActiveTheme(defaultPreset: string, enabledKeys: string[]): string {
  try {
    const v = localStorage.getItem("theme");
    if (v && enabledKeys.includes(v)) return v;
  } catch {}
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return defaultPreset;
}

/** Applies the preset to <html>, persists it, and syncs every subscriber. */
export function writeTheme(id: string) {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem("theme", id);
    document.cookie = `theme=${id};path=/;max-age=31536000;SameSite=Lax`;
  } catch {}
  window.dispatchEvent(new Event("pf:theme"));
  notify();
}
