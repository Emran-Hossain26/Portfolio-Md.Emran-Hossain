"use client";

import { useState } from "react";
import Link from "next/link";
import { saveProjectAction } from "@/app/(admin)/admin/projects/actions";
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
  media: string;
  video: string;
  slides: Slide[];
  demo_url: string;
  live_url: string;
  repo_url: string;
  status: string;
  published: boolean;
  featured: boolean;
  sort_order: number;
};

const TABS = ["Basics", "Case study", "Tech tags", "Media", "Links", "Settings"] as const;

const STATUSES = ["running", "completed", "planned", "paused"] as const;

/**
 * Stage U2 tabbed project editor. One <form> → saveProjectAction (zod +
 * unique slug on the server); the tab bar only toggles which fields are
 * visible, so nothing is lost between tabs.
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
  const action = saveProjectAction.bind(null, id);

  const show = (index: number) => (tab === index ? undefined : ({ display: "none" } as const));

  return (
    <form action={action} className="admin-editor">
      {error && (
        <p className="admin-note" style={{ borderColor: "var(--bad)", color: "var(--bad)", marginBottom: 12 }}>
          Save blocked: {error}
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

      {/* --- Basics (tab 0) ------------------------------------------- */}
      <div className="c" style={show(0)}>
        <label>
          Title (EN) *
          <input type="text" name="title_en" defaultValue={row.title_en} maxLength={140} required />
        </label>
        <label>
          Title (BN)
          <input type="text" name="title_bn" defaultValue={row.title_bn} maxLength={140} />
        </label>
        <label>
          Slug (URL part, e.g. likhon-tools) * — lowercase letters, digits, dashes; must be unique
          <input type="text" name="slug" defaultValue={row.slug} maxLength={80} required />
        </label>
      </div>

      {/* --- Case study (tab 1) ---------------------------------------- */}
      <div className="c" style={show(1)}>
        <label>
          Problem (EN)
          <textarea name="problem_en" defaultValue={row.problem_en} rows={4} />
        </label>
        <label>
          Problem (BN)
          <textarea name="problem_bn" defaultValue={row.problem_bn} rows={4} />
        </label>
        <label>
          Solution / approach (EN)
          <textarea name="solution_en" defaultValue={row.solution_en} rows={4} />
        </label>
        <label>
          Solution / approach (BN)
          <textarea name="solution_bn" defaultValue={row.solution_bn} rows={4} />
        </label>
        <label>
          Result (EN) — case-study outcome
          <textarea name="result_en" defaultValue={row.result_en} rows={3} />
        </label>
        <label>
          Result (BN)
          <textarea name="result_bn" defaultValue={row.result_bn} rows={3} />
        </label>
        <label>
          Metrics (JSON, optional) — e.g. [{"{"}&quot;label&quot;:&quot;Downtime&quot;,&quot;value&quot;:&quot;-90%&quot;{"}"}]
          <textarea
            name="metrics"
            defaultValue={JSON.stringify(row.metrics ?? [], null, 0)}
            rows={3}
          />
        </label>
      </div>

      {/* --- Tech tags (tab 2) ------------------------------------------ */}
      <div className="c" style={show(2)}>
        <label>
          Tech tags (comma-separated)
          <input type="text" name="tech" defaultValue={(row.tech ?? []).join(", ")} />
        </label>
        <p className="admin-note">Shown as chips on the project card and page.</p>
      </div>

      {/* --- Media (tab 3) ----------------------------------------------- */}
      <div className="c" style={show(3)}>
        <label>
          Media area
          <select name="media" defaultValue={row.media}>
            <option value="slides">Slides (module screenshots)</option>
            <option value="video">Promo video</option>
            <option value="none">None (hide media)</option>
          </select>
        </label>
        <label>
          Promo video URL (YouTube/Vimeo/MP4 — used only in Video mode)
          <input type="text" name="video" defaultValue={row.video} />
        </label>
        {row.slug && <SlidesEditor initial={row.slides ?? []} slug={row.slug} />}
      </div>

      {/* --- Links (tab 4) ------------------------------------------------ */}
      <div className="c" style={show(4)}>
        <label>
          Live URL (preferred public link — used before the legacy demo URL)
          <input type="text" name="live_url" defaultValue={row.live_url} />
        </label>
        <label>
          Legacy demo URL (kept for compatibility)
          <input type="text" name="demo_url" defaultValue={row.demo_url} />
        </label>
        <label>
          Repository URL (adds a “Source” button when set)
          <input type="text" name="repo_url" defaultValue={row.repo_url} />
        </label>
      </div>

      {/* --- Settings (tab 5) ---------------------------------------------- */}
      <div className="c" style={show(5)}>
        <label>
          Status
          <select name="status" defaultValue={row.status}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" name="published" defaultChecked={row.published} style={{ marginRight: 8 }} />
          Visible on portfolio (public)
        </label>
        <label>
          <input type="checkbox" name="featured" defaultChecked={row.featured} style={{ marginRight: 8 }} />
          Featured (floats to the top of public lists)
        </label>
        <label>
          Sort order (1, 2, 3… lower first)
          <input type="number" name="sort_order" defaultValue={row.sort_order} min={0} max={9999} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button className="btn p" type="submit">Save project</button>
        <Link className="btn" href="/admin/projects">Back to list</Link>
      </div>
    </form>
  );
}
