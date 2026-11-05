"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readFx, subscribeFx } from "@/lib/fx-client";

/**
 * Magnetic buttons: primary buttons and the theme select ease a few pixels
 * toward a nearby pointer and spring back on leave. Max 6px — noticeable,
 * never clownish. Desktop (pointer: fine) and motion-safe only.
 */
export function MagneticButtons() {
  const enabled = useSyncExternalStore(
    subscribeFx,
    () => readFx("magnetic_fx"),
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const SELECTOR = ".btn.p, .theme-select select, .admin-preview-fab";
    const MAX = 6;
    const RANGE = 72;
    const cleanups: (() => void)[] = [];

    for (const el of Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))) {
      let raf = 0;
      const move = (e: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          const near = dist < RANGE + Math.max(r.width, r.height) / 2;
          if (near) {
            const pull = 1 - Math.min(1, dist / (RANGE + Math.max(r.width, r.height) / 2));
            el.style.transform = `translate(${((dx / dist) * MAX * pull || 0).toFixed(1)}px, ${((dy / dist) * MAX * pull || 0).toFixed(1)}px)`;
          } else {
            el.style.transform = "";
          }
        });
      };
      const leave = () => {
        cancelAnimationFrame(raf);
        el.style.transform = "";
      };
      document.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerdown", leave, { passive: true });
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerdown", leave);
        el.style.transform = "";
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [enabled]);

  return null;
}
