/**
 * "Magical cursor" group module (dynamically imported): butterfly mascot,
 * sparkle trail, click ripple, magnetic buttons. Desktop mouse only — the
 * loader never starts this module on coarse pointers.
 */

export function start({ intensity }: { intensity: string }) {
  const cleanups: (() => void)[] = [];
  // Stage 6: admin override_reduced (pre-paint attribute) beats this check.
  const rm = document.documentElement.dataset.fxRmOverride !== "1" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (rm || !fine) return () => {};
  const scale = intensity === "low" ? 0.6 : intensity === "high" ? 1.4 : 1;

  let accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2F6BFF";
  const onTheme = () => {
    accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent;
  };
  window.addEventListener("pf:theme", onTheme);

  /* ---- Butterfly mascot ---- */
  const host = document.createElement("div");
  host.className = "fx-mascot";
  host.setAttribute("aria-hidden", "true");
  host.innerHTML =
    '<svg width="30" height="30" viewBox="0 0 40 40" fill="none">' +
    '<g class="fx-wing fx-wing-l"><path d="M19 20C15 10 6 6 3 9c-3 3 1 12 8 14-5 1-8 5-6 8 2 3 10 1 14-6Z" fill="var(--accent)" opacity="0.75"/><path d="M19 20C16 12 9 8 6 10c-2 2 1 9 7 11" fill="#fff" opacity="0.28"/></g>' +
    '<g class="fx-wing fx-wing-r"><path d="M21 20c4-10 13-14 16-11 3 3-1 12-8 14 5 1 8 5 6 8-2 3-10 1-14-6Z" fill="var(--accent)" opacity="0.75"/><path d="M21 20c3-8 10-12 13-10 2 2-1 9-7 11" fill="#fff" opacity="0.28"/></g>' +
    '<ellipse cx="20" cy="21" rx="1.7" ry="6.5" fill="var(--ink)" opacity="0.85"/>' +
    '<path d="M19 15c-2-3-4-4-6-4M21 15c2-3 4-4 6-4" stroke="var(--ink)" stroke-width="1" stroke-linecap="round" opacity="0.7"/></svg>';
  document.body.appendChild(host);
  let px = innerWidth / 2, py = innerHeight / 2, x = px, y = py - 80, vx = 0, vy = 0, wob = 0;
  let lastMove = performance.now();
  const onPointer = (e: PointerEvent) => { px = e.clientX; py = e.clientY; lastMove = performance.now(); };
  const onDown = () => { wob = 1; };
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  let mraf = 0;
  let mlast = performance.now();
  const mtick = (now: number) => {
    const dt = Math.min(48, now - mlast) / 16.7;
    mlast = now;
    const idle = now - lastMove > 2600;
    const tx = idle ? innerWidth / 2 + Math.sin(now / 1700) * (innerWidth * 0.28) : px + 26;
    const ty = idle ? innerHeight * 0.3 + Math.sin(now / 2300) * 60 : py - 30;
    vx += (tx - x) * 0.045 * dt; vy += (ty - y) * 0.045 * dt;
    vx *= 0.92; vy *= 0.92;
    x += vx * dt; y += vy * dt;
    wob *= 0.9;
    const angle = Math.atan2(vy, vx) * (180 / Math.PI) + 90 + wob * 360;
    host.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${angle.toFixed(1)}deg)`;
    mraf = requestAnimationFrame(mtick);
  };
  mraf = requestAnimationFrame(mtick);

  /* ---- Sparkle trail ---- */
  const canvas = document.createElement("canvas");
  canvas.className = "fx-trail";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(2, devicePixelRatio || 1);
  let w = innerWidth, h = innerHeight;
  const resize = () => {
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);
  type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number };
  let sparks: Spark[] = [];
  const cap = Math.round(140 * scale);
  const onMoveTrail = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || sparks.length >= cap) return;
    for (let i = 0; i < Math.max(1, Math.round(2 * scale)); i++) {
      sparks.push({
        x: e.clientX + (Math.random() - 0.5) * 6,
        y: e.clientY + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6 - 0.15,
        life: 0,
        max: 420 + Math.random() * 260,
        r: 0.9 + Math.random() * 1.3,
      });
    }
  };
  window.addEventListener("pointermove", onMoveTrail, { passive: true });
  let traf = 0, tlast = performance.now();
  const ttick = (now: number) => {
    const dt = Math.min(48, now - tlast) / 16.7;
    tlast = now;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = accent;
    sparks = sparks.filter((s) => s.life < s.max);
    for (const s of sparks) {
      s.life += dt * 16.7;
      s.x += s.vx * dt; s.y += s.vy * dt;
      const t = Math.max(0, 1 - s.life / s.max);
      ctx.globalAlpha = 0.5 * t;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * t, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    traf = requestAnimationFrame(ttick);
  };
  traf = requestAnimationFrame(ttick);

  /* ---- Click ripple ---- */
  const onRipple = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const ring = document.createElement("span");
    ring.className = "fx-ripple";
    ring.style.left = `${e.clientX}px`;
    ring.style.top = `${e.clientY}px`;
    document.body.appendChild(ring);
    ring.addEventListener("animationend", () => ring.remove(), { once: true });
  };
  window.addEventListener("pointerdown", onRipple, { passive: true });

  /* ---- Magnetic buttons ---- */
  const MAGNET = ".btn.p, .theme-select select";
  const MAX = 6, RANGE = 72;
  const magnets = Array.from(document.querySelectorAll<HTMLElement>(MAGNET));
  const onMagnetMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    for (const el of magnets) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = RANGE + Math.max(r.width, r.height) / 2;
      if (dist < reach) {
        const pull = 1 - dist / reach;
        el.style.transform = `translate(${((dx / dist) * MAX * pull).toFixed(1)}px, ${((dy / dist) * MAX * pull).toFixed(1)}px)`;
      } else if (el.style.transform) {
        el.style.transform = "";
      }
    }
  };
  document.addEventListener("pointermove", onMagnetMove, { passive: true });

  const onVis = () => {
    cancelAnimationFrame(mraf); cancelAnimationFrame(traf);
    if (!document.hidden) { mlast = tlast = performance.now(); mraf = requestAnimationFrame(mtick); traf = requestAnimationFrame(ttick); }
  };
  document.addEventListener("visibilitychange", onVis);

  cleanups.push(() => {
    window.removeEventListener("pf:theme", onTheme);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMoveTrail);
    window.removeEventListener("pointerdown", onRipple);
    document.removeEventListener("pointermove", onMagnetMove);
    document.removeEventListener("visibilitychange", onVis);
    cancelAnimationFrame(mraf); cancelAnimationFrame(traf);
    magnets.forEach((el) => el.style.setProperty("transform", ""));
    host.remove(); canvas.remove();
  });

  return () => cleanups.forEach((fn) => fn());
}
