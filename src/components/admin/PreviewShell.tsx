"use client";

import { useState } from "react";
import Link from "next/link";

const WIDTHS = [
  { key: "desktop", label: "Desktop", width: "100%" },
  { key: "tablet", label: "Tablet", width: "768px" },
  { key: "mobile", label: "Mobile", width: "390px" },
] as const;

/**
 * Task U4 preview wrapper: device-size toggles around the real public
 * rendering passed as children from the server page. Preview never changes
 * publishing status — the parent server page is admin-gated and renders any
 * status on purpose.
 */
export function PreviewShell({
  module,
  backHref,
  revisionsHref,
  children,
}: {
  module: string;
  backHref: string;
  revisionsHref: string;
  children: React.ReactNode;
}) {
  const [device, setDevice] = useState<(typeof WIDTHS)[number]["key"]>("desktop");
  const width = WIDTHS.find((w) => w.key === device)?.width ?? "100%";

  return (
    <div>
      <div className="c" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <strong>Preview — {module}</strong>
        {WIDTHS.map((w) => (
          <button
            key={w.key}
            type="button"
            className="btn s"
            onClick={() => setDevice(w.key)}
            style={device === w.key ? { background: "var(--acc)", borderColor: "var(--acc)", color: "#fff" } : undefined}
            aria-pressed={device === w.key}
          >
            {w.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <Link className="btn" href={revisionsHref}>History</Link>
        <Link className="btn p" href={backHref}>← Back to editor</Link>
      </div>
      <div style={{ margin: "0 auto", width, maxWidth: "100%", transition: "width .2s" }}>
        {children}
      </div>
    </div>
  );
}
