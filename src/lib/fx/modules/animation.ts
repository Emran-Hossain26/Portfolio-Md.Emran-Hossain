export function start({ intensity, effects }: { intensity: string; effects?: string[] }) {
  const enabled = new Set(effects ?? ["tilt","parallax","scramble","counters","shimmer","cardGlow","sparkleBurst","floaters"]);
  const cleanups: (() => void)[] = [];
  const rm = document.documentElement.dataset.fxRmOverride !== "1" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (rm) return () => {};
  const iscale = intensity === "low" ? 0.7 : intensity === "high" ? 1.3 : 1;

  /* ---- Scroll reveal ---- */
  const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  const hidden = new Set<HTMLElement>();
  for (const el of revealEls) {
    if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("reveal-hidden"); hidden.add(el); }
  }
  if (hidden.size) {
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.remove("reveal-hidden"); hidden.delete(entry.target as HTMLElement); obs.unobserve(entry.target); }
      }
      if (!hidden.size) obs.disconnect();
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    hidden.forEach((el) => obs.observe(el));
    cleanups.push(() => { obs.disconnect(); hidden.forEach((el) => el.classList.remove("reveal-hidden")); });
  }

  /* ---- Animated counters ---- */
  if (enabled.has("counters")) {
    const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-countup]"));
    const cObs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        cObs.unobserve(entry.target);
        const el = entry.target as HTMLElement;
        const m = (el.textContent ?? "").match(/^(\d+)(.*)$/);
        if (!m) continue;
        const target = parseInt(m[1], 10); const suffix = m[2];
        const t0 = performance.now();
        const DURATION = Math.round(900 / iscale);
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / DURATION);
          el.textContent = `${Math.round(target * (1 - Math.pow(1 - p, 3)))}${suffix}`;
          if (p < 1) requestAnimationFrame(tick); else el.textContent = `${target}${suffix}`;
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    counters.forEach((el) => cObs.observe(el));
    cleanups.push(() => cObs.disconnect());
  }

  /* ---- h1 scramble ---- */
  if (enabled.has("scramble")) {
    try {
      if (sessionStorage.getItem("fx_scrambled") !== "1") {
        const h1 = document.getElementById("h1");
        if (h1 && h1.textContent) {
          const finalText = h1.textContent;
          const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+<>/";
          let frame = 0;
          const TOTAL = Math.round(26 * iscale);
          const step = () => {
            frame += 1;
            const reveal = Math.floor((frame / TOTAL) * finalText.length);
            let out = finalText.slice(0, reveal);
            for (let i = reveal; i < finalText.length; i++) {
              const ch = finalText[i];
              out += /\s/.test(ch) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
            h1.textContent = out;
            if (frame < TOTAL) requestAnimationFrame(step);
            else { h1.textContent = finalText; try { sessionStorage.setItem("fx_scrambled", "1"); } catch {} }
          };
          const t = setTimeout(() => requestAnimationFrame(step), 350);
          cleanups.push(() => { clearTimeout(t); h1.textContent = finalText; });
        }
      }
    } catch {}
  }

  /* ---- 3D tilt cards ---- */
  if (enabled.has("tilt")) {
    let last: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const card = (e.target as Element | null)?.closest?.(".card") as HTMLElement | null;
      if (card !== last) { last?.style.setProperty("transform", ""); last = card; }
      if (!card) return;
      const r = card.getBoundingClientRect();
      if (!r.height || !r.width) return;
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
      card.style.transform = `perspective(720px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    cleanups.push(() => { document.removeEventListener("pointermove", onMove); last?.style.setProperty("transform", ""); });
  }

  /* ---- Hero parallax ---- */
  if (enabled.has("parallax")) {
    let praf = 0;
    const ptick = () => {
      const photo = document.querySelector<HTMLElement>(".hero .photo");
      if (photo) { const y = Math.min(window.scrollY, 600) * -0.055; photo.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`; }
      praf = requestAnimationFrame(ptick);
    };
    praf = requestAnimationFrame(ptick);
    cleanups.push(() => { cancelAnimationFrame(praf); document.querySelector<HTMLElement>(".hero .photo")?.style.setProperty("transform", ""); });
  }

  /* ---- Reading progress bar ---- */
  const bar = document.createElement("div");
  bar.className = "fx-progress";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "Reading progress");
  document.body.appendChild(bar);
  let braf = 0;
  const btick = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = `scaleX(${p})`;
    braf = requestAnimationFrame(btick);
  };
  braf = requestAnimationFrame(btick);
  cleanups.push(() => { cancelAnimationFrame(braf); bar.remove(); });

  /* ---- Shimmer text ---- */
  if (enabled.has("shimmer")) {
    document.documentElement.setAttribute("data-fx-shimmer", "on");
    cleanups.push(() => document.documentElement.removeAttribute("data-fx-shimmer"));
  }

  /* ---- Card glow ---- */
  if (enabled.has("cardGlow")) {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const card = (e.target as Element | null)?.closest?.(".card") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${e.clientX - r.left}px`);
      card.style.setProperty("--gy", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    cleanups.push(() => document.removeEventListener("pointermove", onMove));
  }

  /* ---- Sparkle burst on click ---- */
  if (enabled.has("sparkleBurst")) {
    const onClick = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const host = document.createElement("div");
      host.style.position = "fixed"; host.style.left = `${e.clientX}px`; host.style.top = `${e.clientY}px`;
      host.style.pointerEvents = "none"; host.style.zIndex = "9999";
      document.body.appendChild(host);
      const N = 12;
      for (let i = 0; i < N; i++) {
        const s = document.createElement("span");
        s.style.position = "absolute"; s.style.width = "4px"; s.style.height = "4px";
        s.style.borderRadius = "50%"; s.style.background = "var(--accent)";
        s.style.left = "0"; s.style.top = "0";
        const a = (i / N) * Math.PI * 2;
        const dist = 30 + Math.random() * 20;
        s.animate([
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${Math.cos(a)*dist}px, ${Math.sin(a)*dist}px) scale(0)`, opacity: 0 },
        ], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" });
        host.appendChild(s);
      }
      setTimeout(() => host.remove(), 650);
    };
    document.addEventListener("pointerdown", onClick, { passive: true });
    cleanups.push(() => document.removeEventListener("pointerdown", onClick));
  }

  /* ---- Floating orbs (CSS) ---- */
  if (enabled.has("floaters")) {
    const host = document.createElement("div");
    host.className = "fx-floaters";
    host.setAttribute("aria-hidden", "true");
    host.innerHTML = '<span class="fx-orb fx-orb-a"></span><span class="fx-orb fx-orb-b"></span><span class="fx-orb fx-orb-c"></span>';
    document.body.appendChild(host);
    cleanups.push(() => host.remove());
  }

  return () => cleanups.forEach((fn) => fn());
}
