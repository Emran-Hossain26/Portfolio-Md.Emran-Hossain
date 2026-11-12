"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { EFFECTS, EFFECT_KEYS, writeEffect, readEffect, effectDef } from "@/lib/fx/effects";

/** Static effect-module loaders (stable identity — safe in effect deps). */
const MODULES: Record<string, () => Promise<{ start: (cfg: { intensity: string; effects: string[] }) => () => void }>> = {
  cursor: () => import("@/lib/fx/modules/cursor"),
  animation: () => import("@/lib/fx/modules/animation"),
  magical: () => import("@/lib/fx/modules/magical"),
};

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
      if (stored !== null) { out[k] = stored; continue; }
      // Agent Cursors intro: unset defaults to whatever it will actually do
      // on its own (autoplay unless reduced-motion) — so the switch always
      // reflects reality, and a reduced-motion visitor's first click is the
      // explicit "on" the hint tells them to use, not an accidental "off".
      if (k === "agentCursors") {
        let reduced = false;
        try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* noop */ }
        out[k] = !reduced;
      } else {
        out[k] = true;
      }
    }
    return out;
  });
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  // Draggable position: null = default (bottom-right, via CSS). Once the
  // visitor drags it, we pin it with inline left/top and remember it.
  // Starts null on both server and client render so the first paint always
  // matches (no hydration mismatch) — the saved spot is applied a tick later
  // from an effect, since localStorage only exists client-side.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dragging: boolean; moved: boolean; sx: number; sy: number; ex: number; ey: number }>(
    { dragging: false, moved: false, sx: 0, sy: 0, ex: 0, ey: 0 },
  );

  const clampPos = (x: number, y: number) => {
    const w = boxRef.current?.offsetWidth ?? 60;
    const h = boxRef.current?.offsetHeight ?? 44;
    const maxX = Math.max(8, window.innerWidth - w - 8);
    const maxY = Math.max(8, window.innerHeight - h - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fx-btn-pos");
      if (raw) {
        const p = JSON.parse(raw) as { x: number; y: number };
        if (typeof p.x === "number" && typeof p.y === "number") {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a browser-only store; the extra render after mount is the point.
          setPos(clampPos(p.x, p.y));
        }
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clampPos(p.x, p.y) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Task U7: any button/link click on the portfolio page turns ALL effects
  // off for the visitor (AgentCursors dispatches this). The panel stays
  // usable — flipping a switch back on re-enables just that effect.
  useEffect(() => {
    const onAllOff = () => {
      const next: Record<string, boolean> = {};
      for (const k of EFFECT_KEYS) {
        next[k] = false;
        const def = effectDef(k);
        writeEffect(k, false, def?.lsKey);
      }
      setEnabled(next);
    };
    window.addEventListener("pf:fx-all-off", onAllOff);
    return () => window.removeEventListener("pf:fx-all-off", onAllOff);
  }, []);

  const onDragPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { dragging: true, moved: false, sx: e.clientX, sy: e.clientY, ex: rect.left, ey: rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    setPos(clampPos(d.ex + dx, d.ey + dy));
  };
  const onDragPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    d.dragging = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    if (d.moved) {
      setPos((p) => {
        if (p) { try { localStorage.setItem("fx-btn-pos", JSON.stringify(p)); } catch { /* noop */ } }
        return p;
      });
    }
  };
  const stops = useRef<Partial<Record<string, () => void>>>({}); // group -> stop
  const running = useRef<Partial<Record<string, boolean>>>({});
  // Stage 6/7 staggered load: first start per group gets the delay.
  const firstStart = useRef<Record<string, boolean>>({ cursor: true, animation: true, magical: true });
  const locale = useLocale();
  const acLabels = locale === "bn"
    ? { switch: "এজেন্ট কারসর আনিম", replay: "আনিম পুনরায় চালান" }
    : { switch: "Agent Cursors intro", replay: "Replay intro" };
  const acReducedMotionHint = locale === "bn"
    ? "আপনার সিস্টেমে reduced motion চালু আছে। ইনট্রো চালু করতে এই সুইচ অন করুন।"
    : "Your system has reduced motion on. Turn this switch on to enable the intro.";

  // Shown only while the visitor hasn't made an explicit choice yet (three
  // states: unset/on/off) and their OS asks for less motion — otherwise the
  // intro's default autoplay stays off by design. Derived at render time
  // (not effect+state) since it's cheap and keeps it in sync with `enabled`
  // without an extra render pass.
  let showAcHint = false;
  try {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stored = readEffect("agentCursors", "effects:agentCursors");
    showAcHint = reduced && stored === null;
  } catch { /* noop */ }

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
    <div
      className="fx-btn-root"
      ref={boxRef}
      style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined}
    >
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
                  <div key={e.key}>
                    <button
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
                    {e.key === "agentCursors" && showAcHint ? (
                      <p style={{ margin: "2px 2px 6px", fontSize: 12, color: "var(--mute)" }}>{acReducedMotionHint}</p>
                    ) : null}
                  </div>
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
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
        onClick={() => {
          if (dragRef.current.moved) { dragRef.current.moved = false; return; }
          setOpen((v) => !v);
        }}
      >
        ✨ Effects
        <span className="fx-btn-seg" aria-hidden="true"><i /></span>
        {allOff ? <span className="fx-dot" aria-hidden="true" /> : null}
      </button>
    </div>
  );
}
