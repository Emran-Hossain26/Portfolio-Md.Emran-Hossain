"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated counter for the stats cards: counts up to the number when the
 * card first enters the viewport, keeping any suffix ("5+" → 5+, "24/7" →
 * 24/7). Renders the final value in server HTML; the count-up is a
 * post-hydration enhancement, so no-JS visitors see the real numbers.
 */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.dataset.effects === "off") return;
    const m = value.match(/^(\d+)(.*)$/);
    if (!m) return;
    const target = parseInt(m[1], 10);
    const suffix = m[2];
    if (!Number.isFinite(target) || target === 0) return;

    let raf = 0;
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      const t0 = performance.now();
      const DURATION = 900;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / DURATION);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(`${Math.round(target * eased)}${suffix}`);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setDisplay(`0${suffix}`);
      raf = requestAnimationFrame(tick);
    };

    if (el.getBoundingClientRect().top <= window.innerHeight) {
      // Already visible at mount — count immediately (slight delay so the
      // page settles first).
      const t = setTimeout(run, 250);
      return () => clearTimeout(t);
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return <span ref={ref}>{display}</span>;
}
