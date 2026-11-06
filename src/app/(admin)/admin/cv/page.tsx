import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { saveCvAction, removeCvAction } from "@/app/(admin)/actions";
import { getCvPath, getCvDownloads } from "@/lib/cms";

export default async function CvPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireAdmin();
  const [cv, downloads] = await Promise.all([getCvPath(), getCvDownloads()]);

  return (
    <AdminShell current="/admin/cv" heading="CV upload">
      {error === "empty" ? (
        <p className="admin-check fail">Choose a file first.</p>
      ) : null}
      {error === "size" ? (
        <p className="admin-check fail">File is larger than 8 MB.</p>
      ) : null}
      {error === "upload" ? (
        <p className="admin-check fail">Upload failed — try again.</p>
      ) : null}
      <p className="admin-note">
        PDF or DOCX, up to 8 MB. Stored in the public <code>cv</code> storage
        bucket; the hero&apos;s CV button enables once a file is saved.
      </p>
      <form action={saveCvAction} className="admin-editor">
        <label>
          CV file (PDF/DOCX)
          <input type="file" name="file" accept=".pdf,.docx" required />
        </label>
        <div className="admin-actions">
          <button type="submit" className="btn p">
            Upload
          </button>
        </div>
      </form>
      {cv ? (
        <div className="card" style={{ marginTop: 18 }}>
          <h3>Current CV</h3>
          <p className="mute">
            <a href={cv} target="_blank" rel="noopener noreferrer">
              Open uploaded file →
            </a>
          </p>
          <p className="mute">
            Downloads counted so far: <b>{downloads}</b> (via /api/download-cv)
          </p>
          <form action={removeCvAction} className="admin-actions">
            <button type="submit" className="btn admin-danger">
              Remove (disables the hero CV button)
            </button>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}
