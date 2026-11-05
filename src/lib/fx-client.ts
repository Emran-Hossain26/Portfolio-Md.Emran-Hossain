/**
 * Shared client store for the individual page effects (network background,
 * cursor trail, 3D tilt). An effect is enabled when its own flag is "on"
 * AND the master switch (html[data-effects]) is not "off" — the preview
 * panel writes both. Canvas components subscribe here so toggling applies
 * live without a reload.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

export function subscribeFx(cb: Listener) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  window.addEventListener("pf:fx", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
    window.removeEventListener("pf:fx", cb);
  };
}

/** Master switch: false only when the visitor turned all effects off. */
export function effectsMasterOn(): boolean {
  return document.documentElement.dataset.effects !== "off";
}

/** Effect flag: stored "on"/"off"; defaults to on. Master-off wins. */
export function readFx(key: string): boolean {
  if (!effectsMasterOn()) return false;
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v === "on";
  } catch {}
  return true;
}

export function writeFx(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? "on" : "off");
  } catch {}
  window.dispatchEvent(new Event("pf:fx"));
  notify();
}
