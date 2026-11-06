import { AdminShell } from "@/components/admin/AdminShell";
import { createServiceClient, adminConfigured } from "@/lib/supabase/service";

type Issue = { type: string; detail: string; info?: boolean };

type SeoRow = { path: string; lang: string; title: string; description: string };

/**
 * Automated SEO audit, run on demand against the live DB. Every check is
 * guarded: a missing table/column (migrations not yet applied) degrades to
 * a skipped check instead of a 500.
 */
export default async function SeoHealthPage() {
  const issues: Issue[] = [];
  if (adminConfigured()) {
    const db = createServiceClient();

    let seoRows: SeoRow[] = [];

    // --- page_seo checks (missing meta, duplicates, lengths) -------------
    try {
      const { data } = await db.from("page_seo").select("path,lang,title,description");
      seoRows = (data ?? []) as SeoRow[];
      for (const r of seoRows) {
        if (!r.title || !r.description) {
          issues.push({
            type: "Missing meta",
            detail: `${r.path} (${r.lang}): ${[!r.title && "title", !r.description && "description"].filter(Boolean).join(" + ")}`,
          });
        }
        if (r.title && r.title.length > 60) {
          issues.push({ type: "Title too long", detail: `${r.path} (${r.lang}): ${r.title.length} chars (max 60)` });
        }
        if (r.description && (r.description.length < 70 || r.description.length > 160)) {
          issues.push({
            type: "Description length",
            detail: `${r.path} (${r.lang}): ${r.description.length} chars (want 70–160)`,
          });
        }
      }
      const titles = seoRows.map((r) => r.title).filter(Boolean);
      for (const d of new Set(titles.filter((t, i) => titles.indexOf(t) !== i))) {
        issues.push({ type: "Duplicate title", detail: `"${d}"` });
      }
      for (const path of ["/", "/projects", "/blog", "/about", "/contact", "/testimonials"]) {
        if (!seoRows.some((r) => r.path === path)) {
          issues.push({ type: "Missing page SEO", detail: `${path} (no row in page_seo)` });
        }
      }
    } catch {
      issues.push({ type: "Skipped", detail: "page_seo table unavailable (run migrations)", info: true });
    }

    // --- media alt text ---------------------------------------------------
    try {
      const { data: media } = await db.from("media_assets").select("url,alt_en,alt_bn");
      for (const m of media ?? []) {
        if (!m.alt_en && !m.alt_bn) {
          issues.push({ type: "Missing alt text", detail: m.url });
        }
      }
    } catch {
      issues.push({ type: "Skipped", detail: "media_assets table unavailable (run migrations)", info: true });
    }

    // --- posts: thin content, og_image, noindex, orphans, broken links ----
    let postSlugs = new Set<string>();
    try {
      const { data: posts } = await db
        .from("posts")
        .select("slug,bn_slug,status,noindex,title_en,body_en,body_bn,og_image,categories,tags");
      const rows = (posts ?? []) as {
        slug: string; bn_slug: string | null; status: string | null; noindex: boolean | null;
        title_en: string | null; body_en: string | null; body_bn: string | null;
        og_image: string | null; categories: string[] | null; tags: string[] | null;
      }[];
      postSlugs = new Set(rows.flatMap((r) => [r.slug, r.bn_slug].filter(Boolean) as string[]));

      for (const p of rows) {
        const words = `${p.body_en ?? ""} ${p.body_bn ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
        if (words < 100) {
          issues.push({ type: "Thin content", detail: `${p.slug} (${words} words)` });
        }
        const published = (p.status ?? "published") === "published";
        if (published && !p.og_image) {
          issues.push({ type: "Missing og_image", detail: `${p.slug} — falls back to the site default share image`, info: true });
        }
        if (p.noindex) {
          issues.push({ type: "noindex post", detail: `${p.slug} — excluded from sitemap and search`, info: true });
        }
        // Orphan: published post with no internal link to another page.
        if (published) {
          const body = `${p.body_en ?? ""}\n${p.body_bn ?? ""}`;
          const internal = body.match(/\]\(\/(?:blog|projects|about|contact)[^)]*\)/g) ?? [];
          const selfLinks = internal.filter((l) => l.includes(`/${p.slug}`));
          if (internal.length - selfLinks.length === 0) {
            issues.push({ type: "Orphan post", detail: `${p.slug} — no internal links in the body`, info: true });
          }
          // Broken internal links to posts/projects that do not exist.
          for (const link of internal) {
            const m = link.match(/\]\(\/(?:blog|projects)\/([a-z0-9-]+)/);
            if (m && !postSlugs.has(m[1])) {
              issues.push({ type: "Broken internal link", detail: `${p.slug} → ${m[1]}` });
            }
          }
        }
      }
    } catch {
      issues.push({ type: "Skipped", detail: "posts checks unavailable (run the blog migrations)", info: true });
    }

    // --- projects og_image -------------------------------------------------
    try {
      const { data: projects } = await db.from("projects").select("slug,og_image").eq("published", true);
      for (const pr of projects ?? []) {
        if (!pr.og_image) {
          issues.push({ type: "Missing og_image", detail: `project ${pr.slug} — falls back to the site default share image`, info: true });
        }
      }
    } catch {
      /* projects.og_image column arrives with migration 20261108; skip quietly */
    }

    // --- thin archives (fewer than 2 posts) --------------------------------
    try {
      const { data: posts } = await db.from("posts").select("status,noindex,categories,tags");
      const catCounts = new Map<string, number>();
      const tagCounts = new Map<string, number>();
      for (const p of (posts ?? []) as { status: string | null; noindex: boolean | null; categories: string[] | null; tags: string[] | null }[]) {
        if ((p.status ?? "published") !== "published" || p.noindex) continue;
        for (const c of p.categories ?? []) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
        for (const t of p.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
      for (const [c, n] of catCounts) {
        if (n < 2) issues.push({ type: "Thin archive", detail: `category "${c}" has ${n} post(s) — archive is noindexed until 2+`, info: true });
      }
      for (const [t, n] of tagCounts) {
        if (n < 2) issues.push({ type: "Thin archive", detail: `tag "${t}" has ${n} post(s) — archive is noindexed until 2+`, info: true });
      }
    } catch {
      /* covered by the posts skip above */
    }
  }

  const errors = issues.filter((i) => !i.info);
  const notes = issues.filter((i) => i.info);

  // Mockup slide "SEO health": a 0-100 score ring (errors weigh 8, notes 2).
  const rawScore = 100 - errors.length * 8 - notes.length * 2;
  const score = Math.max(0, Math.min(100, rawScore));

  return (
    <AdminShell current="/admin/seo-health" heading="SEO Health">
      <p className="admin-note">
        Automated checks: missing/short/duplicate meta, alt text, thin content,
        og_image coverage, noindex and orphan posts, broken internal links and
        thin archives. Items marked as notes are recommendations, not errors.
      </p>
      {/* Mockup slide "SEO health": score ring */}
      <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
        <div
          className="ring"
          style={{ margin: 0, "--p": score } as React.CSSProperties}
          role="img"
          aria-label={`SEO health score ${score} of 100`}
        >
          <span>{score}</span>
        </div>
      </div>
      {errors.length === 0 ? (
        <p className="admin-check pass">No issues found.</p>
      ) : (
        <ul style={{ display: "grid", gap: 6, listStyle: "none", padding: 0 }}>
          {errors.map((issue, i) => (
            <li key={i} className="admin-check fail">
              <b>{issue.type}:</b> {issue.detail}
            </li>
          ))}
        </ul>
      )}
      {notes.length > 0 ? (
        <>
          <h3 style={{ margin: "18px 0 8px", fontSize: 15 }}>Recommendations</h3>
          <ul style={{ display: "grid", gap: 6, listStyle: "none", padding: 0 }}>
            {notes.map((issue, i) => (
              <li key={i} className="admin-check pass" style={{ color: "var(--mute)" }}>
                <b>{issue.type}:</b> {issue.detail}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="admin-note" style={{ marginTop: 18 }}>
        Errors: {errors.length} · Recommendations: {notes.length}
      </p>
    </AdminShell>
  );
}
