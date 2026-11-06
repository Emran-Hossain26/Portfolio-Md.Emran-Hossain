"use client";

import { useEffect, useState } from "react";
import { AdminPreview } from "@/components/AdminPreview";
import { VisitorCustomizer, type CustomizerSection, type CustomizerTheme } from "@/components/VisitorCustomizer";

/**
 * The preview dock on the public site (user requirement: "Admin preview eta
 * must thakbe" + a separate visitor customizer):
 *  - admins (logged in) get the full AdminPreview drawer;
 *  - visitors get a session-only customizer whose changes vanish on reload.
 * The role check is a lightweight fetch; nothing renders until it resolves,
 * so visitors never see the admin tooling flash.
 */
export function PreviewDock({
  allowed,
  sections,
  themes,
}: {
  allowed: Record<"animation" | "cursor" | "magical", boolean>;
  sections: CustomizerSection[];
  themes: CustomizerTheme[];
}) {
  const [role, setRole] = useState<"unknown" | "admin" | "visitor">("unknown");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/is-admin")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { admin?: boolean }) => {
        if (!cancelled) setRole(j.admin ? "admin" : "visitor");
      })
      .catch(() => !cancelled && setRole("visitor"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (role === "unknown") return null;
  if (role === "admin") return <AdminPreview allowed={allowed} />;
  return <VisitorCustomizer sections={sections} themes={themes} />;
}
