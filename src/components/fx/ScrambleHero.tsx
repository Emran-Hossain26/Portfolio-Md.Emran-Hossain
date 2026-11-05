"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readFx, subscribeFx } from "@/lib/fx-client";

/**
 * Hero headline scramble: on the first visit of a session the h1 resolves
 * from shuffled characters into the real copy (~0.9s, after first paint so
 * LCP is untouched). Runs once per session; every later navigation shows
 * the plain headline. Motion-safe only; skipped entirely when effects are
 * off or reduced motion is requested. Server HTML always contains the real
 * text — this is a progressive enhancement over it.
 */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+<>/";

export function ScrambleHero() {
  const enabled = useSyncExternalStore(
    subscribeFx,
    () => readFx("scramble_fx"),
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("fx_scrambled") === "1") return;
    } catch {}
    const h1 = document.getElementById("h1");
    if (!h1) return;
    const finalText = h1.textContent ?? "";
    if (!finalText) return;

    let frame = 0;
    const TOTAL = 26;
    let raf = 0;
    const step = () => {
      frame += 1;
      if (document.documentElement.dataset.effects === "off") {
        h1.textContent = finalText; // visitor switched off mid-animation
        try { sessionStorage.setItem("fx_scrambled", "1"); } catch {}
        return;
      }
      const reveal = Math.floor((frame / TOTAL) * finalText.length);
      let out = finalText.slice(0, reveal);
      for (let i = reveal; i < finalText.length; i++) {
        const ch = finalText[i];
        out += /\s/.test(ch) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      h1.textContent = out;
      if (frame < TOTAL) {
        raf = requestAnimationFrame(step);
      } else {
        h1.textContent = finalText;
        try { sessionStorage.setItem("fx_scrambled", "1"); } catch {}
      }
    };
    const start = setTimeout(() => { raf = requestAnimationFrame(step); }, 350);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(raf);
      h1.textContent = finalText;
    };
  }, [enabled]);

  return null;
}
