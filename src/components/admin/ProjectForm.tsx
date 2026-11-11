"use client";

import { useState } from "react";
import Link from "next/link";
import { saveCmsAction } from "@/app/(admin)/admin/cms/actions";
import { SeoFields, type SeoDefaults } from "./SeoFields";
import { SlidesEditor, type Slide } from "./SlidesEditor";

export type ProjectFormRow = {
  slug: string;
  title_en: string;
  title_bn: string;
  problem_en: string;
  problem_bn: string;
  solution_en: string;
  solution_bn: string;
  result_en: string;
  result_bn: string;
  metrics: { label: string; value: string }[];
  tech: string[];
  cover_url: string;
  category: string;
  project_type: string;
  role_en: string;
  role_bn: string;
  features_en: string;
  features_bn: string;
  media: string;
  video: string;
  slides: Slide[];
  demo_url: string;
  live_url: string;
  repo_url: string;
  status: string;
  pub_status: string;
  featured: boolean;
  sort_order: number;
  seo: SeoDefaults;
};

const TABS = ["Basics", "Media", "Technical", "Links", "Case study", "SEO", "Settings"] as const;

/**
 * Task U4 project editor: grouped tabs, Draft / Publish Now intents that
 * never silently change an existing record's status, preview link and the
 * shared SEO section.
 */
export function ProjectForm({
  id,
  row,
  error,
  isNew,
}: {
  id: string;
  row: ProjectFormRow;
  error?: string;
  isNew?: boolean;
}) {
  const [tab, setTab] = useState(0);
  const action = saveCmsAction.bind(null, "projects", id);
  const show = (index: number) => (tab === index ? undefined : ({ display: "none" } as const));

  return (
    <form action={action}>
      {error && (
        <p className="admin-note" style={{ borderColor: "var(--bad)", color: "var(--bad)", marginBottom: 12 }}>
          Save blocked: {error}
        </p>
      )}
      {!isNew && (
        <p className="admin-note" style={{ marginBottom: 12 }}>
          Current status: <b>{row.pub_status}</b> — Save keeps it; use the buttons below to change it explicitly.
        </p>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {TABS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setTab(index)}
            className="btn s"
            style={index === tab ? { background: "var(--acc)", borderColor: "var(--acc)", color: "#fff" } : undefined}
            aria-pressed={index === tab}
          >
            {label}
          </button>
        ))}
      </div>

      {/* A. Basic information */}
      <div className="c" style={show(0)}>
        <label>Project title (EN) *<input type="text" name="title_en" defaultValue={row.title_en} maxLength={140} required /></label>
        <label>Project title (BN)<input type="text" name="title_bn" defaultValue={row.title_bn} maxLength={140} /></label>
        <label>Short description (EN) — shown on the card<textarea name="problem_en" defaultValue={row.problem_en} rows={3} /></label>
        <label>Short description (BN)<textarea name="problem_bn" defaultValue={row.problem_bn} rows={3} /></label>
        <label>Full project description (EN)<textarea name="solution_en" defaultValue={row.solution_en} rows={5} /></label>
        <label>Full project description (BN)<textarea name="solution_bn" defaultValue={row.solution_bn} rows={5} /></label>
        <label>Project category (e.g. Web app, Infrastructure)<input type="text" name="category" defaultValue={row.category} maxLength={80} /></label>
        <label>
          Project type
          <select name="project_type" defaultValue={row.project_type}>
            <option value="">— none —</option>
            <option value="personal">Personal</option>
            <option value="professional">Professional</option>
            <option value="client">Client project</option>
          </select>
        </label>
      </div>

      {/* B. Project media */}
      <div className="c" style={show(1)}>
        <label>Cover / thumbnail image URL<input type="text" name="cover_url" defaultValue={row.cover_url} /></label>
        {row.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.cover_url} alt="Cover preview" style={{ maxWidth: 260, maxHeight: 150, borderRadius: 8, border: "1px solid var(--line)", marginBottom: 10 }} />
        ) : null}
        <label>Media area
          <select name="media" defaultValue={row.media}>
            <option value="slides">Slides / gallery</option>
            <option value="video">Promo video</option>
            <option value="none">None</option>
          </select>
        </label>
        <label>Promo video URL (Video mode only)<input type="text" name="video" defaultValue={row.video} /></label>
        {row.slug && <SlidesEditor initial={row.slides ?? []} slug={row.slug} />}
        <p className="admin-note">Gallery uploads go to the media storage with previews; drag ↑/↓ to reorder slides.</p>
      </div>

      {/* C. Technical information */}
      <div className="c" style={show(2)}>
        <label>Technologies / tools (comma-separated)<input type="text" name="tech" defaultValue={row.tech.join(", ")} /></label>
        <label>Key features (EN) — one per line<textarea name="features_en" defaultValue={row.features_en} rows={5} /></label>
        <label>Key features (BN)<textarea name="features_bn" defaultValue={row.features_bn} rows={5} /></label>
        <label>My role / responsibilities (EN)<input type="text" name="role_en" defaultValue={row.role_en} maxLength={200} /></label>
        <label>My role / responsibilities (BN)<input type="text" name="role_bn" defaultValue={row.role_bn} maxLength={200} /></label>
      </div>

      {/* D. Project links */}
      <div className="c" style={show(3)}>
        <label>Live project URL (preferred public link)<input type="text" name="live_url" defaultValue={row.live_url} /></label>
        <label>Repository / GitHub URL (adds a “Source” button)<input type="text" name="repo_url" defaultValue={row.repo_url} /></label>
        <label>Legacy demo URL<input type="text" name="demo_url" defaultValue={row.demo_url} /></label>
        <p className="admin-note">The on-site case study page (/projects/&lt;slug&gt;) is generated from this record — no external case-study URL needed.</p>
      </div>

      {/* Case study extras */}
      <div className="c" style={show(4)}>
        <label>Result (EN)<textarea name="result_en" defaultValue={row.result_en} rows={3} /></label>
        <label>Result (BN)<textarea name="result_bn" defaultValue={row.result_bn} rows={3} /></label>
        <label>Metrics (JSON) — [{"{"}&quot;label&quot;:&quot;Downtime&quot;,&quot;value&quot;:&quot;-90%&quot;{"}"}]<textarea name="metrics" defaultValue={JSON.stringify(row.metrics ?? [])} rows={3} /></label>
      </div>

      {/* E. SEO */}
      <div className="c" style={show(5)}>
        <SeoFields defaults={row.seo} titleSource="title_en" />
      </div>

      {/* F. Display + publishing settings */}
      <div className="c" style={show(6)}>
        <label>Project phase (shown as the “Running” badge on the site)
          <select name="status" defaultValue={row.status}>
            <option value="completed">completed</option>
            <option value="running">running</option>
            <option value="planned">planned</option>
            <option value="paused">paused</option>
          </select>
        </label>
        <label><input type="checkbox" name="featured" defaultChecked={row.featured} style={{ marginRight: 8 }} />Featured project</label>
        <label>Display order (lower first)<input type="number" name="sort_order" defaultValue={row.sort_order} min={0} max={9999} /></label>
        <p className="admin-note">Visibility is controlled by the publication buttons (Draft / Publish / Unpublish / Archive in the list).</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn p" type="submit" name="intent" value="keep">Save</button>
        <button className="btn" type="submit" name="intent" value="draft">Save as Draft</button>
        <button className="btn" type="submit" name="intent" value="publish">Publish Now</button>
        {!isNew && <Link className="btn" href={`/admin/preview/cms/projects/${id}`}>Preview</Link>}
        <Link className="btn" href="/admin/projects">Back to list</Link>
      </div>
    </form>
  );
}
