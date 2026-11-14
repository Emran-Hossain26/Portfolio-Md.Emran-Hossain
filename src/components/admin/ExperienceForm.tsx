"use client";

import { useState } from "react";
import Link from "next/link";
import { saveCmsAction } from "@/app/(admin)/admin/cms/actions";
import { ActionButton } from "./ActionButton";
import { SeoFields, type SeoDefaults } from "./SeoFields";

export type ExperienceFormRow = {
  slug: string;
  role_en: string;
  role_bn: string;
  org_en: string;
  org_bn: string;
  logo_url: string;
  website_url: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  period: string;
  summary_en: string;
  summary_bn: string;
  details: string;
  achievements_en: string;
  achievements_bn: string;
  tags: string[];
  pub_status: string;
  featured: boolean;
  sort: number;
  seo: SeoDefaults;
};

const TABS = ["Employment", "Duration", "Responsibilities", "SEO", "Settings"] as const;

/** Task U4 experience editor — “Present” renders automatically when Current. */
export function ExperienceForm({
  id,
  row,
  error,
  isNew,
}: {
  id: string;
  row: ExperienceFormRow;
  error?: string;
  isNew?: boolean;
}) {
  const [tab, setTab] = useState(0);
  const [current, setCurrent] = useState(row.is_current);
  const action = saveCmsAction.bind(null, "experience", id);
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
          Current status: <b>{row.pub_status}</b> — Save keeps it; buttons below change it explicitly.
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

      {/* A. Employment information */}
      <div className="c" style={show(0)}>
        <label>Job title / designation (EN) *<input type="text" name="role_en" defaultValue={row.role_en} maxLength={140} required /></label>
        <label>Job title (BN)<input type="text" name="role_bn" defaultValue={row.role_bn} maxLength={140} /></label>
        <label>Company / organization (EN) *<input type="text" name="org_en" defaultValue={row.org_en} maxLength={140} required /></label>
        <label>Company (BN)<input type="text" name="org_bn" defaultValue={row.org_bn} maxLength={140} /></label>
        <label>Company logo URL<input type="text" name="logo_url" defaultValue={row.logo_url} /></label>
        {row.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.logo_url} alt="Logo preview" style={{ maxWidth: 120, maxHeight: 60, borderRadius: 6, border: "1px solid var(--line)", marginBottom: 10 }} />
        ) : null}
        <label>Company website URL<input type="text" name="website_url" defaultValue={row.website_url} /></label>
        <label>
          Employment type
          <select name="employment_type" defaultValue={row.employment_type}>
            <option value="">— not set —</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="freelance">Freelance</option>
            <option value="contract">Contract</option>
          </select>
        </label>
      </div>

      {/* B. Employment duration */}
      <div className="c" style={show(1)}>
        <label>Start month and year<input type="month" name="start_date" defaultValue={row.start_date} /></label>
        <label>End month and year{current ? " (disabled — currently working)" : ""}
          <input type="month" name="end_date" defaultValue={row.end_date} disabled={current} />
        </label>
        <label>
          <input type="checkbox" name="is_current" checked={current} onChange={(e) => setCurrent(e.target.checked)} style={{ marginRight: 8 }} />
          Currently working here (shows “Present” automatically)
        </label>
        <label>Legacy free-text period (fallback when no dates set)<input type="text" name="period" defaultValue={row.period} maxLength={80} /></label>
      </div>

      {/* C. Job responsibilities */}
      <div className="c" style={show(2)}>
        <label>Job summary (EN)<textarea name="summary_en" defaultValue={row.summary_en} rows={2} /></label>
        <label>Job summary (BN)<textarea name="summary_bn" defaultValue={row.summary_bn} rows={2} /></label>
        <label>Detailed job description (EN)<textarea name="details" defaultValue={row.details} rows={5} /></label>
        <label>Key responsibilities / achievements (EN) — one per line<textarea name="achievements_en" defaultValue={row.achievements_en} rows={5} /></label>
        <label>Responsibilities / achievements (BN)<textarea name="achievements_bn" defaultValue={row.achievements_bn} rows={5} /></label>
        <label>Associated projects / tags (comma-separated)<input type="text" name="tags" defaultValue={row.tags.join(", ")} /></label>
      </div>

      {/* D. SEO */}
      <div className="c" style={show(3)}>
        <SeoFields defaults={row.seo} titleSource="role_en" />
      </div>

      {/* E. Display + publishing settings */}
      <div className="c" style={show(4)}>
        <label><input type="checkbox" name="featured" defaultChecked={row.featured} style={{ marginRight: 8 }} />Featured experience</label>
        <label>Display order (lower first)<input type="number" name="sort" defaultValue={row.sort} min={0} max={9999} /></label>
        <p className="admin-note">Visibility is controlled by the publication buttons (Draft / Publish / Unpublish / Archive in the list).</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <ActionButton className="btn p" pendingLabel="Saving…" name="intent" value="keep">Save</ActionButton>
        <ActionButton pendingLabel="Saving…" name="intent" value="draft">Save as Draft</ActionButton>
        <ActionButton pendingLabel="Publishing…" name="intent" value="publish">Publish Now</ActionButton>
        {!isNew && <Link className="btn" href={`/admin/preview/cms/experience/${id}`}>Preview</Link>}
        <Link className="btn" href="/admin/experience">Back to list</Link>
      </div>
    </form>
  );
}
