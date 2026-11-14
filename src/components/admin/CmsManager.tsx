"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cmsLifecycleAction,
  cmsBulkAction,
  duplicateCmsAction,
  reorderCmsAction,
} from "@/app/(admin)/admin/cms/actions";
import { TABS, type CmsAdminRow, type CmsModule } from "@/app/(admin)/admin/cms/shared";
import { ActionButton } from "./ActionButton";

const TAB_LABELS: Record<string, string> = {
  all: "All",
  published: "Published",
  drafts: "Drafts",
  unpublished: "Unpublished",
  archived: "Archived",
  trash: "Trash",
};

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  published: { bg: "var(--ok)", fg: "#fff" },
  draft: { bg: "var(--acc2)", fg: "#1c1400" },
  unpublished: { bg: "var(--mut)", fg: "#fff" },
  archived: { bg: "var(--warn)", fg: "#fff" },
};

const PAGE_SIZE = 10;

type Props = {
  module: CmsModule;
  base: string;
  rows: CmsAdminRow[];
  tab: string;
  saved?: string;
  error?: string;
  hasU4: boolean;
};

/**
 * Task U4 unified dashboard for projects / services / experience:
 * tabs (All/Published/Drafts/Unpublished/Archived/Trash), search, sort,
 * bulk actions with confirmation, drag reorder, per-status row actions,
 * CSV export, pagination and empty states.
 */
export function CmsManager({ module, base, rows, tab, saved, error, hasU4 }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState("");
  const dragIndex = useRef<number | null>(null);
  const trashMode = tab === "trash";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((r) => !q || `${r.name} ${r.nameSub} ${r.slug} ${r.badge} ${r.tags.join(" ")}`.toLowerCase().includes(q));
    if (sortBy === "updated") out = [...out].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    if (sortBy === "name") out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "order") out = out; // server order (display order)
    return out;
  }, [rows, query, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allChecked = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const runBulk = async (action: string) => {
    const ids = [...selected];
    if (!ids.length) return;
    const destructive = action === "trash" || action === "purge";
    const label = TAB_LABELS[action === "trash" ? "trash" : action] ?? action;
    if (destructive && !window.confirm(`${label}: ${ids.length} record(s)? This cannot be undone for permanent delete.`)) return;
    if (!destructive && !window.confirm(`${label}: ${ids.length} record(s)?`)) return;
    setBusy(`bulk ${action}…`);
    try {
      await cmsBulkAction(module, ids, action);
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy("");
    }
  };

  const exportCsv = () => {
    const head = ["id", "name", "slug", "pub_status", "featured", "updated_at"];
    const lines = [head.join(",")].concat(
      filtered.map((r) =>
        [r.id, r.name, r.slug, r.pubStatus, r.featured ? "yes" : "no", r.updatedAt]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module}-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDrop = async (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex || trashMode || sortBy !== "order") return;
    const ids = pageRows.map((r) => r.id);
    const item = ids[from];
    ids.splice(from, 1);
    ids.splice(targetIndex, 0, item);
    setBusy("saving order…");
    try {
      await reorderCmsAction(module, ids);
      router.refresh();
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      {/* Feedback banners */}
      {saved && (
        <div className="c" style={{ borderColor: "var(--ok)", marginBottom: 12 }}>
          Saved — changes are live after the public site revalidates.
        </div>
      )}
      {error && (
        <div className="c" style={{ borderColor: "var(--bad)", marginBottom: 12 }}>
          Action failed: {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {TABS.map((t) => (
          <Link
            key={t}
            href={`${base}?tab=${t}`}
            className="btn s"
            style={t === tab ? { background: "var(--acc)", borderColor: "var(--acc)", color: "#fff" } : undefined}
            aria-current={t === tab ? "page" : undefined}
          >
            {TAB_LABELS[t]}
            <span style={{ marginLeft: 6, opacity: 0.75 }}>
              {t === tab ? rows.length : ""}
            </span>
          </Link>
        ))}
      </div>

      {/* Toolbar */}
      <div className="c" style={{ marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <strong style={{ marginRight: 4 }}>+ Add New:</strong>
        <Link className="btn p s" href={`${base}/new`}>New record</Link>
        <input
          type="search"
          placeholder="Search name, slug, tag…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          style={{ flex: "1 1 200px", border: "1px solid var(--line)", borderRadius: 10, padding: "7px 11px", background: "var(--card)" }}
          aria-label="Search records"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by"
          style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "7px 11px", background: "var(--card)" }}>
          <option value="order">Display order</option>
          <option value="updated">Last updated</option>
          <option value="name">Name (A→Z)</option>
        </select>
        <button className="btn s" type="button" onClick={exportCsv}>Export CSV</button>
        <button className="btn s" type="button" onClick={() => router.refresh()}>Refresh</button>
        {busy && <span style={{ color: "var(--mut)", fontSize: 13 }}>{busy}</span>}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="c" style={{ marginBottom: 12, borderColor: "var(--acc)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <strong>{selected.size} selected:</strong>
          {!trashMode && (
            <>
              <button className="btn s p" type="button" onClick={() => runBulk("publish")}>Bulk publish</button>
              <button className="btn s" type="button" onClick={() => runBulk("unpublish")}>Bulk unpublish</button>
              <button className="btn s" type="button" onClick={() => runBulk("archive")}>Bulk archive</button>
              <button className="btn s" type="button" onClick={() => runBulk("trash")} style={{ color: "var(--bad)" }}>Bulk move to Trash</button>
            </>
          )}
          {trashMode && (
            <>
              <button className="btn s p" type="button" onClick={() => runBulk("restore")}>Bulk restore</button>
              <button className="btn s" type="button" onClick={() => runBulk("purge")} style={{ color: "var(--bad)", borderColor: "var(--bad)" }}>Bulk delete forever</button>
            </>
          )}
          <button className="btn s" type="button" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {!trashMode && sortBy === "order" && (
        <p className="admin-note" style={{ marginBottom: 10 }}>Drag rows to change the public display order (saves automatically).</p>
      )}

      {/* Table */}
      <div className="c" style={{ padding: 0, overflowX: "auto" }}>
        {pageRows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--mut)" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🗂</div>
            {trashMode ? "Trash is empty." : "Nothing here yet — use “New record” to add the first one."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--mut)", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "10px 8px", width: 34 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={allChecked}
                    onChange={() =>
                      setSelected(allChecked ? new Set() : new Set(pageRows.map((r) => r.id)))
                    }
                  />
                </th>
                <th style={{ padding: "10px 8px", width: 60 }}>Thumb</th>
                <th style={{ padding: "10px 8px" }}>Name</th>
                <th style={{ padding: "10px 8px" }}>Status</th>
                <th style={{ padding: "10px 8px" }}>Updated</th>
                <th style={{ padding: "10px 8px", width: 280 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, index) => (
                <tr
                  key={r.id}
                  draggable={!trashMode && sortBy === "order"}
                  onDragStart={() => { dragIndex.current = index; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(index)}
                  onDragEnd={() => { dragIndex.current = null; }}
                  style={{ borderBottom: "1px solid var(--line)", cursor: !trashMode && sortBy === "order" ? "grab" : "default" }}
                >
                  <td style={{ padding: "8px" }}>
                    <input type="checkbox" aria-label={`Select ${r.name || r.slug}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td style={{ padding: "8px" }}>
                    {r.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.thumb} alt="" style={{ width: 48, height: 34, objectFit: "cover", borderRadius: 6, border: "1px solid var(--line)" }} />
                    ) : (
                      <span style={{ color: "var(--mut)" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "8px" }}>
                    <strong>{r.name || r.slug}</strong>
                    {r.nameSub ? <span style={{ color: "var(--mut)" }}> · {r.nameSub}</span> : null}
                    <small style={{ display: "block", color: "var(--mut)" }}>
                      {r.slug}
                      {r.badge ? ` · ${r.badge}` : ""}
                      {r.featured ? " · ★ featured" : ""}
                      {r.tags.length ? ` · ${r.tags.join(", ")}` : ""}
                    </small>
                  </td>
                  <td style={{ padding: "8px" }}>
                    <span style={{
                      fontSize: 12, borderRadius: 99, padding: "3px 10px", fontWeight: 600,
                      background: STATUS_TONE[r.pubStatus]?.bg ?? "var(--mut)",
                      color: STATUS_TONE[r.pubStatus]?.fg ?? "#fff",
                    }}>
                      {r.pubStatus}
                    </span>
                    {r.deletedAt && <small style={{ display: "block", color: "var(--bad)" }}>trashed</small>}
                  </td>
                  <td style={{ padding: "8px", color: "var(--mut)", fontSize: 13 }}>
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "8px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {trashMode ? (
                        <>
                          <form action={cmsLifecycleAction.bind(null, module, r.id, "restore")}>
                            <ActionButton className="btn s p" pendingLabel="Restoring…">Restore</ActionButton>
                          </form>
                          <DeleteForever module={module} id={r.id} name={r.name || r.slug} />
                        </>
                      ) : (
                        <>
                          <Link className="btn s" href={`${base}/${r.id}`}>Edit</Link>
                          <Link className="btn s" href={`/admin/preview/cms/${module}/${r.id}`}>Preview</Link>
                          <Link className="btn s" href={`${base}/${r.id}/revisions`}>History</Link>
                          <form action={duplicateCmsAction.bind(null, module, r.id)}>
                            <ActionButton className="btn s" pendingLabel="Duplicating…">Duplicate</ActionButton>
                          </form>
                          {r.pubStatus === "archived" ? (
                            <form action={cmsLifecycleAction.bind(null, module, r.id, "restore")}>
                              <ActionButton className="btn s p" pendingLabel="Restoring…">Restore</ActionButton>
                            </form>
                          ) : (
                            <form action={cmsLifecycleAction.bind(null, module, r.id, "publish")}>
                              <ActionButton className="btn s p" pendingLabel="Publishing…">Publish</ActionButton>
                            </form>
                          )}
                          {r.pubStatus === "published" && (
                            <form action={cmsLifecycleAction.bind(null, module, r.id, "unpublish")}>
                              <ActionButton className="btn s" pendingLabel="Unpublishing…">Unpublish</ActionButton>
                            </form>
                          )}
                          {r.pubStatus !== "archived" && (
                            <form action={cmsLifecycleAction.bind(null, module, r.id, "archive")}>
                              <ActionButton className="btn s" pendingLabel="Archiving…">Archive</ActionButton>
                            </form>
                          )}
                          <form action={cmsLifecycleAction.bind(null, module, r.id, "trash")}>
                            <ActionButton className="btn s" pendingLabel="Moving…" style={{ color: "var(--bad)" }}>Trash</ActionButton>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
          <button className="btn s" type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Prev</button>
          <span style={{ color: "var(--mut)", fontSize: 13 }}>Page {safePage} of {pageCount} · {filtered.length} records</span>
          <button className="btn s" type="button" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>Next →</button>
        </div>
      )}

      {!hasU4 && (
        <p className="admin-note" style={{ marginTop: 14 }}>
          Pre-migration mode: run <b>20261118_cms_modules.sql</b> to enable Draft / Unpublished / Archived /
          revision history. Until then, visibility follows the legacy published flag.
        </p>
      )}
    </div>
  );
}

/** Permanent delete — confirm gate + server-side trashed-only guard. */
function DeleteForever({ module, id, name }: { module: CmsModule; id: string; name: string }) {
  return (
    <form
      action={cmsLifecycleAction.bind(null, module, id, "purge")}
      onSubmit={(e) => {
        if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <button className="btn s" type="submit" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}>
        Delete forever
      </button>
    </form>
  );
}
