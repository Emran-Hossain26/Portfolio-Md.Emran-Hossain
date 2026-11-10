/**
 * "Magical cursor" group module.
 */
export function start({ intensity, effects }: { intensity: string; effects?: string[] }) {
  const enabled = new Set(effects ?? ["mascot","trail","ripple","magnetic","comet","fairy","rune","firefly"]);
  const cleanups: (() => void)[] = [];
  const rm = document.documentElement.dataset.fxRmOverride !== "1" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (rm || !fine) return () => {};
  const scale = intensity === "low" ? 0.6 : intensity === "high" ? 1.4 : 1;

  let accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2F6BFF";
  const onTheme = () => { accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent; };
  window.addEventListener("pf:theme", onTheme);

  /* ---- Butterfly mascot ---- */
  if (enabled.has("mascot")) {
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
    let mraf = 0, mlast = performance.now();
    const mtick = (now: number) => {
      const dt = Math.min(48, now - mlast) / 16.7; mlast = now;
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
    cleanups.push(() => { cancelAnimationFrame(mraf); window.removeEventListener("pointermove", onPointer); window.removeEventListener("pointerdown", onDown); host.remove(); });
  }

  /* ---- Sparkle trail ---- */
  if (enabled.has("trail")) {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-trail";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = innerWidth, h = innerHeight;
    const resize = () => { w = innerWidth; h = innerHeight; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); canvas.style.width=`${w}px`; canvas.style.height=`${h}px`; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize();
    window.addEventListener("resize", resize);
    type Spark = { x:number;y:number;vx:number;vy:number;life:number;max:number;r:number };
    let sparks: Spark[] = [];
    const cap = Math.round(140 * scale);
    const onMoveTrail = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || sparks.length >= cap) return;
      for (let i = 0; i < Math.max(1, Math.round(2 * scale)); i++) {
        sparks.push({ x: e.clientX + (Math.random()-0.5)*6, y: e.clientY + (Math.random()-0.5)*6, vx:(Math.random()-0.5)*0.6, vy:(Math.random()-0.5)*0.6 - 0.15, life:0, max:420+Math.random()*260, r:0.9+Math.random()*1.3 });
      }
    };
    window.addEventListener("pointermove", onMoveTrail, { passive: true });
    let traf = 0, tlast = performance.now();
    const ttick = (now: number) => {
      const dt = Math.min(48, now - tlast) / 16.7; tlast = now;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accent;
      sparks = sparks.filter((s) => s.life < s.max);
      for (const s of sparks) {
        s.life += dt * 16.7; s.x += s.vx * dt; s.y += s.vy * dt;
        const t = Math.max(0, 1 - s.life / s.max);
        ctx.globalAlpha = 0.5 * t;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * t, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      traf = requestAnimationFrame(ttick);
    };
    traf = requestAnimationFrame(ttick);
    cleanups.push(() => { cancelAnimationFrame(traf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMoveTrail); canvas.remove(); });
  }

  /* ---- Click ripple ---- */
  if (enabled.has("ripple")) {
    const onRipple = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const ring = document.createElement("span");
      ring.className = "fx-ripple";
      ring.style.left = `${e.clientX}px`; ring.style.top = `${e.clientY}px`;
      document.body.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
    };
    window.addEventListener("pointerdown", onRipple, { passive: true });
    cleanups.push(() => window.removeEventListener("pointerdown", onRipple));
  }

  /* ---- Magnetic buttons ---- */
  if (enabled.has("magnetic")) {
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
        } else if (el.style.transform) { el.style.transform = ""; }
      }
    };
    document.addEventListener("pointermove", onMagnetMove, { passive: true });
    cleanups.push(() => { document.removeEventListener("pointermove", onMagnetMove); magnets.forEach((el) => el.style.setProperty("transform", "")); });
  }

  /* ---- Comet ribbon trail ---- */
  if (enabled.has("comet")) {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-comet";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = innerWidth, h = innerHeight;
    const resize = () => { w = innerWidth; h = innerHeight; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); canvas.style.width=`${w}px`; canvas.style.height=`${h}px`; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize(); window.addEventListener("resize", resize);
    type Pt = { x:number; y:number };
    const pts: Pt[] = [];
    const onMove = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; pts.push({ x: e.clientX, y: e.clientY }); if (pts.length > 40) pts.shift(); };
    window.addEventListener("pointermove", onMove, { passive: true });
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 16.7; last = now;
      ctx.clearRect(0, 0, w, h);
      if (pts.length > 2) {
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (let i = 1; i < pts.length; i++) {
          const t = i / pts.length;
          ctx.strokeStyle = accent; ctx.globalAlpha = t * 0.7;
          ctx.lineWidth = (1 - t) * 1.5 + 0.5;
          ctx.beginPath(); ctx.moveTo(pts[i-1].x, pts[i-1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // decay
      if (pts.length) pts.splice(0, 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); canvas.remove(); });
  }

  /* ---- Fairy dust ---- */
  if (enabled.has("fairy")) {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-fairy";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = innerWidth, h = innerHeight;
    const resize = () => { w = innerWidth; h = innerHeight; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); canvas.style.width=`${w}px`; canvas.style.height=`${h}px`; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize(); window.addEventListener("resize", resize);
    type D = { x:number;y:number;vx:number;vy:number;life:number;max:number;r:number;rot:number };
    let dust: D[] = [];
    const cap = Math.round(90 * scale);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || dust.length >= cap) return;
      for (let i = 0; i < Math.max(1, Math.round(3 * scale)); i++) {
        const a = Math.random() * Math.PI * 2;
        dust.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a)*0.4, vy: Math.sin(a)*0.4 - 0.2, life: 0, max: 900 + Math.random()*600, r: 1 + Math.random()*1.6, rot: Math.random()*6 });
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 16.7; last = now;
      ctx.clearRect(0, 0, w, h);
      dust = dust.filter((d) => d.life < d.max);
      for (const d of dust) {
        d.life += dt * 16.7; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 0.005 * dt; d.rot += 0.05 * dt;
        const t = Math.max(0, 1 - d.life / d.max);
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot);
        ctx.globalAlpha = t * 0.8;
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(0, 0, d.r * t, 0, Math.PI*2); ctx.fill();
        // sparkle cross
        ctx.strokeStyle = "#fff"; ctx.globalAlpha = t * 0.5; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(-d.r*2*t,0); ctx.lineTo(d.r*2*t,0); ctx.moveTo(0,-d.r*2*t); ctx.lineTo(0,d.r*2*t); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); canvas.remove(); });
  }

  /* ---- Rune circle ---- */
  if (enabled.has("rune")) {
    const host = document.createElement("div");
    host.className = "fx-rune";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
    const ring = document.createElement("div");
    ring.className = "fx-rune-ring";
    host.appendChild(ring);
    let px = innerWidth/2, py = innerHeight/2, x = px, y = py;
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; };
    window.addEventListener("pointermove", onMove, { passive: true });
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 16.7; last = now;
      x += (px - x) * 0.18 * dt; y += (py - y) * 0.18 * dt;
      host.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      ring.style.transform = `rotate(${(now/40).toFixed(1)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); host.remove(); });
  }

  /* ---- Firefly swarm ---- */
  if (enabled.has("firefly")) {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-firefly";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = innerWidth, h = innerHeight;
    const resize = () => { w = innerWidth; h = innerHeight; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); canvas.style.width=`${w}px`; canvas.style.height=`${h}px`; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize(); window.addEventListener("resize", resize);
    const N = Math.round(18 * scale);
    type F = { x:number;y:number;vx:number;vy:number;phase:number };
    let px = innerWidth/2, py = innerHeight/2;
    const flies: F[] = Array.from({length:N}, () => ({ x: Math.random()*w, y: Math.random()*h, vx:0, vy:0, phase: Math.random()*Math.PI*2 }));
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; };
    window.addEventListener("pointermove", onMove, { passive: true });
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 16.7; last = now;
      ctx.clearRect(0, 0, w, h);
      for (const f of flies) {
        const dx = px - f.x, dy = py - f.y;
        const d = Math.hypot(dx, dy) || 1;
        const pull = Math.min(0.6, 80 / d);
        f.vx += (dx/d) * pull * 0.02 * dt; f.vy += (dy/d) * pull * 0.02 * dt;
        f.vx *= 0.96; f.vy *= 0.96;
        f.x += f.vx * dt + Math.sin(now/1000 + f.phase) * 0.3 * dt;
        f.y += f.vy * dt + Math.cos(now/1200 + f.phase) * 0.3 * dt;
        if (f.x < 0) f.x = w; if (f.x > w) f.x = 0; if (f.y < 0) f.y = h; if (f.y > h) f.y = 0;
        const glow = 0.5 + 0.5 * Math.sin(now/600 + f.phase);
        ctx.globalAlpha = 0.6 + 0.4 * glow;
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(f.x, f.y, 2.2, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.15 * glow;
        ctx.beginPath(); ctx.arc(f.x, f.y, 8, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); canvas.remove(); });
  }

  const onVis = () => { /* no-op: individual rafs handle via visibility not needed */ };
  document.addEventListener("visibilitychange", onVis);
  cleanups.push(() => { window.removeEventListener("pf:theme", onTheme); document.removeEventListener("visibilitychange", onVis); });

  return () => cleanups.forEach((fn) => fn());
}
