"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

/**
 * Loads Google Analytics (gtag) only when an ID is configured AND the
 * visitor has not enabled Do Not Track. Renders nothing otherwise.
 * DNT is read via useSyncExternalStore so server prerender (null) and the
 * client (stored choice) never disagree at hydration.
 */
export function Analytics({ id }: { id: string }) {
  const allowed = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof navigator === "undefined") return false;
      const dnt =
        navigator.doNotTrack === "1" ||
        (window as unknown as { doNotTrack?: string }).doNotTrack === "1" ||
        (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack === "1";
      return !dnt;
    },
    () => false,
  );

  if (!id || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}