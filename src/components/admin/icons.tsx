/**
 * Admin panel icons — Lucide-style inline SVG (24px stroke icons).
 * No icon-font CDN, no emoji: crisp, theme-aware, tree-shakeable.
 */
type P = { className?: string; size?: number };
const base = (p: P) => ({
  width: p.size ?? 18,
  height: p.size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: p.className,
  "aria-hidden": true,
});

export const IconZap = (p: P) => (
  <svg {...base(p)}><path d="M13 2 3 14h7l-1 8 11-13h-7l1-5z" /></svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
);
export const IconHeading = (p: P) => (
  <svg {...base(p)}><path d="M6 4v12" /><path d="M18 4v12" /><path d="M6 10h12" /></svg>
);
export const IconPalette = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18" /><circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" /></svg>
);
export const IconEye = (p: P) => (
  <svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconBriefcase = (p: P) => (
  <svg {...base(p)}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
export const IconFeather = (p: P) => (
  <svg {...base(p)}><path d="M20 4c-6 0-13 3-15 12l-2 4 4-2c9-2 12-9 13-14z" /><path d="M4 20c2-6 6-10 12-12" /></svg>
);
export const IconStar = (p: P) => (
  <svg {...base(p)}><path d="m12 3 2.7 5.7 6.3.9-4.5 4.4 1 6-5.5-2.9L6.5 20l1-6L3 9.6l6.3-.9z" /></svg>
);
export const IconTimeline = (p: P) => (
  <svg {...base(p)}><path d="M3 5h6M3 12h10M3 19h7" /><circle cx="17" cy="5" r="2" /><circle cx="19" cy="12" r="2" /><circle cx="16" cy="19" r="2" /></svg>
);
export const IconGraduation = (p: P) => (
  <svg {...base(p)}><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" /></svg>
);
export const IconFileUp = (p: P) => (
  <svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="m9 15 3-3 3 3" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>
);
export const IconShuffle = (p: P) => (
  <svg {...base(p)}><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="m15 15 6 6" /><path d="M4 4l5 5" /></svg>
);
export const IconPulse = (p: P) => (
  <svg {...base(p)}><path d="M3 12h4l2-7 4 14 2-7h6" /></svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}><path d="m10.3 3.9-8.5 14a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3l-8.5-14a2 2 0 0 0-3.4 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
export const IconLayers = (p: P) => (
  <svg {...base(p)}><path d="m12 2 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
);
