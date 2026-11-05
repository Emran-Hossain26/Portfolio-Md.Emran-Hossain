/**
 * "Magical animation" group module (dynamically imported): aurora glow
 * blobs + the hero network/constellation canvas (glow effects). Canvases
 * pause when the tab is hidden or the hero is off-screen; particle counts
 * scale with the admin intensity setting.
 */

export function start({ intensity }: { intensity: string }) {
  const cleanups: (() => void)[] = [];
  const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (rm) return () => {};
  const scale = intensity === "low" ? 0.55 : intensity === "high" ? 1.5 : 1;

  let accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2F6BFF";
  let ok = getComputedStyle(document.documentElement).getPropertyValue("--ok").trim() || accent;
  const onTheme = () => {
    const s = getComputedStyle(document.documentElement);
    accent = s.getPropertyValue("--accent").trim() || accent;
    ok = s.getPropertyValue("--ok").trim() || ok;
  };
  window.addEventListener("pf:theme", onTheme);

  /* ---- Aurora glow (CSS-animated blobs) ---- */
  const aurora = document.createElement("div");
  aurora.className = "fx-aurora";
  aurora.setAttribute("aria-hidden", "true");
  aurora.innerHTML =
    `<span class="fx-aurora-blob fx-aurora-a" style="opacity:${(0.16 * scale).toFixed(2)}"></span>` +
    `<span class="fx-aurora-blob fx-aurora-b" style="opacity:${(0.13 * scale).toFixed(2)}"></span>`;
  document.body.appendChild(aurora);
  cleanups.push(() => aurora.remove());

  /* ---- Hero network canvas ---- */
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
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      }));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(hero);

    const LINK = 132;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = accent;
      ctx.fillStyle = accent;
      ctx.lineWidth = 1;
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x <= 0 || p.x >= w) p.vx *= -1;
        if (p.y <= 0 || p.y >= h) p.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.globalAlpha = 0.13 * (1 - Math.sqrt(d2) / LINK);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 0.32;
      for (const p of nodes) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    // Run only while the tab is visible AND the hero is on screen.
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

    cleanups.push(() => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", setRunning);
      canvas.remove();
    });
  }

  cleanups.push(() => window.removeEventListener("pf:theme", onTheme));
  return () => cleanups.forEach((fn) => fn());
}
