"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  applyGroupFlags,
  storageKey,
  subscribeGroups,
  writeGroup,
  type GroupKey,
} from "@/lib/fx/groups";

/**
 * The single public "✨ Effects" control (Stage 5.1): a glass pill fixed
 * bottom-right opening a small glass panel with exactly three switches —
 * Animation / Magical cursor / Magical animation. Everything heavy lives in
 * dynamically imported modules (lib/fx/modules/*), loaded after window load
 * + requestIdleCallback and only for groups that are ON. The admin decides
 * which groups exist (props); visitors only switch an available group off.
 */

export type EffectsButtonProps = {
  /** Groups the admin allows (per-effect OR'ed server-side, master applied). */
  allowed: Record<GroupKey, boolean>;
  /** Effects intensity from the admin (scales particles and glow). */
  intensity: "low" | "medium" | "high";
};

type Snapshot = {
  animation: boolean;
  cursor: boolean;
  magical: boolean;
  reduced: boolean;
  touch: boolean;
};

const SERVER_SNAPSHOT: Snapshot = { animation: false, cursor: false, magical: false, reduced: false, touch: false };
let cached: Snapshot = SERVER_SNAPSHOT;

function clientSnapshot(allowed: Record<GroupKey, boolean>): Snapshot {
  const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const stored = (g: GroupKey): boolean => {
    try { return localStorage.getItem(storageKey(g)) !== "off"; } catch { return true; }
  };
  const next: Snapshot = {
    animation: allowed.animation && !rm && stored("animation"),
    cursor: allowed.cursor && !rm && !touch && stored("cursor"),
    magical: allowed.magical && !rm && stored("magical"),
    reduced: rm,
    touch,
  };
  if (
    cached.animation !== next.animation || cached.cursor !== next.cursor ||
    cached.magical !== next.magical || cached.reduced !== next.reduced ||
    cached.touch !== next.touch
  ) {
    cached = next;
  }
  return cached;
}

type ModuleStop = () => void;
type ModuleFactory = (cfg: { intensity: string }) => ModuleStop;
const MODULES: Record<GroupKey, () => Promise<{ start: ModuleFactory }>> = {
  animation: () => import("@/lib/fx/modules/animation"),
  cursor: () => import("@/lib/fx/modules/cursor"),
  magical: () => import("@/lib/fx/modules/magical"),
};

export function EffectsButton({ allowed, intensity }: EffectsButtonProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const stops = useRef<Partial<Record<GroupKey, ModuleStop>>>({});
  const running = useRef<Partial<Record<GroupKey, boolean>>>({});

  const snap = useSyncExternalStore(
    subscribeGroups,
    () => clientSnapshot(allowed),
    () => SERVER_SNAPSHOT,
  );
  const groups: Record<GroupKey, boolean> = useMemo(
    () => ({ animation: snap.animation, cursor: snap.cursor, magical: snap.magical }),
    [snap.animation, snap.cursor, snap.magical],
  );

  // Keep <html data-fx-*> in sync for the CSS-gated pieces (reveal, fade).
  useEffect(() => {
    applyGroupFlags(groups);
  }, [groups]);

  // Lazy-load + start/stop group modules as the state changes. The first
  // import of a session waits for window load + requestIdleCallback.
  useEffect(() => {
    let cancelled = false;
    const schedule = (cb: () => void) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number };
      const go = () => { if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 2500 }); else setTimeout(cb, 800); };
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    };

    (Object.keys(MODULES) as GroupKey[]).forEach((group) => {
      const shouldRun = groups[group];
      if (!shouldRun) {
        stops.current[group]?.();
        stops.current[group] = undefined;
        running.current[group] = false;
        return;
      }
      if (running.current[group]) return;
      running.current[group] = true;
      schedule(async () => {
        if (cancelled || !groups[group]) { running.current[group] = false; return; }
        try {
          const mod = await MODULES[group]();
          if (cancelled || !groups[group]) { running.current[group] = false; return; }
          stops.current[group]?.();
          stops.current[group] = mod.start({ intensity });
        } catch {
          running.current[group] = false;
        }
      });
    });
    return () => { cancelled = true; };
  }, [groups, intensity]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const allOff = !groups.animation && !groups.cursor && !groups.magical;
  const showCursorRow = allowed.cursor && !snap.touch;
  const anyAllowed = allowed.animation || allowed.cursor || allowed.magical;

  if (!anyAllowed) return null;

  const toggle = (group: GroupKey) => {
    writeGroup(group, !groups[group]);
  };

  const rows: { key: GroupKey; label: string }[] = [
    { key: "animation", label: "Animation" },
    { key: "cursor", label: "Magical cursor" },
    { key: "magical", label: "Magical animation" },
  ];

  return (
    <div className="fx-btn-root" ref={boxRef}>
      {open ? (
        <div className="fx-panel" id="fx-panel" role="dialog" aria-label="Effects" aria-modal="false">
          {rows.map((row) => {
            if (row.key === "cursor" && !showCursorRow) return null;
            if (!allowed[row.key]) return null;
            return (
              <button
                key={row.key}
                type="button"
                role="switch"
                aria-checked={groups[row.key]}
                className={"fx-row" + (groups[row.key] ? " on" : "")}
                onClick={() => toggle(row.key)}
              >
                <span className="fx-row-label">{row.label}</span>
                <span className="fx-row-state">{groups[row.key] ? "ON" : "OFF"}</span>
                <span className="fx-knob-track" aria-hidden="true"><span className="fx-knob" /></span>
              </button>
            );
          })}
          {snap.reduced ? (
            <p className="fx-note">Reduced motion is on in your device settings.</p>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        className="fx-btn"
        aria-expanded={open}
        aria-controls="fx-panel"
        aria-label={open ? "Close effects panel" : "Open effects panel"}
        onClick={() => setOpen((v) => !v)}
      >
        ✨ Effects
        <span className="fx-btn-seg" aria-hidden="true"><i /></span>
        {allOff ? <span className="fx-dot" aria-hidden="true" /> : null}
      </button>
    </div>
  );
}
