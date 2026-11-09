import Image from "next/image";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { uploadMediaAction, deleteMediaAction } from "@/app/(admin)/actions";
import { createServiceClient } from "@/lib/supabase/service";
import { adminConfigured } from "@/lib/supabase/service";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { saved, error } = await searchParams;
  let assets: { id: string; url: string; alt_en: string; alt_bn: string; mime_type: string; size_bytes: number }[] = [];
  if (adminConfigured()) {
    const db = createServiceClient();
    const { data } = await db
      .from("media_assets")
      .select("id,url,alt_en,alt_bn,mime_type,size_bytes")
      .order("created_at", { ascending: false });
    assets = (data ?? []) as typeof assets;
  }

  return (
    <AdminShell current="/admin/media" heading="Media library">
      {saved ? <p className="admin-check pass">Uploaded.</p> : null}
      {error === "empty" ? <p className="admin-check fail">Choose a file first.</p> : null}
      {error === "size" ? <p className="admin-check fail">File larger than 8 MB.</p> : null}
      {error === "upload" ? <p className="admin-check fail">Upload failed — try again.</p> : null}
      <p className="admin-note">
        Upload images (up to 8 MB). They are stored in the public <code>media</code>
        bucket and listed here. Use the returned URL in any content field.
      </p>

      <form action={uploadMediaAction} className="admin-editor" encType="multipart/form-data">
        <label>
          File
          <input type="file" name="file" accept="image/*" required />
        </label>
        <label>
          Alt text (EN)
          <input name="alt_en" type="text" />
        </label>
        <label>
          Alt text (BN)
          <input name="alt_bn" type="text" />
        </label>
        <div className="admin-actions">
          <button type="submit" className="btn p">
            Upload
          </button>
        </div>
      </form>

      <div className="grid" style={{ marginTop: 20 }}>
        {assets.map((a) => (
          <div className="card" key={a.id}>
            {/* Fixed-ratio tile; next/image optimises via the Supabase remote pattern */}
            <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 8, overflow: "hidden", marginBottom: 8, background: "var(--panel)" }}>
              <Image src={a.url} alt={a.alt_en} fill style={{ objectFit: "cover" }} sizes="(max-width: 760px) 100vw, 33vw" />
            </div>
            <p className="mute" style={{ fontSize: 12, wordBreak: "break-all" }}>{a.url}</p>
            <p className="mute" style={{ fontSize: 12 }}>
              {a.mime_type} · {Math.round(a.size_bytes / 1024)} KB
            </p>
            <form action={deleteMediaAction.bind(null, a.id)} className="admin-actions">
              <button type="submit" className="btn admin-danger">
                Delete
              </button>
            </form>
          </div>
        ))}
      </div>
      {assets.length === 0 ? <p className="admin-note">No assets yet.</p> : null}
    </AdminShell>
  );
}
