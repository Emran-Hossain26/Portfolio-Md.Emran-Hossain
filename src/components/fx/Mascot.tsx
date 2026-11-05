"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { readFx, subscribeFx } from "@/lib/fx-client";

/**
 * Site mascot: the watercolor butterfly from the login scene, miniaturised.
 * It eases after the pointer (slightly above-right), drifts on its own when
 * the pointer rests, flaps continuously and does a happy wobble on click.
 * Desktop (pointer: fine) and motion-safe only; unmounts when the visitor
 * turns "Mascot butterfly" or all effects off. Purely decorative.
 */
export function Mascot() {
  const enabled = useSyncExternalStore(
    subscribeFx,
    () => readFx("mascot_fx"),
    () => false,
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    // Motion-safe + desktop only; otherwise keep the mascot off-screen.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      el.style.display = "none";
      return;
    }

    let raf = 0;
    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2; // pointer
    let x = px;
    let y = py - 80; // mascot
    let vx = 0;
    let vy = 0;
    let lastMove = performance.now();
    let wob = 0; // click wobble impulse

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      lastMove = performance.now();
    };
    const onDown = () => {
      wob = 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 16.7;
      last = now;
      const idle = now - lastMove > 2600;
      // Target: hover above-right of the pointer, or wander when idle.
      const tx = idle
        ? window.innerWidth / 2 + Math.sin(now / 1700) * (window.innerWidth * 0.28)
        : px + 26;
      const ty = idle
        ? window.innerHeight * 0.3 + Math.sin(now / 2300) * 60
        : py - 30;
      vx += (tx - x) * 0.045 * dt;
      vy += (ty - y) * 0.045 * dt;
      vx *= 0.92;
      vy *= 0.92;
      x += vx * dt;
      y += vy * dt;
      wob *= 0.9;
      // Face the direction of travel; wobble adds a spin kick.
      const angle = Math.atan2(vy, vx) * (180 / Math.PI) + 90 + wob * 360;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${angle.toFixed(1)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className="fx-mascot" ref={ref} aria-hidden="true">
      <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
        <g className="fx-wing fx-wing-l">
          <path d="M19 20C15 10 6 6 3 9c-3 3 1 12 8 14-5 1-8 5-6 8 2 3 10 1 14-6Z" fill="var(--accent)" opacity="0.75" />
          <path d="M19 20C16 12 9 8 6 10c-2 2 1 9 7 11" fill="#fff" opacity="0.28" />
        </g>
        <g className="fx-wing fx-wing-r">
          <path d="M21 20c4-10 13-14 16-11 3 3-1 12-8 14 5 1 8 5 6 8-2 3-10 1-14-6Z" fill="var(--accent)" opacity="0.75" />
          <path d="M21 20c3-8 10-12 13-10 2 2-1 9-7 11" fill="#fff" opacity="0.28" />
        </g>
        <ellipse cx="20" cy="21" rx="1.7" ry="6.5" fill="var(--ink)" opacity="0.85" />
        <path d="M19 15c-2-3-4-4-6-4M21 15c2-3 4-4 6-4" stroke="var(--ink)" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      </svg>
    </div>
  );
}
