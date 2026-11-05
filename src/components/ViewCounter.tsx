"use client";

import { useEffect } from "react";

/**
 * Tiny, deferred view counter. Fires a single POST to /api/views after the
 * page has loaded, using sendBeacon so it never blocks rendering or
 * navigation. All anti-abuse logic (bots, prefetch, dedupe, rate limit)
 * lives server-side in the route handler.
 */
export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
    const id = window.setTimeout(() => {
      try {
        const blob = new Blob([JSON.stringify({ slug })], { type: "application/json" });
        navigator.sendBeacon("/api/views", blob);
      } catch {}
    }, 1200);
    return () => window.clearTimeout(id);
  }, [slug]);
  return null;
}