/**
 * "Animation" group module (dynamically imported — never in the initial
 * bundle): scroll reveal, animated counters, h1 scramble (once/session),
 * 3D tilt, hero parallax and the reading-progress bar. Transform/opacity
 * only; every piece no-ops when its element is absent (non-home pages).
 */

export function start({ intensity }: { intensity: string }) {
  const cleanups: (() => void)[] = [];
  // Stage 6: admin override_reduced (pre-paint attribute) beats this check.
  const rm = document.documentElement.dataset.fxRmOverride !== "1" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (rm) return () => {};
  // Intensity scales the scramble length and counter duration.
  const iscale = intensity === "low" ? 0.7 : intensity === "high" ? 1.3 : 1;

  /* ---- Scroll reveal (server HTML stays visible; we only hide what is
         below the fold, then reveal on first intersection) ---- */
  const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  const hidden = new Set<HTMLElement>();
  for (const el of revealEls) {
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add("reveal-hidden");
      hidden.add(el);
    }
  }
  if (hidden.size) {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-hidden");
            hidden.delete(entry.target as HTMLElement);
            obs.unobserve(entry.target);
          }
        }
        if (!hidden.size) obs.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    hidden.forEach((el) => obs.observe(el));
    cleanups.push(() => {
      obs.disconnect();
      hidden.forEach((el) => el.classList.remove("reveal-hidden"));
    });
  }

  /* ---- Animated counters (server HTML holds the final number) ---- */
  const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-countup]"));
  const cObs = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        cObs.unobserve(entry.target);
        const el = entry.target as HTMLElement;
        const m = (el.textContent ?? "").match(/^(\d+)(.*)$/);
        if (!m) continue;
        const target = parseInt(m[1], 10);
        const suffix = m[2];
        const t0 = performance.now();
        const DURATION = Math.round(900 / iscale);
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / DURATION);
          el.textContent = `${Math.round(target * (1 - Math.pow(1 - p, 3)))}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = `${target}${suffix}`;
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.4 },
  );
  counters.forEach((el) => cObs.observe(el));
  cleanups.push(() => cObs.disconnect());

  /* ---- h1 scramble, once per session, post-paint (LCP untouched) ---- */
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
          else {
            h1.textContent = finalText;
            try { sessionStorage.setItem("fx_scrambled", "1"); } catch {}
          }
        };
        const t = setTimeout(() => requestAnimationFrame(step), 350);
        cleanups.push(() => {
          clearTimeout(t);
          h1.textContent = finalText;
        });
      }
    }
  } catch {}

  /* ---- 3D tilt cards ---- */
  let last: HTMLElement | null = null;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const card = (e.target as Element | null)?.closest?.(".card") as HTMLElement | null;
    if (card !== last) {
      last?.style.setProperty("transform", "");
      last = card;
    }
    if (!card) return;
    const r = card.getBoundingClientRect();
    if (!r.height || !r.width) return;
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
    card.style.transform = `perspective(720px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  };
  document.addEventListener("pointermove", onMove, { passive: true });
  cleanups.push(() => {
    document.removeEventListener("pointermove", onMove);
    last?.style.setProperty("transform", "");
  });

  /* ---- Hero parallax (portrait only) ---- */
  let praf = 0;
  const ptick = () => {
    const photo = document.querySelector<HTMLElement>(".hero .photo");
    if (photo) {
      const y = Math.min(window.scrollY, 600) * -0.055;
      photo.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    }
    praf = requestAnimationFrame(ptick);
  };
  praf = requestAnimationFrame(ptick);
  cleanups.push(() => {
    cancelAnimationFrame(praf);
    document.querySelector<HTMLElement>(".hero .photo")?.style.setProperty("transform", "");
  });

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
  cleanups.push(() => {
    cancelAnimationFrame(braf);
    bar.remove();
  });

  return () => cleanups.forEach((fn) => fn());
}
