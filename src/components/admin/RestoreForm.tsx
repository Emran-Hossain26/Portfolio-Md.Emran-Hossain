"use client";

import { useState } from "react";

/**
 * Stage 7 — backup IMPORT (mirror of the export). Posts the chosen backup
 * JSON to /api/admin/restore with an explicit confirm token; shows the
 * per-table report. Hidden behind a type-to-confirm guard.
 */
export function RestoreForm() {
  const [file, setFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");

  const submit = async () => {
    if (!file || confirmText !== "RESTORE" || busy) return;
    setBusy(true);
    setResult("");
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const payload = json?.data ? json : { confirm: "RESTORE", data: json };
      payload.confirm = "RESTORE";
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      setResult(
        res.ok
          ? "Restored: " + Object.entries(out.report ?? {}).map(([k, v]) => `${k}=${v}`).join(", ")
          : "Failed: " + String(out.error ?? "unknown"),
      );
    } catch (e) {
      setResult("Failed: " + String(e instanceof Error ? e.message : e).slice(0, 120));
    } finally {
      setBusy(false);
    }
  };

  const armed = !!file && confirmText === "RESTORE";

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
      <h3>Restore from backup</h3>
      <p className="mute" style={{ margin: 0, fontSize: 13 }}>
        Upload a backup JSON (from “Download backup”). Rows are upserted by
        primary key — existing content with the same id/key is OVERWRITTEN.
      </p>
      <input
        type="file"
        accept=".json,application/json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <label style={{ fontSize: 13, color: "var(--mut2)" }}>
        Type <b>RESTORE</b> to unlock:
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="RESTORE"
          style={{ marginLeft: 8, maxWidth: 160, display: "inline-block" }}
        />
      </label>
      <div>
        <button type="button" className="btn" disabled={!armed || busy} onClick={submit}>
          {busy ? "Restoring…" : "Restore content"}
        </button>
      </div>
      {result ? (
        <p className="note" style={{ margin: 0 }}>{result}</p>
      ) : null}
    </div>
  );
}
