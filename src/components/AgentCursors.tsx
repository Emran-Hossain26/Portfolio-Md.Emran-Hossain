"use client";

/**
 * Agent Cursors intro — a swarm of colored cursors builds the page live.
 *
 * Task U7 play rules (visitor-first):
 *  - NO autoplay: the portfolio page renders fully built on load.
 *  - The intro starts when the visitor has scrolled ~120px (they showed
 *    engagement) — from then it behaves as before: cursors build whatever
 *    is inside the viewport (+ lookahead) in DOM order, parent before child;
 *    nothing force-finishes; between sections cursors idle near the pointer.
 *  - Clicking ANY button/link on the portfolio page aborts the show and
 *    deactivates it for the browsing session (sessionStorage) — the visitor
 *    wants to interact, not watch. The visitor Effects panel is exempt
 *    (its Replay is an explicit opt-in). Esc still skips mid-show.
 *  - After every target is built the swarm enters FOLLOW MODE until turned
 *    off, a click deactivates it, or the route changes.
 *
 * Scope: mounted on the portfolio route only; guarded against /login and /admin.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { EFFECTS, writeEffect } from "@/lib/fx/effects";

/** Tuning. `slow` multiplies every duration below (travel, drag, typing, pauses). */
const CFG = {
  cursors: 12, // cursor count on desktop (also the admin-configurable default)
  mobileCursors: 6, // cursor count when the viewport is narrow (<700px)
  slow: 1.8, // duration multiplier for everything; 1 = demo speed, 1.8 = default
  pauseMs: [150, 450] as [number, number], // random pause a cursor takes between targets
  catchUpMax: 1.5, // max speed-up when a lot of pending targets are already in view
  lookaheadPx: 200, // extra px below the viewport counted as "in view" for build-ahead
};

const FLAG_KEY = "effects:agentCursors";
const EVENT = "pf:agentCursors";
const ALIVE_ATTR = "data-ac-alive";
/** Task U7: clicking any button/link on the portfolio page deactivates the
 * effect for THIS browsing session (sessionStorage) — the visitor is telling
 * us they want to interact, not watch. Fresh session = intro available again. */
const DEACT_KEY = "ac-deactivated";
/** Scroll distance (px, accumulated) that arms the intro. */
const SCROLL_ARM_PX = 120;
/** One pass per page view by design (see spec). Flip to true to gate replays
 * on sessionStorage `ac-seen` again — it is then written only on a genuine
 * finish (never on mount/cleanup/a StrictMode remount). */
const PLAY_ONCE_PER_SESSION = false;
const SEEN_KEY = "ac-seen";

const COLORS = ["#ef4444","#f97316","#eab308","#84cc16","#22c55e","#14b8a6","#0ea5e9","#3b82f6","#8b5cf6","#d946ef","#ec4899","#fb7185"];
const NAMES = ["Emran","Frontend","Backend","Design","SEO","Cloud","Linux","Network","Security","AI","Server","Bangla"];

type Choice = "on" | "off" | "unset";
function readChoice(): Choice {
  try {
    const v = localStorage.getItem(FLAG_KEY);
    if (v === "on" || v === "off") return v;
  } catch { /* noop */ }
  return "unset";
}

function isBotLike(): boolean {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  // navigator.webdriver catches CDP-driven Chrome (Lighthouse, Playwright,
  // Puppeteer) even under mobile emulation, where the UA is spoofed to a
  // real Android string and carries no "Headless" marker to regex-match.
  if (typeof navigator !== "undefined" && navigator.webdriver) return true;
  return /googlebot|bingo|bingpreview|lighthouse|headless|phantom|spider|crawler|preview/i.test(ua);
}

type Action = "box" | "text" | "line";
interface Target {
  el: HTMLElement;
  type: Action;
  built: boolean;
  busy: boolean;
  parent: Target | null;
  spans: HTMLElement[];
}
interface Cursor {
  el: HTMLDivElement;
  idx: number;
  col: string;
  x: number;
  y: number;
  busy: boolean;
}

export function AgentCursors({
  cursorCount = CFG.cursors,
  cursorSpeed = CFG.slow,
}: {
  cursorCount?: number;
  cursorSpeed?: number;
}) {
  const pathname = usePathname();
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const path = pathname ?? "";
    if (path.startsWith("/login") || path.startsWith("/admin")) return;

    const cleanupFns: (() => void)[] = [];

    const start = () => {
      stopRef.current?.();
      stopRef.current = runBuild(cursorCount, cursorSpeed);
    };

    const onFx = (e: Event) => {
      const d = (e as CustomEvent).detail as { on?: boolean } | undefined;
      stopRef.current?.();
      stopRef.current = null;
      if (d?.on) start();
    };
    window.addEventListener(EVENT, onFx);

    // Autoplay decision (see NEW PLAY RULES):
    //  - "off" never runs.
    //  - "on" is explicit consent: runs even with reduced-motion on.
    //  - unset runs unless reduced-motion, a bot/audit UA, or no JS (moot — we're running).
    const choice = readChoice();
    const bot = isBotLike();
    if (choice !== "off" && !bot) {
      // Same reduced-motion contract as the fx system (groups.ts): the admin
      // override_reduced switch (data-fx-rm-override) lets the show run even
      // when the OS asks for reduced motion.
      if (choice === "on") {
        // Task U7 play rules: the intro NEVER autoplays on load (the page
        // renders fully built so readers are never disturbed). It starts on
        // the visitor's first real scroll — and ANY button/link click on the
        // portfolio page aborts the show and deactivates it for the session.
        let deactivated = false;
        try { deactivated = sessionStorage.getItem(DEACT_KEY) === "1"; } catch { /* noop */ }
        if (!deactivated) {
          let armed = false;
          let acc = 0;
          let lastY = window.scrollY;
          const onScroll = () => {
            if (armed) return;
            acc += Math.abs(window.scrollY - lastY);
            lastY = window.scrollY;
            if (acc >= SCROLL_ARM_PX) {
              armed = true;
              // Scroll listener is done once the show starts — but the click
              // listener stays armed for the whole visit (rule 3: any button
              // click deactivates, mid-show or in follow mode).
              window.removeEventListener("scroll", onScroll);
              start();
            }
          };
          const onDeactClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement | null;
            // Anything interactive counts — except the visitor Effects panel
            // itself, whose buttons are how a visitor deliberately replays.
            if (!t?.closest?.("a,button,[role='button'],input,select,textarea,label")) return;
            if (t.closest(".fx-btn-root")) return;
            try { sessionStorage.setItem(DEACT_KEY, "1"); } catch { /* noop */ }
            // Task U7 extension: EVERY effect turns off, not just the cursors
            // — persisted in the visitor's prefs; the Effects panel is how
            // they turn any of them back on.
            for (const e of EFFECTS) writeEffect(e.key, false, e.lsKey);
            window.dispatchEvent(new CustomEvent("pf:fx-all-off"));
            stopRef.current?.();
            stopRef.current = null;
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("click", onDeactClick, true);
          };
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("click", onDeactClick, true);
          cleanupFns.push(() => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("click", onDeactClick, true);
          });
        }
      }
    }

    return () => {
      window.removeEventListener(EVENT, onFx);
      for (const fn of cleanupFns) fn();
      stopRef.current?.();
      stopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const path = pathname ?? "";
  if (path.startsWith("/login") || path.startsWith("/admin")) return null;
  return null;
}

/** Runs one build + follow pass. Returns a stop() that fully tears everything
 * down — DOM, timers, rAF, listeners — so a StrictMode remount (or a route
 * change) always starts the next pass completely clean. */
function runBuild(cursorCount: number, cursorSpeed: number): () => void {
  let stopped = false;
  let buildDone = false;

  const root = document.documentElement;
  root.classList.add("ac-run");
  root.setAttribute(ALIVE_ATTR, String(Date.now()));
  const aliveTimer = window.setInterval(() => {
    if (!stopped) root.setAttribute(ALIVE_ATTR, String(Date.now()));
  }, 4000);

  const layer = document.createElement("div");
  layer.className = "ac-layer";
  document.body.appendChild(layer);
  const applyHeight = () => { if (!stopped) layer.style.height = `${document.body.offsetHeight}px`; };
  applyHeight();
  const ro = new ResizeObserver(applyHeight);
  ro.observe(document.body);

  const R = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { l: r.left + window.scrollX, t: r.top + window.scrollY, w: r.width, h: r.height };
  };

  const targets: Target[] = [];
  const byEl = new Map<HTMLElement, Target>();

  function registerTarget(el: HTMLElement) {
    if (byEl.has(el) || el.getClientRects().length === 0) return;
    const type = (el.dataset.ac || "box") as Action;
    const node: Target = { el, type, built: false, busy: false, parent: null, spans: [] };
    if (type === "text") {
      // Split into per-character spans (grouped in a nowrap word-wrapper so
      // words still break at natural spaces) so the cursor can visibly
      // "type" the text out, not just pop whole words in.
      const words = (el.textContent || "").trim().split(/\s+/);
      el.textContent = "";
      words.forEach((word, i) => {
        const wrap = document.createElement("span");
        wrap.style.whiteSpace = "nowrap";
        for (const ch of word) {
          const s = document.createElement("span");
          s.textContent = ch;
          s.style.visibility = "hidden";
          wrap.append(s);
          node.spans.push(s);
        }
        el.append(wrap, i < words.length - 1 ? " " : "");
      });
    }
    const p = el.parentElement?.closest("[data-ac]") as HTMLElement | null;
    node.parent = p ? byEl.get(p) ?? null : null;
    targets.push(node);
    byEl.set(el, node);
  }

  Array.from(document.querySelectorAll<HTMLElement>("[data-ac]")).forEach(registerTarget);

  // A Suspense-streamed region (e.g. the header) can hydrate a beat after
  // this mount, missing the one-time collection above entirely — and since
  // it's often fixed-position (always "in view"), it would otherwise never
  // get a target at all. Watch for late-arriving [data-ac] nodes until the
  // build finishes.
  const lateMo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches("[data-ac]")) registerTarget(n);
        n.querySelectorAll?.("[data-ac]").forEach((el) => registerTarget(el as HTMLElement));
      });
    }
  });
  lateMo.observe(document.body, { childList: true, subtree: true });

  const narrow = window.innerWidth < 700;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const N = narrow ? Math.min(CFG.mobileCursors, cursorCount) : cursorCount;

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
  window.addEventListener("pointermove", onMove);

  const place = (c: Cursor, x: number, y: number, ms?: number) => {
    c.x = x; c.y = y;
    c.el.style.transition = ms ? `transform ${ms}ms cubic-bezier(.45,.05,.2,1)` : "none";
    c.el.style.transform = `translate(${x}px,${y}px)`;
  };

  const cursors: Cursor[] = [];
  for (let i = 0; i < N; i++) {
    const col = COLORS[i % COLORS.length];
    const e = document.createElement("div");
    e.className = "ac-cur";
    e.innerHTML =
      `<svg width="16" height="22" viewBox="0 0 16 22"><path d="M1.5 1.5v15l4-3.6 3 6.6 2.6-1.2-3-6.4h5.4z" fill="${col}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>` +
      `<span style="background:${col}">${NAMES[i % NAMES.length]}</span>`;
    layer.appendChild(e);
    const c: Cursor = { el: e, idx: i, col, x: 0, y: 0, busy: false };
    cursors.push(c);
    const angle = Math.random() * 6.28;
    const d = Math.max(window.innerWidth, window.innerHeight);
    place(c, window.innerWidth / 2 + Math.cos(angle) * d + window.scrollX, window.innerHeight / 2 + Math.sin(angle) * d + window.scrollY, 0);
  }

  const skip = document.createElement("button");
  skip.className = "ac-btn";
  skip.textContent = "Skip intro (Esc)";
  skip.onclick = () => finishBuild();
  document.body.appendChild(skip);
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finishBuild(); };
  window.addEventListener("keydown", onKey);

  const onFocusIn = (e: FocusEvent) => {
    const el = (e.target as HTMLElement | null)?.closest?.("[data-ac]") as HTMLElement | null;
    const t = el ? byEl.get(el) : undefined;
    if (t && !t.built) { t.built = true; reveal(t); }
  };
  document.addEventListener("focusin", onFocusIn);

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const eased = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const effMs = (base: number, catchUp: number) => (base * cursorSpeed) / catchUp;

  const go = async (c: Cursor, x: number, y: number, baseMs: number | undefined, catchUp: number) => {
    const base = baseMs ?? Math.min(850, 220 + Math.hypot(x - c.x, y - c.y) * 0.55);
    const ms = effMs(base, catchUp);
    place(c, x, y, ms);
    await sleep(ms);
    if (stopped) throw new Error("ac-stopped");
  };

  const drag = (c: Cursor, x0: number, y0: number, x1: number, y1: number, baseMs: number, catchUp: number, fn?: (q: number) => void) =>
    new Promise<void>((resolve, reject) => {
      const ms = effMs(baseMs, catchUp);
      const s = performance.now();
      const step = () => {
        if (stopped) { reject(new Error("ac-stopped")); return; }
        const k = Math.min(1, (performance.now() - s) / ms);
        const q = eased(k);
        c.x = x0 + (x1 - x0) * q;
        c.y = y0 + (y1 - y0) * q;
        c.el.style.transition = "none";
        c.el.style.transform = `translate(${c.x}px,${c.y}px)`;
        fn?.(q);
        if (k < 1) requestAnimationFrame(step); else resolve();
      };
      step();
    });

  const boxAction = async (c: Cursor, t: Target, catchUp: number) => {
    const r = R(t.el);
    const g = document.createElement("div"); g.className = "ac-ghost";
    const b = document.createElement("div"); b.className = "ac-badge"; b.style.background = c.col;
    Object.assign(g.style, { left: `${r.l}px`, top: `${r.t}px`, width: "0px", height: "0px", borderColor: c.col, background: `${c.col}1a` });
    const upd = (q: number) => {
      const w = r.w * q, h = r.h * q;
      g.style.width = `${w}px`; g.style.height = `${h}px`;
      b.style.left = `${r.l + w + 6}px`; b.style.top = `${r.t + h + 8}px`;
      b.textContent = `${Math.round(w)} × ${Math.round(h)}`;
    };
    upd(0);
    await go(c, r.l, r.t, undefined, catchUp);
    layer.append(g, b);
    await drag(c, r.l, r.t, r.l + r.w, r.t + r.h, Math.min(750, 260 + (r.w + r.h) * 0.45), catchUp, upd);
    t.el.classList.add("ac-in");
    g.style.transition = "opacity .35s"; g.style.opacity = "0"; b.remove();
    window.setTimeout(() => g.remove(), 400);
  };

  const textAction = async (c: Cursor, t: Target, catchUp: number) => {
    const spans = t.spans; // one span per character
    const r0 = R(spans[0] ?? t.el);
    await go(c, r0.l, r0.t + r0.h * 0.3, undefined, catchUp);
    const k = document.createElement("div"); k.className = "ac-caret"; k.style.background = c.col;
    layer.append(k);
    // Per-character typing pace, with a floor so even a short word (e.g. a
    // nav label) still reads as "being typed" instead of popping in — the
    // cursor hand only hops forward every few letters while the caret marks
    // every letter, like a hand pausing while the text catches up to it.
    const rawStep = Math.max(16, Math.min(55, 900 / Math.max(1, spans.length)));
    const HOP = 3;
    for (let i = 0; i < spans.length; i++) {
      const s = spans[i];
      s.style.visibility = "visible";
      const r = R(s);
      Object.assign(k.style, { left: `${r.l + r.w + 1}px`, top: `${r.t}px`, height: `${r.h}px` });
      if (i % HOP === 0 || i === spans.length - 1) await go(c, r.l + r.w + 4, r.t + r.h * 0.6 + 4, rawStep * HOP, catchUp);
      await sleep(effMs(rawStep, catchUp));
      if (stopped) throw new Error("ac-stopped");
    }
    k.remove();
  };

  const lineAction = async (c: Cursor, t: Target, catchUp: number) => {
    const r = R(t.el);
    await go(c, r.l, r.t, undefined, catchUp);
    await drag(c, r.l, r.t, r.l + r.w, r.t, Math.min(700, 300 + r.w * 0.4), catchUp, (q) => { t.el.style.transform = `scaleX(${q})`; });
  };

  function reveal(t: Target) {
    if (t.type === "box") t.el.classList.add("ac-in");
    else if (t.type === "text") t.spans.forEach((s) => { s.style.visibility = "visible"; });
    else t.el.style.transform = "";
  }

  function inView(t: Target): boolean {
    const r = t.el.getBoundingClientRect();
    return r.top < window.innerHeight + CFG.lookaheadPx && r.bottom > -60;
  }
  function okToBuild(t: Target): boolean {
    return !t.built && !t.busy && (!t.parent || t.parent.built);
  }
  function pendingInViewCount(): number {
    let n = 0;
    for (const t of targets) if (!t.built && inView(t)) n++;
    return n;
  }
  function pickTarget(): Target | null {
    for (const t of targets) if (okToBuild(t) && inView(t)) return t;
    return null;
  }

  async function buildOne(c: Cursor, t: Target) {
    c.busy = true;
    t.busy = true;
    const catchUp = Math.min(CFG.catchUpMax, 1 + Math.max(0, pendingInViewCount() - 8) * 0.06);
    try {
      if (t.type === "box") await boxAction(c, t, catchUp);
      else if (t.type === "text") await textAction(c, t, catchUp);
      else await lineAction(c, t, catchUp);
    } catch { /* stopped mid-action, or a per-target animation error — either way, fall through */ }
    if (!t.built) { reveal(t); t.built = true; }
    t.busy = false;
    if (!stopped) {
      const pause = effMs(rnd(CFG.pauseMs[0], CFG.pauseMs[1]), 1);
      await sleep(pause);
    }
    c.busy = false;
    if (!stopped && !buildDone && targets.every((x) => x.built)) finishBuild();
  }

  function idleDrift(c: Cursor) {
    const cx = coarse ? window.innerWidth / 2 : mouse.x;
    const cy = coarse ? window.innerHeight / 2 : mouse.y;
    const t = performance.now() / 1400 + c.idx * 1.7;
    const tx = cx + window.scrollX + Math.cos(t) * 40;
    const ty = cy + window.scrollY + Math.sin(t) * 28;
    c.x += (tx - c.x) * 0.05;
    c.y += (ty - c.y) * 0.05;
    c.el.style.transition = "none";
    c.el.style.transform = `translate(${c.x}px,${c.y}px)`;
  }

  let rafId = 0;
  function tick() {
    if (stopped || buildDone) return;
    for (const c of cursors) {
      if (c.busy) continue;
      const t = pickTarget();
      if (t) void buildOne(c, t);
      else idleDrift(c);
    }
    rafId = requestAnimationFrame(tick);
  }

  let followRaf = 0;
  let onVis: (() => void) | null = null;

  function finishBuild() {
    if (buildDone) return;
    buildDone = true;
    cancelAnimationFrame(rafId);
    lateMo.disconnect();
    window.clearInterval(aliveTimer);
    root.removeAttribute(ALIVE_ATTR);
    for (const t of targets) { if (!t.built) { t.built = true; reveal(t); } }
    layer.querySelectorAll(".ac-ghost,.ac-badge,.ac-caret").forEach((n) => n.remove());
    root.classList.remove("ac-run");
    skip.remove();
    document.removeEventListener("focusin", onFocusIn);
    if (PLAY_ONCE_PER_SESSION) { try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* noop */ } }
    enterFollowMode();
  }

  function enterFollowMode() {
    ro.disconnect();
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.height = "auto";
    let hidden = document.hidden;
    const start0 = performance.now();
    function followTick(now: number) {
      if (stopped) return;
      if (!hidden) {
        cursors.forEach((c) => {
          const a = (c.idx / cursors.length) * 6.28 + (now - start0) / 1500;
          const rad = 50 + (c.idx % 4) * 22;
          c.x += (mouse.x + Math.cos(a) * rad - c.x) * (0.05 + 0.01 * c.idx);
          c.y += (mouse.y + Math.sin(a) * rad - c.y) * (0.05 + 0.01 * c.idx);
          c.el.style.transition = "none";
          c.el.style.transform = `translate(${c.x}px,${c.y}px)`;
        });
      }
      followRaf = requestAnimationFrame(followTick);
    }
    onVis = () => { hidden = document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    followRaf = requestAnimationFrame(followTick);

    if (coarse) {
      window.setTimeout(() => {
        if (stopped) return;
        layer.style.transition = "opacity .6s";
        layer.style.opacity = "0";
        window.setTimeout(() => {
          if (stopped) return;
          cancelAnimationFrame(followRaf);
          layer.remove();
          cursors.forEach((c) => c.el.remove());
        }, 700);
      }, 4000);
    }
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    window.clearInterval(aliveTimer);
    root.removeAttribute(ALIVE_ATTR);
    cancelAnimationFrame(rafId);
    cancelAnimationFrame(followRaf);
    ro.disconnect();
    lateMo.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("keydown", onKey);
    document.removeEventListener("focusin", onFocusIn);
    if (onVis) document.removeEventListener("visibilitychange", onVis);
    skip.remove();
    layer.remove();
    cursors.forEach((c) => c.el.remove());
    root.classList.remove("ac-run");
    for (const t of targets) { if (t.type === "text") t.spans.forEach((s) => { s.style.visibility = "visible"; }); }
  }

  if (targets.length === 0) {
    finishBuild();
    return stop;
  }

  void (async () => {
    const first = targets.find(inView) ?? targets[0];
    const L = R(first.el);
    try {
      await Promise.all(cursors.map((c) => go(c, L.l + rnd(-70, L.w + 70), L.t + rnd(-40, L.h + 60), rnd(700, 1100), 1)));
    } catch { /* stopped before the intro swoop finished */ }
    if (stopped) return;
    rafId = requestAnimationFrame(tick);
  })();

  return stop;
}
