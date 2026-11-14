"use client";

import { useState } from "react";
import Link from "next/link";
import { saveCmsAction } from "@/app/(admin)/admin/cms/actions";
import { ActionButton } from "./ActionButton";
import { SeoFields, type SeoDefaults } from "./SeoFields";

export type ServiceFormRow = {
  slug: string;
  title_en: string;
  title_bn: string;
  desc_en: string;
  desc_bn: string;
  full_desc_en: string;
  full_desc_bn: string;
  icon: string;
  icon_svg: string;
  image_url: string;
  features_en: string;
  features_bn: string;
  tags: string[];
  price: string;
  pub_status: string;
  featured: boolean;
  sort_order: number;
  seo: SeoDefaults;
};

const TABS = ["Basics", "Visuals", "Details", "SEO", "Settings"] as const;

/** Task U4 "What I Do" editor — same lifecycle + SEO contract as projects. */
export function ServiceForm({
  id,
  row,
  error,
  isNew,
}: {
  id: string;
  row: ServiceFormRow;
  error?: string;
  isNew?: boolean;
}) {
  const [tab, setTab] = useState(0);
  const action = saveCmsAction.bind(null, "services", id);
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

      {/* A. Basic information */}
      <div className="c" style={show(0)}>
        <label>Service title (EN) *<input type="text" name="title_en" defaultValue={row.title_en} maxLength={140} required /></label>
        <label>Service title (BN)<input type="text" name="title_bn" defaultValue={row.title_bn} maxLength={140} /></label>
        <label>Short description (EN) — shown on the card<textarea name="desc_en" defaultValue={row.desc_en} rows={3} /></label>
        <label>Short description (BN)<textarea name="desc_bn" defaultValue={row.desc_bn} rows={3} /></label>
      </div>

      {/* B. Visual settings */}
      <div className="c" style={show(1)}>
        <label>Icon name (icon library key, e.g. server / shield / network)<input type="text" name="icon" defaultValue={row.icon} maxLength={80} /></label>
        <label>Custom SVG (overrides the icon name — inline &lt;svg&gt; markup)<textarea name="icon_svg" defaultValue={row.icon_svg} rows={4} /></label>
        <label>Optional service image URL<input type="text" name="image_url" defaultValue={row.image_url} /></label>
        {row.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image_url} alt="Service image preview" style={{ maxWidth: 260, maxHeight: 150, borderRadius: 8, border: "1px solid var(--line)", marginBottom: 10 }} />
        ) : null}
      </div>

      {/* C. Service details */}
      <div className="c" style={show(2)}>
        <label>Full description (EN)<textarea name="full_desc_en" defaultValue={row.full_desc_en} rows={5} /></label>
        <label>Full description (BN)<textarea name="full_desc_bn" defaultValue={row.full_desc_bn} rows={5} /></label>
        <label>Key features (EN) — one per line<textarea name="features_en" defaultValue={row.features_en} rows={5} /></label>
        <label>Key features (BN)<textarea name="features_bn" defaultValue={row.features_bn} rows={5} /></label>
        <label>Skills / expertise + related tools (comma-separated tags)<input type="text" name="tags" defaultValue={row.tags.join(", ")} /></label>
        <label>Price line (optional, e.g. “From ৳15,000”)<input type="text" name="price" defaultValue={row.price} maxLength={80} /></label>
      </div>

      {/* D. SEO */}
      <div className="c" style={show(3)}>
        <SeoFields defaults={row.seo} titleSource="title_en" />
      </div>

      {/* E. Display + publishing settings */}
      <div className="c" style={show(4)}>
        <label><input type="checkbox" name="featured" defaultChecked={row.featured} style={{ marginRight: 8 }} />Featured service (floats to the top)</label>
        <label>Display order (lower first)<input type="number" name="sort_order" defaultValue={row.sort_order} min={0} max={9999} /></label>
        <p className="admin-note">Visibility is controlled by the publication buttons (Draft / Publish / Unpublish / Archive in the list).</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <ActionButton className="btn p" pendingLabel="Saving…" name="intent" value="keep">Save</ActionButton>
        <ActionButton pendingLabel="Saving…" name="intent" value="draft">Save as Draft</ActionButton>
        <ActionButton pendingLabel="Publishing…" name="intent" value="publish">Publish Now</ActionButton>
        {!isNew && <Link className="btn" href={`/admin/preview/cms/services/${id}`}>Preview</Link>}
        <Link className="btn" href="/admin/services">Back to list</Link>
      </div>
    </form>
  );
}
