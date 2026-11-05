"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readFx, subscribeFx } from "@/lib/fx-client";

/**
 * Click ripple: a quiet accent ring expands from every mouse click.
 * Desktop (pointer: fine) and motion-safe only; honours the master effects
 * switch and the "click_ripple" flag.
 */
export function ClickRipple() {
  const enabled = useSyncExternalStore(
    subscribeFx,
    () => readFx("click_ripple"),
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const ring = document.createElement("span");
      ring.className = "fx-ripple";
      ring.style.left = `${e.clientX}px`;
      ring.style.top = `${e.clientY}px`;
      document.body.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, [enabled]);

  if (!enabled) return null;
  return null; // rings are appended to <body> directly
}
