"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export type Slide = { src: string; caption_en: string; caption_bn: string };

const MAX_BYTES = 8 * 1024 * 1024; // reject files larger than 8 MB
const MAX_EDGE = 1600; // longest side after resize

/** Canvas resize → WebP (Section 4c: compress on upload, enforce max size). */
async function toWebp(file: File): Promise<{ blob: Blob; ext: string }> {
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 8 MB`);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.82));
  if (!blob) throw new Error("Conversion to WebP failed");
  return { blob, ext: "webp" };
}

/**
 * Per-project slides editor (AGENT_PROMPT.md 4c). Slides without an image are
 * allowed (caption-only placeholders) and marked "No image yet"; each slide
 * can later take its own image which replaces the placeholder. Multi-upload
 * appends new slides. Entries reorder (↑/↓) and delete here; captions are
 * per-slide EN/BN; the mini preview mirrors the user view. Everything lands
 * in one hidden `slides` JSON input inside the surrounding RowForm.
 * Uploads use the browser client (anon key) — RLS allows writes only to
 * logged-in admins via is_admin(); the service_role key never reaches here.
 */
export function SlidesEditor({
  initial = [],
  slug,
}: {
  initial?: Slide[];
  slug: string;
}) {
  const [slides, setSlides] = useState<Slide[]>(initial);
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");

  const set = (k: number, patch: Partial<Slide>) =>
    setSlides((s) => s.map((v, i) => (i === k ? { ...v, ...patch } : v)));
  const move = (k: number, d: number) =>
    setSlides((s) => {
      const next = [...s];
      const j = k + d;
      if (j < 0 || j >= next.length) return s;
      [next[k], next[j]] = [next[j], next[k]];
      return next;
    });

  async function uploadInto(k: number | null, file: File | undefined) {
    if (!file) return;
    setBusy(k === null ? "new" : String(k));
    setError("");
    try {
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      if (!file.type.startsWith("image/")) throw new Error(`Not an image: ${file.name}`);
      const webp = await toWebp(file);
      const path = `projects/${slug || "other"}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${webp.ext}`;
      const { error: upErr } = await client.storage
        .from("project-media")
        .upload(path, webp.blob, { contentType: "image/webp", upsert: false });
      if (upErr) throw upErr;
      const { data } = client.storage.from("project-media").getPublicUrl(path);
      if (k === null) {
        setSlides((s) => [...s, { src: data.publicUrl, caption_en: "", caption_bn: "" }]);
      } else {
        // Replace the placeholder of an existing (caption-only) slide.
        set(k, { src: data.publicUrl });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <fieldset
      className="card"
      style={{ marginTop: 12, background: "var(--panel)", color: "var(--ink)" }}
    >
      <legend style={{ padding: "0 6px", fontWeight: 600 }}>Slides (screenshots)</legend>
      <input type="hidden" name="slides" value={JSON.stringify(slides)} />
      {slides.length === 0 && (
        <p className="admin-note">
          No slides yet — the site shows the mockup placeholder panel. You can
          also add caption-only slides now and attach images later.
        </p>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {slides.map((slide, k) => (
          <div
            key={k}
            style={{ display: "grid", gridTemplateColumns: "84px 1fr 1fr auto", gap: 8, alignItems: "center" }}
          >
            {/* Live preview, same 16:9 look as the user view (scaled down) */}
            <div
              className="media"
              style={{ height: 50, margin: 0, padding: 2, fontSize: 9 }}
              aria-hidden="true"
            >
              {slide.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.src} alt="" />
              ) : (
                <span className="admin-note" style={{ padding: 0 }}>No image yet</span>
              )}
            </div>
            <label>
              Caption (EN)
              <input
                type="text"
                value={slide.caption_en}
                onChange={(e) => set(k, { caption_en: e.target.value })}
              />
            </label>
            <label>
              Caption (BN)
              <input
                type="text"
                value={slide.caption_bn}
                onChange={(e) => set(k, { caption_bn: e.target.value })}
              />
            </label>
            <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <label className="btn" style={{ fontSize: 12, cursor: "pointer" }}>
                {busy === String(k) ? "…" : slide.src ? "Replace" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => uploadInto(k, e.target.files?.[0])}
                />
              </label>
              <button type="button" aria-label="Move up" onClick={() => move(k, -1)}>↑</button>
              <button type="button" aria-label="Move down" onClick={() => move(k, +1)}>↓</button>
              <button
                type="button"
                className="admin-danger"
                aria-label="Delete slide"
                onClick={() => setSlides((s) => s.filter((_, i) => i !== k))}
              >
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>
      <div className="admin-row" style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label className="btn" style={{ fontSize: 13, cursor: "pointer" }}>
          {busy === "new" ? "Uploading…" : "Upload images (creates slides)"}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => Array.from(e.target.files ?? []).forEach((f) => uploadInto(null, f))}
          />
        </label>
        <button
          type="button"
          className="btn"
          style={{ fontSize: 13 }}
          onClick={() =>
            setSlides((s) => [...s, { src: "", caption_en: "", caption_bn: "" }])
          }
        >
          + Add caption-only slide
        </button>
        {error && <span className="admin-note admin-danger">{error}</span>}
      </div>
    </fieldset>
  );
}
