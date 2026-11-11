"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  setProjectVisibleAction,
  setProjectStatusAction,
  duplicateProjectAction,
  trashProjectAction,
  restoreProjectAction,
  purgeProjectAction,
  reorderProjectsAction,
} from "@/app/(admin)/admin/projects/actions";

export type ProjectRow = {
  id: string;
  slug: string;
  title_en: string;
  title_bn: string;
  status: string;
  published: boolean;
  featured: boolean;
  sort_order: number;
  deleted_at: string | null;
};

const STATUSES = ["running", "completed", "planned", "paused"] as const;

const STATUS_STYLE: Record<string, CSSProperties> = {
  running: { color: "var(--acc)", borderColor: "var(--acc)" },
  completed: { color: "var(--ok)", borderColor: "var(--ok)" },
  planned: { color: "var(--acc2)", borderColor: "var(--acc2)" },
  paused: { color: "var(--warn)", borderColor: "var(--warn)" },
};

/**
 * Stage U2 projects list: search, status + visible/hidden filters, drag
 * reorder and one form per row action. Trash mode swaps the action set for
 * Restore / permanent delete (confirm).
 */
export function ProjectsManager({
  rows,
  mode = "all",
}: {
  rows: ProjectRow[];
  mode?: "all" | "running" | "hidden" | "trash";
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [vis, setVis] = useState("all");
  const [order, setOrder] = useState<ProjectRow[]>(rows);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const dragged = useRef<ProjectRow | null>(null);

  const trashMode = mode === "trash";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return order.filter((r) => {
      if (!trashMode && status !== "all" && r.status !== status) return false;
      if (!trashMode && vis !== "all") {
        if (vis === "visible" && !r.published) return false;
        if (vis === "hidden" && r.published) return false;
      }
      if (q && !`${r.title_en} ${r.title_bn} ${r.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [order, query, status, vis, trashMode]);

  const onDrop = async (targetIndex: number) => {
    const item = dragged.current;
    dragged.current = null;
    setDragIndex(null);
    if (!item) return;
    const ids = visible.map((r) => r.id);
    const from = ids.indexOf(item.id);
    if (from === -1 || from === targetIndex) return;
    ids.splice(from, 1);
    ids.splice(targetIndex, 0, item.id);
    setSaving(true);
    try {
      await reorderProjectsAction(ids);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="c" style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search title or slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: "1 1 220px", border: "1px solid var(--line)", borderRadius: 10, padding: "7px 11px", background: "var(--card)" }}
          aria-label="Search projects"
        />
        {!trashMode && (
          <>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "7px 11px", background: "var(--card)" }}>
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select value={vis} onChange={(e) => setVis(e.target.value)} aria-label="Filter by visibility"
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "7px 11px", background: "var(--card)" }}>
              <option value="all">Visible + hidden</option>
              <option value="visible">Visible only</option>
              <option value="hidden">Hidden only</option>
            </select>
          </>
        )}
        <span style={{ color: "var(--mut)", fontSize: 13 }}>
          {visible.length} of {order.length}{saving ? " · saving order…" : ""}
        </span>
      </div>

      {!trashMode && (
        <p className="admin-note" style={{ marginBottom: 10 }}>
          Drag rows to reorder the public portfolio (order saves automatically).
        </p>
      )}
      {trashMode && (
        <p className="admin-note" style={{ marginBottom: 10 }}>
          Trashed projects are invisible everywhere on the public site. Restore puts them back; Delete forever is
          permanent and asks for confirmation.
        </p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {visible.map((r, index) => (
          <div
            key={r.id}
            className="c"
            draggable={!trashMode}
            onDragStart={(e) => {
              dragged.current = r;
              setDragIndex(index);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(index)}
            onDragEnd={() => {
              dragged.current = null;
              setDragIndex(null);
            }}
            style={{
              padding: "12px 14px",
              opacity: dragIndex === index ? 0.5 : 1,
              cursor: trashMode ? "default" : "grab",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "var(--mut)", fontSize: 13, width: 22, textAlign: "right" }}>{index + 1}</span>
              <div style={{ minWidth: 200, flex: 1 }}>
                <strong>{r.title_en || r.slug}</strong>
                <small style={{ display: "block", color: "var(--mut)" }}>
                  /projects/{r.slug}
                  {r.title_bn ? ` · ${r.title_bn}` : ""}
                  {r.featured ? " · ★ featured" : ""}
                </small>
              </div>
              <span
                style={{
                  fontSize: 12,
                  border: "1px solid var(--line)",
                  borderRadius: 99,
                  padding: "2px 10px",
                  ...(STATUS_STYLE[r.status] ?? {}),
                }}
                data-status={r.status}
              >
                {r.status}
              </span>
              {!trashMode && (
                <span
                  style={{
                    fontSize: 12,
                    border: "1px solid var(--line)",
                    borderRadius: 99,
                    padding: "2px 10px",
                    color: r.published ? "var(--ok)" : "var(--mut)",
                  }}
                >
                  {r.published ? "visible" : "hidden"}
                </span>
              )}
              {trashMode && r.deleted_at && (
                <span style={{ fontSize: 12, color: "var(--mut)" }}>
                  trashed {new Date(r.deleted_at).toLocaleString()}
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
              {!trashMode ? (
                <>
                  <Link className="btn s" href={`/admin/projects/${r.id}`}>Edit</Link>
                  <form action={setProjectVisibleAction.bind(null, r.id, !r.published)}>
                    <button className="btn s" type="submit">{r.published ? "Hide" : "Show"}</button>
                  </form>
                  <select
                    aria-label={`Change status of ${r.title_en || r.slug}`}
                    defaultValue={r.status}
                    onChange={(e) => {
                      if (e.target.value !== r.status) {
                        setProjectStatusAction(r.id, e.target.value).then(() => undefined);
                      }
                    }}
                    style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "4px 8px", background: "var(--card)", fontSize: 13 }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <form action={duplicateProjectAction.bind(null, r.id)}>
                    <button className="btn s" type="submit">Duplicate</button>
                  </form>
                  <form action={trashProjectAction.bind(null, r.id)}>
                    <button className="btn s" type="submit" style={{ color: "var(--bad)" }}>Trash</button>
                  </form>
                </>
              ) : (
                <>
                  <form action={restoreProjectAction.bind(null, r.id)}>
                    <button className="btn s p" type="submit">Restore</button>
                  </form>
                  <DeleteForever id={r.id} title={r.title_en || r.slug} />
                </>
              )}
            </div>
          </div>
        ))}
        {!visible.length && (
          <div className="c" style={{ color: "var(--mut)" }}>
            {trashMode ? "Trash is empty." : "No projects match this filter."}
          </div>
        )}
      </div>
    </div>
  );
}

/** Permanent delete — client confirm() gate before the server action. */
function DeleteForever({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={purgeProjectAction.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${title}" forever? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button className="btn s" type="submit" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}>
        Delete forever
      </button>
    </form>
  );
}
