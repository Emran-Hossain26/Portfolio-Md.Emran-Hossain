"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal wrapper: children fade/slide in the first time they enter
 * the viewport. Server-renders visible, so content is never lost without
 * JavaScript; the hidden state is applied client-side only to elements
 * still below the fold. Honors prefers-reduced-motion and the visitor
 * effects switch (html[data-effects="off"]) via CSS in globals.css.
 */
export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.documentElement.dataset.effects === "off") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only hide what the visitor cannot see yet (below the fold).
    if (el.getBoundingClientRect().top <= window.innerHeight) return;
    setHidden(true);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={"reveal" + (hidden ? " reveal-hidden" : "") + (className ? " " + className : "")}
    >
      {children}
    </div>
  );
}
