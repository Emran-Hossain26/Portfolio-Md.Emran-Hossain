/**
 * Re-mounts on every route change within the locale: gives page content a
 * quiet fade/rise transition. Purely CSS (opacity/transform, CLS-safe) and
 * gated behind html[data-effects="on"] + reduced-motion in globals.css.
 * Header/Footer live in the layout, so they stay put.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
