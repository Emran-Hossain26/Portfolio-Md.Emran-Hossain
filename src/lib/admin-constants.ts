/** Paths that get per-page per-language SEO overrides in the admin. */
export const SEO_PATHS = [
  "/",
  "/projects",
  "/blog",
  "/about",
  "/contact",
  "/testimonials",
] as const;

/** Admin sections shown in the dashboard / sidebar. */
export const ADMIN_SECTIONS = [
  { href: "/admin/texts", label: "Hero texts" },
  { href: "/admin/theme", label: "Theme colours" },
  { href: "/admin/themes", label: "Visitor themes" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/cv", label: "CV upload" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/redirects", label: "Redirects" },
  { href: "/admin/seo-health", label: "SEO Health" },
] as const;
