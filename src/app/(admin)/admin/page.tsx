import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_SECTIONS } from "@/lib/admin-constants";
import { getCvPath } from "@/lib/cms";

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const cv = await getCvPath();

  return (
    <AdminShell current="/admin" heading="Dashboard">
      <p className="admin-note">
        Signed in as {user.email}. Everything you edit here publishes to the
        site immediately (cache is flushed on save).
      </p>
      <div className="grid" style={{ marginTop: 18 }}>
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="card"
            style={{ textDecoration: "none" }}
          >
            <h3>{section.label}</h3>
          </Link>
        ))}
        <div className="card">
          <h3>CV file</h3>
          <p>{cv ? "Uploaded and live on the hero." : "Not uploaded yet — the hero's CV button stays disabled."}</p>
        </div>
      </div>
    </AdminShell>
  );
}
