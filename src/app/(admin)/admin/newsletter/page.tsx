import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { getNewsletterSettings } from "@/lib/cms";
import { toggleNewsletterAction, deleteSubscriberAction } from "@/app/(admin)/actions";

type Subscriber = {
  id: string;
  email: string;
  locale: string;
  status: string;
  created_at: string;
};


async function NewsletterInner({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const sp = await searchParams;
  await requireAdmin();

  const settings = await getNewsletterSettings();

  let rows: Subscriber[] = [];
  if (adminConfigured()) {
    try {
      const { data } = await createServiceClient()
        .from("newsletter_subscribers")
        .select("id,email,locale,status,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      rows = (data ?? []) as Subscriber[];
    } catch {
      rows = [];
    }
  }
  const activeCount = rows.filter((r) => r.status === "active").length;

  return (
    <AdminShell heading="Newsletter">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Optional subscribe box in the public footer. Subscribers are stored in
        Supabase (table <code>newsletter_subscribers</code>); sending campaigns
        is not part of this feature — export the list and use your mail tool.
      </p>
      {sp.saved ? <p className="chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}
      {sp.deleted ? <p className="chip ok" style={{ marginBottom: 12 }}>Subscriber removed.</p> : null}

      <div className="g e2">
        <div className="c">
          <h3>Subscribe box</h3>
          <form action={toggleNewsletterAction}>
            <div className="row">
              <div className="gr">
                Show on the public footer
                <small>Visitor emails land here for moderation-free list building</small>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="newsletter" defaultChecked={settings.enabled} />
                {settings.enabled ? "on" : "off"}
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="submit" className="btn p">Save</button>
            </div>
          </form>
          <div className="row" style={{ marginTop: 8 }}>
            <div className="gr">
              Subscribers
              <small>{activeCount} active of {rows.length} total</small>
            </div>
            <Link className="btn s" href="/api/admin/newsletter-csv">Export CSV</Link>
          </div>
        </div>

        <div className="c">
          <h3>List</h3>
          {rows.length === 0 ? (
            <p className="note">No subscribers yet.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Email</th><th>Lang</th><th>Status</th><th>Joined</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td>{r.locale}</td>
                    <td>
                      <span className={"chip " + (r.status === "active" ? "ok" : "")}>{r.status}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(r.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td>
                      <form action={deleteSubscriberAction.bind(null, r.id)}>
                        <button type="submit" className="btn s" style={{ color: "var(--bad)" }}>Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

export default function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <NewsletterInner searchParams={searchParams} />
    </Suspense>
  );
}
