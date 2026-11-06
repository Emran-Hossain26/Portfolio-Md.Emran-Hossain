import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getModuleSettings } from "@/lib/cms";
import { saveModuleSettingsAction } from "@/app/(admin)/actions";

async function ExtrasInner({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  await requireAdmin();
  const m = await getModuleSettings();

  return (
    <AdminShell heading="Extras & widgets">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Stage 6 feature toggles that are not home sections. Skills / Now are
        toggled from the Sections manager instead.
      </p>
      {sp.saved ? <p className="chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}

      <form action={saveModuleSettingsAction}>
        <div className="g e2">
          <div className="c">
            <h3>Interactive</h3>
            {[
              ["terminal", "Terminal “About me”", "Interactive console on the About page"],
              ["palette", "Command palette", "Ctrl/Cmd+K search across pages, posts, projects + theme switch"],
            ].map(([name, label, small]) => (
              <div className="row" key={name}>
                <div className="gr">
                  {label}
                  <small>{small}</small>
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                  <input type="checkbox" name={name} defaultChecked={m[name as "terminal" | "palette"]} />
                  {m[name as "terminal" | "palette"] ? "on" : "off"}
                </label>
              </div>
            ))}
          </div>

          <div className="c">
            <h3>Services &amp; booking</h3>
            <div className="row">
              <div className="gr">
                Services page
                <small>Public /services with packages</small>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="services" defaultChecked={m.services} />
                {m.services ? "on" : "off"}
              </label>
            </div>
            <div className="row">
              <div className="gr">
                Quote form
                <small>“Request a quote” on the services page</small>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="quote" defaultChecked={m.quote} />
                {m.quote ? "on" : "off"}
              </label>
            </div>
            <div className="row">
              <div className="gr">
                Consultation booking
                <small>Slot picker on the contact page (slots in Booking)</small>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="booking" defaultChecked={m.booking} />
                {m.booking ? "on" : "off"}
              </label>
            </div>
          </div>

          <div className="c">
            <h3>Widgets (optional)</h3>
            <div className="row">
              <div className="gr">
                GitHub activity
                <small>Recent public events on the About page</small>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="github" defaultChecked={m.github} />
                {m.github ? "on" : "off"}
              </label>
            </div>
            <label style={{ display: "block", marginTop: 8 }}>
              GitHub username
              <input type="text" name="github_username" defaultValue={m.githubUsername} placeholder="e.g. torvalds" />
            </label>
            <div className="row" style={{ marginTop: 8 }}>
              <div className="gr">
                Visitor country badge
                <small>Small footer chip showing visitors their own country</small>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="country_badge" defaultChecked={m.countryBadge} />
                {m.countryBadge ? "on" : "off"}
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button type="submit" className="btn p">Save</button>
        </div>
      </form>
    </AdminShell>
  );
}

export default function ExtrasPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ExtrasInner searchParams={searchParams} />
    </Suspense>
  );
}
