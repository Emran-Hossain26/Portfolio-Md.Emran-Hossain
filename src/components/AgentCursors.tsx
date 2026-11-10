"use client";

/**
 * Agent Cursors intro — ported from the "Agent Cursors" reference mockup.
 *
 * The real page content is hidden by the `ac-run` class on <html> (added by the
 * inline boot script before first paint, or here when the intro starts) and is
 * revealed element-by-element as the cursor swarm builds:
 *   - box:  dashed ghost rect + live "W × H" badge drag, then real element fades in
 *   - text: caret + typewriter reveal word by word (words wrapped in spans)
 *   - line: pen stroke left-to-right via scaleX
 * Done -> cursors flock to the pointer, fade out, layer removed, replay.
 * Hard cap 18s; failsafe removes the hiding class after 30s.
 *
 * Scope: mounted on the portfolio route only; guarded against /login and /admin.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const AGENT_CURSOR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6",
  "#0ea5e9", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899", "#fb7185",
];
const AGENT_CURSOR_NAMES = [
  "Emran", "Frontend", "Backend", "Design", "SEO", "Cloud",
  "Linux", "Network", "Security", "AI", "Server", "Bangla",
];
const AGENT_CURSOR_SEEN_KEY = "ac-seen";
const AGENT_CURSOR_FLAG_KEY = "effects:agentCursors";
const AGENT_CURSOR_EVENT = "pf:agentCursors";
const AGENT_CURSOR_HARD_CAP_MS = 18000;
const AGENT_CURSOR_FAILSAFE_MS = 30000;

type SwarmAction = "box" | "text" | "line";
type SwarmTarget = {
  el: HTMLElement;
  type: SwarmAction;
  done: boolean;
  busy: boolean;
  parent: SwarmTarget | null;
  w?: HTMLElement[];
};
type SwarmCursor = { el: HTMLDivElement; col: string; x: number; y: number; a: number };
type SwarmEngine = { finish: () => void; stop: () => void };

function isAuditLikeAgent(): boolean {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return /googlebot|bingo|bingpreview|lighthouse|headless|phantom|spider|crawler|preview/i.test(ua);
}

export function AgentCursors() {
  const pathname = usePathname();
  const pathnameRef = useRef<string | null>(pathname);
  const enabledRef = useRef(false);
  const runningRef = useRef(false);
  const engineRef = useRef<SwarmEngine | null>(null);
  const finishTimerRef = useRef(0);
  const failSafeTimerRef = useRef(0);
  const skipRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const stopIntro = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    runningRef.current = false;
  };

  const runIntro = async (force = false) => {
    if (runningRef.current) return;
    if (!force) {
      let seen = false;
      try { seen = sessionStorage.getItem(AGENT_CURSOR_SEEN_KEY) === "1"; } catch { /* noop */ }
      if (seen) { runningRef.current = false; return; }
    }
    if (force) {
      try { sessionStorage.removeItem(AGENT_CURSOR_SEEN_KEY); } catch { /* noop */ }
    }
    runningRef.current = true;

    const root = document.documentElement;
    root.classList.add("ac-run");

    const layer = document.createElement("div");
    layer.className = "ac-layer";
    document.body.appendChild(layer);
    layer.style.height = `${document.body.scrollHeight}px`;
    const R = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { l: r.left + window.scrollX, t: r.top + window.scrollY, w: r.width, h: r.height };
    };

    const targets: SwarmTarget[] = [];
    const collected = Array.from(document.querySelectorAll<HTMLElement>("[data-ac]")).filter(
      (e) => e.getClientRects().length > 0,
    );
    const byEl = new Map<HTMLElement, SwarmTarget>();
    collected.forEach((el) => {
      const type = (el.dataset.ac || "box") as SwarmAction;
      const node: SwarmTarget = { el, type, done: false, busy: false, parent: null };
      if (type === "text") {
        const words = (el.textContent || "").trim().split(/\s+/);
        el.textContent = "";
        const spans: HTMLElement[] = [];
        words.forEach((word, i) => {
          const s = document.createElement("span");
          s.textContent = word;
          s.style.visibility = "hidden";
          el.append(s, i < words.length - 1 ? " " : "");
          spans.push(s);
        });
        node.w = spans;
      }
      targets.push(node);
      byEl.set(el, node);
    });
    // A child is never built before its parent (DOM order guarantees parents come first).
    for (const t of targets) {
      const p = t.el.parentElement?.closest("[data-ac]") as HTMLElement | null;
      t.parent = p ? byEl.get(p) ?? null : null;
    }
    if (targets.length === 0) {
      runningRef.current = false;
      root.classList.remove("ac-run");
      return;
    }

    const N = window.innerWidth < 700 ? 6 : 12;
    const COL = AGENT_CURSOR_COLORS;
    const NAM = AGENT_CURSOR_NAMES;
    let swarmSpeed = 1;
    let swarmIdle = 0;
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cur: SwarmCursor[] = [];
    const place = (c: SwarmCursor, x: number, y: number, ms?: number) => {
      c.x = x; c.y = y;
      c.el.style.transition = ms ? `transform ${ms}ms cubic-bezier(.45,.05,.2,1)` : "none";
      c.el.style.transform = `translate(${x}px,${y}px)`;
    };
    const swarmSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const swarmRnd = (a: number, b: number) => a + Math.random() * (b - a);
    const swarmEased = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const go = async (c: SwarmCursor, x: number, y: number, ms?: number) => {
      const m = (ms ?? Math.min(850, 220 + Math.hypot(x - c.x, y - c.y) * 0.55)) / swarmSpeed;
      place(c, x, y, m);
      await swarmSleep(m);
    };
    for (let i = 0; i < N; i++) {
      const e = document.createElement("div");
      e.className = "ac-cur";
      e.innerHTML =
        `<svg width="16" height="22" viewBox="0 0 16 22"><path d="M1.5 1.5v15l4-3.6 3 6.6 2.6-1.2-3-6.4h5.4z" fill="${COL[i]}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>` +
        `<span style="background:${COL[i]}">${NAM[i]}</span>`;
      layer.appendChild(e);
      const c: SwarmCursor = { el: e, col: COL[i], x: 0, y: 0, a: (i / N) * Math.PI * 2 };
      cur.push(c);
      const angle = Math.random() * 6.28;
      const d = Math.max(window.innerWidth, window.innerHeight);
      place(c, window.innerWidth / 2 + Math.cos(angle) * d + window.scrollX, window.innerHeight / 2 + Math.sin(angle) * d + window.scrollY, 0);
    }
    const cursors: SwarmCursor[] = cur;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const drag = (c: SwarmCursor, x0: number, y0: number, x1: number, y1: number, ms: number, fn?: (q: number) => void) =>
      new Promise<void>((resolve) => {
        ms /= swarmSpeed;
        const s = performance.now();
        const f = () => {
          const k = Math.min(1, (performance.now() - s) / ms);
          const q = swarmEased(k);
          c.x = x0 + (x1 - x0) * q;
          c.y = y0 + (y1 - y0) * q;
          c.el.style.transform = `translate(${c.x}px,${c.y}px)`;
          fn?.(q);
          if (k < 1) requestAnimationFrame(f);
          else resolve();
        };
        f();
      });

    const boxAction = async (c: SwarmCursor, t: SwarmTarget) => {
      const r = R(t.el);
      const g = document.createElement("div");
      g.className = "ac-ghost";
      const b = document.createElement("div");
      b.className = "ac-badge";
      b.style.background = c.col;
      Object.assign(g.style, { left: `${r.l}px`, top: `${r.t}px`, width: "0px", height: "0px", borderColor: c.col, background: `${c.col}1a` });
      const upd = (q: number) => {
        const w = r.w * q;
        const h = r.h * q;
        g.style.width = `${w}px`;
        g.style.height = `${h}px`;
        b.style.left = `${r.l + w + 6}px`;
        b.style.top = `${r.t + h + 8}px`;
        b.textContent = `${Math.round(w)} × ${Math.round(h)}`;
      };
      upd(0);
      await go(c, r.l, r.t);
      layer.append(g, b);
      await drag(c, r.l, r.t, r.l + r.w, r.t + r.h, Math.min(750, 260 + (r.w + r.h) * 0.45), upd);
      t.el.classList.add("ac-in");
      g.style.transition = "opacity .35s";
      g.style.opacity = "0";
      b.remove();
      window.setTimeout(() => g.remove(), 400);
    };

    const textAction = async (c: SwarmCursor, t: SwarmTarget) => {
      const r0 = R(t.w ? t.w[0] : t.el);
      await go(c, r0.l, r0.t + r0.h * 0.3);
      const k = document.createElement("div");
      k.className = "ac-caret";
      k.style.background = c.col;
      layer.append(k);
      const spans = t.w ?? [];
      const step = Math.max(18, Math.min(60, 900 / Math.max(1, spans.length))) / swarmSpeed;
      for (let i = 0; i < spans.length; i++) {
        const s = spans[i];
        s.style.visibility = "visible";
        const r = R(s);
        Object.assign(k.style, { left: `${r.l + r.w + 1}px`, top: `${r.t}px`, height: `${r.h}px` });
        if (i % 2 === 0 || i === spans.length - 1) await go(c, r.l + r.w + 4, r.t + r.h * 0.6 + 4, step * 2);
        await swarmSleep(step);
      }
      k.remove();
    };

    const lineAction = async (c: SwarmCursor, t: SwarmTarget) => {
      const r = R(t.el);
      await go(c, r.l, r.t);
      await drag(c, r.l, r.t, r.l + r.w, r.t, Math.min(700, 300 + r.w * 0.4), (q) => { t.el.style.transform = `scaleX(${q})`; });
    };

    const swarmReveal = (t: SwarmTarget) => {
      if (t.type === "box") t.el.classList.add("ac-in");
      else if (t.type === "text") t.w?.forEach((s) => { s.style.visibility = "visible"; });
      else if (t.type === "line") t.el.style.transform = "";
    };

    const ACT: Record<SwarmAction, (c: SwarmCursor, t: SwarmTarget) => Promise<void>> = { box: boxAction, text: textAction, line: lineAction };

    const ok = (t: SwarmTarget) => {
      if (t.done || t.busy) return false;
      if (t.parent && !t.parent.done) return false;
      return true;
    };
    const pick = () => {
      const vt = window.scrollY - 60;
      const vb = window.scrollY + window.innerHeight + 60;
      const t = targets.find((x) => { if (!ok(x)) return false; const r = R(x.el); return r.t < vb && r.t + r.h > vt; });
      if (t) { swarmIdle = 0; return t; }
      if (!swarmIdle) swarmIdle = performance.now();
      if (performance.now() - swarmIdle > 900) { swarmSpeed = 3.5; return targets.find(ok) || null; }
      return null;
    };
    const run = async (c: SwarmCursor, delay: number) => {
      await swarmSleep(delay);
      while (!swarmDone) {
        const t = pick();
        if (!t) { if (targets.every((x) => x.done)) break; await swarmSleep(120); continue; }
        t.busy = true;
        try { await ACT[t.type](c, t); } catch { /* per-cursor error guard */ }
        swarmReveal(t);
        t.done = true;
        t.busy = false;
        await swarmSleep((40 + Math.random() * 180) / swarmSpeed);
      }
    };

    let swarmDone = false;
    const finish = () => {
      if (swarmDone) return;
      swarmDone = true;
      for (const t of targets) { if (!t.done) swarmReveal(t); }
      layer.querySelectorAll(".ac-ghost,.ac-badge,.ac-caret").forEach((n) => n.remove());
      root.classList.remove("ac-run");
      if (skipRef.current) { skipRef.current.remove(); skipRef.current = null; }
      try { sessionStorage.setItem(AGENT_CURSOR_SEEN_KEY, "1"); } catch { /* noop */ }
      const s = performance.now();
      const f = () => {
        const tt = performance.now() - s;
        cursors.forEach((c, i) => {
          const a = c.a + tt / 1500;
          const rad = 50 + (i % 4) * 22;
          c.x += (mouse.x + window.scrollX + Math.cos(a) * rad - c.x) * (0.05 + 0.01 * i);
          c.y += (mouse.y + window.scrollY + Math.sin(a) * rad - c.y) * (0.05 + 0.01 * i);
          c.el.style.transform = `translate(${c.x}px,${c.y}px)`;
        });
        if (tt < 3800) requestAnimationFrame(f);
        else {
          layer.style.transition = "opacity .6s";
          layer.style.opacity = "0";
          window.setTimeout(() => layer.remove(), 700);
        }
      };
      requestAnimationFrame(f);
    };

    const swarmOnKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    const swarmOnMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };

    const stop = () => {
      window.clearTimeout(finishTimerRef.current);
      window.clearTimeout(failSafeTimerRef.current);
      window.removeEventListener("keydown", swarmOnKey);
      window.removeEventListener("pointermove", swarmOnMove);
      if (skipRef.current) { skipRef.current.remove(); skipRef.current = null; }
      layer.remove();
      for (const c of cursors) c.el.remove();
      document.documentElement.classList.remove("ac-run");
      for (const t of targets) { if (t.type === "text") t.w?.forEach((s) => { s.style.visibility = "visible"; }); }
      runningRef.current = false;
    };

    engineRef.current = { finish, stop };

    const skip = document.createElement("button");
    skip.className = "ac-btn";
    skip.textContent = "Skip intro (Esc)";
    skip.onclick = () => finish();
    document.body.appendChild(skip);
    skipRef.current = skip;
    window.addEventListener("keydown", swarmOnKey);
    window.addEventListener("pointermove", swarmOnMove);
    finishTimerRef.current = window.setTimeout(() => finish(), AGENT_CURSOR_HARD_CAP_MS);
    failSafeTimerRef.current = window.setTimeout(() => {
      root.classList.remove("ac-run");
      for (const t of targets) { if (t.type === "text") t.w?.forEach((s) => { s.style.visibility = "visible"; }); }
    }, AGENT_CURSOR_FAILSAFE_MS);

    void (async () => {
      const L = R(targets[0].el);
      await Promise.all(cursors.map((c) => go(c, L.l + swarmRnd(-70, L.w + 70), L.t + swarmRnd(-40, L.h + 60), swarmRnd(700, 1100))));
      await swarmSleep(350);
      await Promise.all(cursors.map((c, i) => run(c, i * 90)));
      finish();
    })();
  };

  useEffect(() => {
    const path = pathnameRef.current ?? "";
    if (path.startsWith("/login") || path.startsWith("/admin")) return;

    const readEnabled = (): boolean => {
      try { return localStorage.getItem(AGENT_CURSOR_FLAG_KEY) !== "off"; } catch { return true; }
    };
    enabledRef.current = readEnabled();

    const onFxEvent = (e: Event) => {
      const d = (e as CustomEvent).detail as { on?: boolean; replay?: boolean } | undefined;
      const on = d?.on ?? enabledRef.current;
      const replay = d?.replay ?? false;
      enabledRef.current = on;
      if (on) { void runIntro(replay); } else { stopIntro(); }
    };
    window.addEventListener(AGENT_CURSOR_EVENT, onFxEvent);

    if (enabledRef.current) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const bot = isAuditLikeAgent();
      if (!reduced && !bot) {
        void runIntro();
      }
    }

    return () => { window.removeEventListener(AGENT_CURSOR_EVENT, onFxEvent); stopIntro(); };
  }, []);

  const path = pathname ?? "";
  if (path.startsWith("/login") || path.startsWith("/admin")) return null;

  return null;
}
