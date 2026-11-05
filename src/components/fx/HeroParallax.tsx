"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readFx, subscribeFx } from "@/lib/fx-client";

/**
 * Hero parallax: the portrait (and only the portrait) drifts up slightly
 * slower than the page while the hero is on screen — a few pixels of depth,
 * no layout shift (transform only). Motion-safe only.
 */
export function HeroParallax() {
  const enabled = useSyncExternalStore(
    subscribeFx,
    () => readFx("parallax_fx"),
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const tick = () => {
      const photo = document.querySelector<HTMLElement>(".hero .photo");
      if (photo) {
        const y = Math.min(window.scrollY, 600) * -0.055;
        photo.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.querySelector<HTMLElement>(".hero .photo")?.style.setProperty("transform", "");
    };
  }, [enabled]);

  return null;
}
