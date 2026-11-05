"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readFx, subscribeFx } from "@/lib/fx-client";

/**
 * 3D tilt on cards: a few degrees of perspective rotation following the
 * pointer, resetting on leave. Desktop (pointer: fine) and motion-safe
 * only; honours the master effects switch and the "tilt_cards" flag.
 * Renders nothing — it drives styles on the existing .card elements.
 */
export function TiltCards() {
  const enabled = useSyncExternalStore(
    subscribeFx,
    () => readFx("tilt_cards"),
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let last: HTMLElement | null = null;
    const MAX_DEG = 5;

    const reset = (el: HTMLElement) => {
      el.style.transform = "";
    };

    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.(".card") as HTMLElement | null;
      if (card !== last) {
        if (last) reset(last);
        last = card;
      }
      if (!card) return;
      const r = card.getBoundingClientRect();
      if (r.height === 0 || r.width === 0) return;
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -2 * MAX_DEG;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 2 * MAX_DEG;
      card.style.transform = `perspective(720px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (last) reset(last);
    };
  }, [enabled]);

  return null;
}
