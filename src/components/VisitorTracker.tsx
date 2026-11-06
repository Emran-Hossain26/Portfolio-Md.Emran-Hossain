"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party page tracker (MISSING-TASKS A8) — feeds /api/track →
 * visitor_events → the /admin/analytics charts. Privacy rules: honoured
 * Do-Not-Track, no cookies set client-side (the server rotates a session
 * cookie), no raw IP stored, prefetch/RSC pings ignored.
 */
export function VisitorTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;

    const nav =
      typeof navigator !== "undefined"
        ? (navigator as Navigator & { doNotTrack?: string; msDoNotTrack?: string })
        : null;
    const dnt =
      nav?.doNotTrack === "1" ||
      nav?.msDoNotTrack === "1" ||
      (typeof window !== "undefined" &&
        "doNotTrack" in window &&
        (window as unknown as { doNotTrack?: string }).doNotTrack === "1");
    if (dnt) return;

    const payload = {
      path: pathname,
      title: document.title,
      referrer: document.referrer,
      theme: document.documentElement.dataset.theme ?? "",
      effects: document.documentElement.getAttribute("data-fx-cursor") === "on",
    };
    try {
      navigator.sendBeacon("/api/track", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    } catch {
      // Tracking must never break the page.
    }
  }, [pathname]);

  return null;
}
