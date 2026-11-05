"use client";

import { useSyncExternalStore } from "react";
import { readFx, subscribeFx } from "@/lib/fx-client";

/**
 * Aurora glow: two large, heavily blurred accent blobs drifting behind the
 * whole page (z-index -1, above the body background). Pure CSS animation,
 * opacity-tuned per colour scheme. Hidden when effects are off; static
 * (no animation) under reduced motion via CSS.
 */
export function AuroraGlow() {
  const enabled = useSyncExternalStore(
    subscribeFx,
    () => readFx("aurora_fx"),
    () => false,
  );
  if (!enabled) return null;
  return (
    <div className="fx-aurora" aria-hidden="true">
      <span className="fx-aurora-blob fx-aurora-a" />
      <span className="fx-aurora-blob fx-aurora-b" />
    </div>
  );
}
