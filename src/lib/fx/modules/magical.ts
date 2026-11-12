export function start({ intensity, effects }: { intensity: string; effects?: string[] }) {
  const enabled = new Set(effects ?? ["aurora","network","starField","nebula","sparkleField"]);
  const cleanups: (() => void)[] = [];
  const rm = document.documentElement.dataset.fxRmOverride !== "1" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scale = intensity === "low" ? 0.55 : intensity === "high" ? 1.5 : 1;

  let accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2F6BFF";
  let ok = getComputedStyle(document.documentElement).getPropertyValue("--ok").trim() || accent;
  const onTheme = () => {
    const s = getComputedStyle(document.documentElement);
    accent = s.getPropertyValue("--accent").trim() || accent;
    ok = s.getPropertyValue("--ok").trim() || ok;
  };
  window.addEventListener("pf:theme", onTheme);

  /* ---- Aurora glow ---- */
  if (!rm && enabled.has("aurora")) {
    const aurora = document.createElement("div");
    aurora.className = "fx-aurora";
    aurora.setAttribute("aria-hidden", "true");
    aurora.innerHTML =
      `<span class="fx-aurora-blob fx-aurora-a" style="opacity:${(0.16 * scale).toFixed(2)}"></span>` +
      `<span class="fx-aurora-blob fx-aurora-b" style="opacity:${(0.13 * scale).toFixed(2)}"></span>`;
    document.body.appendChild(aurora);
    cleanups.push(() => aurora.remove());
  }

  /* ---- Hero network canvas ---- */
  if (!rm && enabled.has("network")) {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (hero) {
      const canvas = document.createElement("canvas");
      canvas.className = "hero-network";
      canvas.setAttribute("aria-hidden", "true");
      hero.prepend(canvas);
      const ctx = canvas.getContext("2d")!;
      const dpr = Math.min(2, devicePixelRatio || 1);
      let w = 0, h = 0, running = false, raf = 0;
      type Node = { x: number; y: number; vx: number; vy: number };
      let nodes: Node[] = [];
      const resize = () => {
        const rect = hero.getBoundingClientRect();
        w = rect.width; h = rect.height;
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(Math.round(52 * scale), Math.max(12, Math.round((w * h) / 24000)));
        nodes = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22 }));
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(hero);
      const LINK = 132;
      const tick = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = accent; ctx.fillStyle = accent; ctx.lineWidth = 1;
        for (const p of nodes) { p.x += p.vx; p.y += p.vy; if (p.x <= 0 || p.x >= w) p.vx *= -1; if (p.y <= 0 || p.y >= h) p.vy *= -1; }
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x; const dy = nodes[i].y - nodes[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 < LINK * LINK) { ctx.globalAlpha = 0.13 * (1 - Math.sqrt(d2) / LINK); ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); }
          }
        }
        ctx.globalAlpha = 0.32;
        for (const p of nodes) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      };
      const setRunning = () => {
        const onScreen = hero.getBoundingClientRect().bottom > 0;
        const should = !document.hidden && onScreen;
        if (should && !running) { running = true; raf = requestAnimationFrame(tick); }
        else if (!should && running) { running = false; cancelAnimationFrame(raf); }
      };
      const io = new IntersectionObserver(setRunning, { threshold: 0 });
      io.observe(hero);
      document.addEventListener("visibilitychange", setRunning);
      setRunning();
      cleanups.push(() => { running = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", setRunning); canvas.remove(); });
    }
  }

  /* ---- Star field ---- */
  if (!rm && enabled.has("starField")) {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-starfield";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = innerWidth, h = innerHeight;
    const resize = () => { w = innerWidth; h = innerHeight; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); canvas.style.width=`${w}px`; canvas.style.height=`${h}px`; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize(); window.addEventListener("resize", resize);
    const N = Math.round(120 * scale);
    const stars = Array.from({length:N}, () => ({ x: Math.random()*w, y: Math.random()*h, r: 0.4 + Math.random()*1.2, phase: Math.random()*Math.PI*2, speed: 0.3 + Math.random()*0.7 }));
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 16.7; last = now;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) { s.phase += s.speed * 0.02 * dt; const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.phase)); ctx.globalAlpha = a; ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); } else { last = performance.now(); raf = requestAnimationFrame(tick); } };
    document.addEventListener("visibilitychange", onVis);
    cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); canvas.remove(); });
  }

  /* ---- Nebula cloud ---- */
  if (!rm && enabled.has("nebula")) {
    const host = document.createElement("div");
    host.className = "fx-nebula";
    host.setAttribute("aria-hidden", "true");
    host.innerHTML = '<span class="fx-nebula-blob fx-nebula-a"></span><span class="fx-nebula-blob fx-nebula-b"></span><span class="fx-nebula-blob fx-nebula-c"></span>';
    document.body.appendChild(host);
    cleanups.push(() => host.remove());
  }

  /* ---- Sparkle field ---- */
  if (!rm && enabled.has("sparkleField")) {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-sparklefield";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = innerWidth, h = innerHeight;
    const resize = () => { w = innerWidth; h = innerHeight; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); canvas.style.width=`${w}px`; canvas.style.height=`${h}px`; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize(); window.addEventListener("resize", resize);
    const N = Math.round(60 * scale);
    type P = { x:number;y:number;vx:number;vy:number;r:number;life:number;max:number };
    let pts: P[] = [];
    const spawn = () => {
      if (pts.length > N) return;
      pts.push({ x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, r: 0.6+Math.random()*1.2, life: 0, max: 2000 + Math.random()*2000 });
    };
    for (let i = 0; i < N; i++) spawn();
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 16.7; last = now;
      ctx.clearRect(0, 0, w, h);
      pts = pts.filter((p) => p.life < p.max);
      while (pts.length < N) spawn();
      for (const p of pts) {
        p.life += dt * 16.7; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        const t = Math.max(0, 1 - p.life / p.max);
        ctx.globalAlpha = 0.5 * t;
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + 0.4*t), 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(tick); } };
    document.addEventListener("visibilitychange", onVis);
    cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); canvas.remove(); });
  }

  cleanups.push(() => window.removeEventListener("pf:theme", onTheme));
  return () => cleanups.forEach((fn) => fn());
}
