"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { readFx, subscribeFx } from "@/lib/fx-client";

/**
 * Cursor sparkle trail: tiny accent-coloured sparks fade out along the
 * pointer's path. Desktop (pointer: fine) and motion-safe only; honours
 * the master effects switch and the "Cursor sparkle trail" flag
 * (localStorage "cursor_fx" — the contract the preview panel writes).
 */
export function CursorTrail() {
  const enabled = useSyncExternalStore(
    subscribeFx,
    () => readFx("cursor_fx"),
    () => false,
  );
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let accent = "#2F6BFF";
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number };
    let sparks: Spark[] = [];

    const readColor = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      if (v) accent = v;
    };
    readColor();
    window.addEventListener("pf:theme", readColor);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      if (sparks.length > 140) return;
      const n = 2;
      for (let i = 0; i < n; i++) {
        sparks.push({
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6 - 0.15,
          life: 0,
          max: 420 + Math.random() * 260,
          r: 0.9 + Math.random() * 1.3,
        });
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accent;
      sparks = sparks.filter((s) => s.life < s.max);
      for (const s of sparks) {
        s.life += dt;
        s.x += s.vx * (dt / 16);
        s.y += s.vy * (dt / 16);
        const t = 1 - s.life / s.max;
        ctx.globalAlpha = 0.5 * t;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * t, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pf:theme", readColor);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas className="cursor-trail" ref={ref} aria-hidden="true" />;
}
