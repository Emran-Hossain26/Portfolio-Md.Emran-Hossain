"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
    __turnstileReady?: boolean;
  }
}

/**
 * Stage 6 item 4 — Cloudflare Turnstile widget. Renders nothing when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set (the server action then decides
 * dev-bypass vs reject). Writes the token into a hidden input named
 * "cf-turnstile-response" that the server actions verify.
 */
export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const holder = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (!siteKey || rendered.current) return;
    const tryRender = () => {
      if (!holder.current || rendered.current || !window.turnstile) return false;
      window.turnstile.render(holder.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          const input = holder.current?.parentElement?.querySelector<HTMLInputElement>(
            'input[name="cf-turnstile-response"]',
          );
          if (input) input.value = token;
        },
      });
      rendered.current = true;
      return true;
    };
    tryRender();
    const id = setInterval(() => {
      if (tryRender()) clearInterval(id);
    }, 400);
    return () => clearInterval(id);
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <input type="hidden" name="cf-turnstile-response" defaultValue="" />
      <div ref={holder} />
    </>
  );
}
