"use client";

import { useState } from "react";

export type SeoDefaults = {
  slug: string;
  seo_title_en: string;
  seo_title_bn: string;
  seo_desc_en: string;
  seo_desc_bn: string;
  seo_keywords: string;
  og_image: string;
  canonical: string;
  noindex: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);

/**
 * Task U4 shared SEO section: meta title/description (EN/BN) with character
 * counts, keywords, custom slug (auto-generate + manual edit), Open Graph
 * fields, canonical URL and index/no-index — with a live Google-style preview.
 */
export function SeoFields({ defaults, titleSource }: { defaults: SeoDefaults; titleSource: "title_en" | "role_en" }) {
  const [seoTitle, setSeoTitle] = useState(defaults.seo_title_en);
  const [seoDesc, setSeoDesc] = useState(defaults.seo_desc_en);
  const [slug, setSlug] = useState(defaults.slug);
  const [noindex, setNoindex] = useState(defaults.noindex);

  const genSlug = () => {
    const el = document.querySelector<HTMLInputElement>(`[name="${titleSource}"]`);
    if (el?.value) setSlug(slugify(el.value));
  };

  const shownTitle = (seoTitle || "").slice(0, 60) || (document.querySelector<HTMLInputElement>(`[name="${titleSource}"]`)?.value ?? "Page title").slice(0, 60);
  const shownDesc = (seoDesc || "").slice(0, 160) || "Add a meta description to control how this record appears in search results.";

  return (
    <div>
      <label>
        SEO meta title (EN) — 50–60 chars recommended
        <input type="text" name="seo_title_en" defaultValue={defaults.seo_title_en} maxLength={120} onChange={(e) => setSeoTitle(e.target.value)} />
        <small style={{ color: seoTitle.length > 60 ? "var(--bad)" : "var(--mut)", display: "block" }}>{seoTitle.length}/60·120</small>
      </label>
      <label>
        SEO meta title (BN)
        <input type="text" name="seo_title_bn" defaultValue={defaults.seo_title_bn} maxLength={120} />
      </label>
      <label>
        SEO meta description (EN) — 140–160 chars recommended
        <textarea name="seo_desc_en" defaultValue={defaults.seo_desc_en} rows={3} maxLength={400} onChange={(e) => setSeoDesc(e.target.value)} />
        <small style={{ color: seoDesc.length > 160 ? "var(--bad)" : "var(--mut)", display: "block" }}>{seoDesc.length}/160·400</small>
      </label>
      <label>
        SEO meta description (BN)
        <textarea name="seo_desc_bn" defaultValue={defaults.seo_desc_bn} rows={3} maxLength={400} />
      </label>
      <label>
        SEO keywords (comma-separated)
        <input type="text" name="seo_keywords" defaultValue={defaults.seo_keywords} maxLength={300} />
      </label>
      <label>
        Custom URL slug (lowercase, digits, dashes — must be unique)
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" name="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} maxLength={80} required style={{ flex: 1 }} />
          <button type="button" className="btn s" onClick={genSlug}>Generate from title</button>
        </div>
      </label>
      <label>
        Open Graph image URL (social share card)
        <input type="text" name="og_image" defaultValue={defaults.og_image} />
      </label>
      <label>
        Canonical URL (optional)
        <input type="text" name="canonical" defaultValue={defaults.canonical} />
      </label>
      <label>
        <input type="checkbox" name="noindex" defaultChecked={defaults.noindex} checked={noindex} onChange={(e) => setNoindex(e.target.checked)} style={{ marginRight: 8 }} />
        No-index (hide from search engines)
      </label>

      {/* Live SERP-style preview */}
      <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, marginTop: 6, background: "var(--bg)" }}>
        <small style={{ color: "var(--mut)" }}>Search preview{noindex ? " — currently no-index" : ""}</small>
        <div style={{ marginTop: 6 }}>
          <div style={{ color: "var(--mut)", fontSize: 12 }}>{slug || "slug"} · example.com</div>
          <div style={{ color: "#1a0dab", fontSize: 18, lineHeight: 1.3 }}>{shownTitle || "Page title"}</div>
          <div style={{ color: "var(--mut)", fontSize: 13 }}>{shownDesc}</div>
        </div>
      </div>
    </div>
  );
}
