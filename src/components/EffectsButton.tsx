"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { EFFECTS, EFFECT_KEYS, writeEffect, readEffect, FX_EVENT, effectDef } from "@/lib/fx/effects";

export type EffectsButtonProps = {
  /** Per-effect availability from the admin (master already applied). */
  allowed: Record<string, boolean>;
  /** Effects intensity from the admin (scales particles and glow). */
  intensity: "low" | "medium" | "high";
};

const SERVER_SNAPSHOT: Record<string, boolean> = {};
for (const k of EFFECT_KEYS) SERVER_SNAPSHOT[k] = false;

export function EffectsButton({ allowed, intensity }: EffectsButtonProps) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const k of EFFECT_KEYS) {
      if (!allowed[k]) { out[k] = false; continue; }
      const def = effectDef(k);
      const stored = readEffect(k, def?.lsKey);
      out[k] = stored === null ? true : stored;
    }
    return out;
  });
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const stops = useRef<Partial<Record<string, () => void>>>({}); // group -> stop
  const running = useRef<Partial<Record<string, boolean>>>({});
  // Stage 6/7 staggered load: first start per group gets the delay.
  const firstStart = useRef<Record<string, boolean>>({ cursor: true, animation: true, magical: true });
  const groupOf = useMemo(() => {
    const m: Record<string, string> = {};
    for (const e of EFFECTS) m[e.key] = e.group;
    return m;
  }, []);
  const locale = useLocale();
  const acLabels = locale === "bn"
    ? { switch: "এজেন্ট কারসর আনিম", replay: "আনিম পুনরায় চালান" }
    : { switch: "Agent Cursors intro", replay: "Replay intro" };

  // persist + broadcast on toggle
  const toggle = (key: string) => {
    const def = effectDef(key);
    setEnabled((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeEffect(key, next[key], def?.lsKey);
      return next;
    });
  };

  // Agent Cursors intro: switch ON -> run the intro (replay semantics),
  // switch OFF -> stop it instantly. The intro engine lives in <AgentCursors />.
  const onToggle = (key: string) => {
    if (key !== "agentCursors") { toggle(key); return; }
    const nextOn = !enabled[key];
    const def = effectDef(key);
    writeEffect(key, nextOn, def?.lsKey);
    setEnabled((prev) => ({ ...prev, [key]: nextOn }));
    try { window.dispatchEvent(new CustomEvent("pf:agentCursors", { detail: { on: nextOn, replay: true } })); } catch { /* noop */ }
  };

  // group on/off derived
  const groupOn = useMemo(() => {
    const g: Record<string, boolean> = { cursor: false, animation: false, magical: false };
    for (const e of EFFECTS) {
      if (allowed[e.key] && enabled[e.key]) g[e.group] = true;
    }
    return g;
  }, [allowed, enabled]);

  // CSS data attrs for gated pieces
  useEffect(() => {
    const root = document.documentElement;
    for (const e of EFFECTS) {
      root.setAttribute(`data-fx-${e.key}`, enabled[e.key] && allowed[e.key] ? "on" : "off");
    }
  }, [enabled, allowed]);

  const MODULES: Record<string, () => Promise<{ start: (cfg: { intensity: string; effects: string[] }) => () => void }>> = {
    cursor: () => import("@/lib/fx/modules/cursor"),
    animation: () => import("@/lib/fx/modules/animation"),
    magical: () => import("@/lib/fx/modules/magical"),
  };

  useEffect(() => {
    let cancelled = false;
    // Stage 6/7 — staggered "one by one" load: after page load each group
    // starts a beat later than the previous one (first run only; later
    // toggles apply instantly).
    const START_DELAY: Record<string, number> = { cursor: 0, animation: 700, magical: 1500 };
    const schedule = (cb: () => void, delay = 0) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number };
      const go = () => {
        const kick = () => { if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 2500 }); else setTimeout(cb, 200); };
        if (delay > 0) setTimeout(kick, delay); else kick();
      };
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    };
    for (const group of ["cursor", "animation", "magical"]) {
      const shouldRun = groupOn[group];
      if (!shouldRun) {
        stops.current[group]?.();
        stops.current[group] = undefined;
        running.current[group] = false;
        continue;
      }
      if (running.current[group]) {
        // restart to apply new effect subset
        stops.current[group]?.();
        stops.current[group] = undefined;
        running.current[group] = false;
      }
      running.current[group] = true;
      const startDelay = firstStart.current[group] ? (START_DELAY[group] ?? 0) : 0;
      firstStart.current[group] = false;
      const effectsInGroup = EFFECTS.filter((e) => e.group === group && allowed[e.key] && enabled[e.key]).map((e) => e.key).filter((k) => k !== "agentCursors");
      schedule(async () => {
        if (startDelay > 0) {
          // Staggered "one by one" load (Stage 6/7 user request).
          await new Promise((res) => setTimeout(res, startDelay));
          if (cancelled) { running.current[group] = false; return; }
        }
        if (cancelled) { running.current[group] = false; return; }
        try {
          const mod = await MODULES[group]();
          if (cancelled) { running.current[group] = false; return; }
          stops.current[group]?.();
          stops.current[group] = mod.start({ intensity, effects: effectsInGroup });
        } catch {
          running.current[group] = false;
        }
      });
    }
    return () => { cancelled = true; };
  }, [groupOn, intensity, enabled, allowed]);

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

  const anyAllowed = EFFECTS.some((e) => allowed[e.key]);
  if (!anyAllowed) return null;

  const allOff = !Object.keys(enabled).some((k) => enabled[k] && allowed[k]);

  return (
    <div className="fx-btn-root" ref={boxRef}>
      {open ? (
        <div className="fx-panel" id="fx-panel" role="dialog" aria-label="Effects" aria-modal="false" style={{ maxHeight: 420, overflowY: "auto" }}>
          {["cursor", "animation", "magical"].map((group) => {
            const items = EFFECTS.filter((e) => e.group === group && allowed[e.key]);
            if (items.length === 0) return null;
            const title = group === "cursor" ? "Magical cursor" : group === "animation" ? "Animation" : "Magical animation";
            return (
              <div key={group} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: "var(--mute)", margin: "6px 2px 4px", textTransform: "uppercase", letterSpacing: ".08em" }}>{title}</p>
                {items.map((e) => (
                  <button
                    key={e.key}
                    type="button"
                    role="switch"
                    aria-checked={enabled[e.key]}
                    className={"fx-row" + (enabled[e.key] ? " on" : "")}
                    onClick={() => onToggle(e.key)}
                    title={e.hint}
                  >
                    <span className="fx-row-label">{e.key === "agentCursors" ? acLabels.switch : e.label}</span>
                    <span className="fx-row-state">{enabled[e.key] ? "ON" : "OFF"}</span>
                    <span className="fx-knob-track" aria-hidden="true"><span className="fx-knob" /></span>
                  </button>
                ))}
                {group === "magical" && allowed.agentCursors ? (
                  <button
                    type="button"
                    className="fx-row"
                    onClick={() => { try { window.dispatchEvent(new CustomEvent("pf:agentCursors", { detail: { on: true, replay: true } })); } catch { /* noop */ } }}
                    title="Run the Agent Cursors intro again"
                    style={{ marginTop: 4 }}
                  >
                    <span className="fx-row-label">▶ {acLabels.replay}</span>
                    <span className="fx-row-state">PLAY</span>
                  </button>
                ) : null}
              </div>
            );
          })}
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
