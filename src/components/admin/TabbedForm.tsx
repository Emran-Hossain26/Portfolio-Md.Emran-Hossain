"use client";

import { useState } from "react";
import { saveRowAction, deleteRowAction } from "@/app/(admin)/actions";
import type { AdminField } from "./RowForm";

/**
 * Tabbed variant of RowForm: groups fields into labelled tabs (Content, SEO,
 * Settings) without changing which fields are submitted. One form, one Save.
 */
export function TabbedForm({
  table,
  id,
  groups,
}: {
  table: string;
  id: string;
  groups: { label: string; fields: AdminField[] }[];
}) {
  const [tab, setTab] = useState(0);
  const save = saveRowAction.bind(null, table, id);
  const remove = deleteRowAction.bind(null, table, id);

  const renderField = (field: AdminField) => {
    switch (field.type) {
      case "textarea":
        return (
          <label key={field.name}>
            {field.label}
            <textarea name={field.name} defaultValue={String(field.value)} rows={4} />
          </label>
        );
      case "check":
        return (
          <label key={field.name}>
            <input
              type="checkbox"
              name={field.name}
              defaultChecked={Boolean(field.value)}
              style={{ marginRight: 8 }}
            />
            {field.label}
          </label>
        );
      case "number":
        return (
          <label key={field.name}>
            {field.label}
            <input type="number" name={field.name} defaultValue={Number(field.value) || 0} />
          </label>
        );
      default:
        return (
          <label key={field.name}>
            {field.label}
            <input type="text" name={field.name} defaultValue={String(field.value)} />
          </label>
        );
    }
  };

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {groups.map((g, i) => (
          <button
            key={g.label}
            type="button"
            className={"btn" + (i === tab ? " p" : "")}
            onClick={() => setTab(i)}
            aria-pressed={i === tab}
          >
            {g.label}
          </button>
        ))}
      </div>
      <form action={save} className="admin-editor">
        <input type="hidden" name="__id" value={id} />
        {groups.map((g, i) => (
          <div key={g.label} style={{ display: i === tab ? "grid" : "none", gap: 8 }}>
            {g.fields.map(renderField)}
          </div>
        ))}
        <div className="admin-actions">
          <button type="submit" className="btn p">
            Save
          </button>
        </div>
      </form>
      <form action={remove} className="admin-actions">
        <button type="submit" className="btn admin-danger">
          Delete row
        </button>
      </form>
    </div>
  );
}
