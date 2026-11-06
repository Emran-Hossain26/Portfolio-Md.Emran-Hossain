const fs = require("fs");
const g = (p, c) => { fs.writeFileSync(p, c); console.log("wrote", p); };

/* ---------- 1) New server actions: hero texts + maintenance mode ---------- */
let actions = fs.readFileSync("src/app/(admin)/actions.ts", "utf8");
actions += `
/* ------------------------------------------------------------------ */
/* Stage 5.2: hero editor + maintenance mode                           */
/* ------------------------------------------------------------------ */

export async function saveHeroTextsAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  const value = {
    heading: {
      en: String(formData.get("heading_en") ?? "").trim(),
      bn: String(formData.get("heading_bn") ?? "").trim(),
    },
    intro: {
      en: String(formData.get("intro_en") ?? "").trim(),
      bn: String(formData.get("intro_bn") ?? "").trim(),
    },
  };
  await createServiceClient()
    .from("site_settings")
    .upsert({ key: "hero_texts", value }, { onConflict: "key" });
  refresh();
  redirect("/admin/hero?saved=1");
}

export async function saveMaintenanceAction(formData: FormData) {
  if (!adminConfigured()) redirect(CONFIGURED_ERROR);
  await requireAdmin();
  const on = formData.get("maintenance") === "on";
  await createServiceClient()
    .from("site_settings")
    .upsert(
      { key: "maintenance_mode", value: { enabled: on } },
      { onConflict: "key" },
    );
  refresh();
  redirect("/admin/system?saved=1");
}
`;
g("src/app/(admin)/actions.ts", actions);

/* ---------- 2) Hero editor (/admin/hero) ---------- */
g("src/app/(admin)/admin/hero/page.tsx", `import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getHeroTexts } from "@/lib/cms";
import { saveHeroTextsAction } from "@/app/(admin)/actions";
import { pick, type Locale } from "@/data/types";

export default async function HeroEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  await requireAdmin();
  const t = await getHeroTexts();
  const headingEn = t?.heading?.en ?? "";
  const headingBn = t?.heading?.bn ?? "";
  const introEn = t?.intro?.en ?? "";
  const introBn = t?.intro?.bn ?? "";
  const previewLocale: Locale = headingBn ? "en" : "en";

  return (
    <>
      <div className="av2-hd">
        <div>
          <h2>Hero editor</h2>
          <p>Edit the first screen in both languages. Saving refreshes the public site in seconds.</p>
        </div>
      </div>
      {saved ? <p className="av2-chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}
      <div className="av2-g av2-e2">
        <form action={saveHeroTextsAction} className="av2-c">
          <label className="f" htmlFor="h-en">Headline (English)</label>
          <input id="h-en" type="text" name="heading_en" defaultValue={headingEn} />
          <label className="f" htmlFor="h-bn">Headline (বাংলা)</label>
          <input id="h-bn" type="text" name="heading_bn" defaultValue={headingBn} />
          <label className="f" htmlFor="i-en">Subtext (English)</label>
          <textarea id="i-en" name="intro_en" rows={3} defaultValue={introEn} />
          <label className="f" htmlFor="i-bn">Subtext (বাংলা)</label>
          <textarea id="i-bn" name="intro_bn" rows={3} defaultValue={introBn} />
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="av2-btn p">Save changes</button>
          </div>
        </form>
        <div className="av2-c">
          <h3>Preview (English)</h3>
          <div className="av2-pv">
            <h4>{headingEn || "Your headline appears here"}</h4>
            <p style={{ color: "var(--mut2)" }}>{introEn}</p>
          </div>
          <h3 style={{ marginTop: 14 }}>Preview (বাংলা)</h3>
          <div className="av2-pv">
            <h4>{headingBn || "আপনার হেডলাইন এখানে দেখা যাবে"}</h4>
            <p style={{ color: "var(--mut2)" }}>{introBn}</p>
          </div>
          <div className="av2-note">
            {pick(previewLocale, { en: "Edits publish immediately after saving.", bn: "সেভ করার সাথে সাথেই পরিবর্তন প্রকাশিত হয়।" })}
          </div>
        </div>
      </div>
    </>
  );
}
`);

/* ---------- 3) Sections manager (/admin/sections, v2) ---------- */
g("src/app/(admin)/admin/sections/page.tsx", `import { AdminShell } from "@/components/admin/AdminShell";
import { saveRowAction, moveSectionAction } from "@/app/(admin)/actions";
import { getSections } from "@/lib/cms";

export default async function SectionsPage() {
  const rows = await getSections();
  return (
    <AdminShell heading="Sections">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Turn sections on or off and reorder them on the public site.
      </p>
      <div className="av2-c" style={{ maxWidth: 640 }}>
        {rows.map((r, i) => (
          <div className="av2-row" key={r.key}>
            <span className="av2-chip">{i + 1}</span>
            <div className="gr">
              <code>{r.key}</code>
            </div>
            <form action={moveSectionAction.bind(null, r.key, "up")}>
              <button type="submit" className="av2-btn s" disabled={i === 0} aria-label={"Move " + r.key + " up"}>↑</button>
            </form>
            <form action={moveSectionAction.bind(null, r.key, "down")}>
              <button type="submit" className="av2-btn s" disabled={i === rows.length - 1} aria-label={"Move " + r.key + " down"}>↓</button>
            </form>
            <form action={saveRowAction.bind(null, "sections", r.key)} className="admin-editor" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input type="hidden" name="key" value={r.key} />
              <input type="hidden" name="sort_order" value={r.sort_order} />
              <input type="hidden" name="enabled" value={r.enabled ? "on" : ""} />
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="enabled" defaultChecked={r.enabled} />
                enabled
              </label>
              <button type="submit" className="av2-btn s">Save</button>
            </form>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="av2-note">No sections in the database yet — run the migrations first.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
`);

/* ---------- 4) Inbox (/admin/inbox, v2 restyle) ---------- */
g("src/app/(admin)/admin/inbox/page.tsx", `import { AdminShell } from "@/components/admin/AdminShell";
import { updateMessageStatusAction } from "@/app/(admin)/actions";
import { getMessagesInbox } from "@/lib/cms";

const STATUSES = ["new", "read", "replied", "spam"] as const;
const tone: Record<string, string> = { new: "acc", read: "", replied: "ok", spam: "bad" };

export default async function InboxPage() {
  const rows = await getMessagesInbox();
  return (
    <AdminShell heading="Inbox">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Messages from the contact form. Mark status as you handle them.
      </p>
      {rows.length === 0 ? (
        <div className="av2-c">No messages yet.</div>
      ) : (
        <div className="av2-g" style={{ maxWidth: 760 }}>
          {rows.map((m) => (
            <div className="av2-c" key={m.id}>
              <h3>
                {m.name}
                <span className={"av2-chip " + (tone[m.status] ?? "")}>{m.status}</span>
              </h3>
              <p style={{ color: "var(--mut2)", fontSize: 13 }}>{m.email}</p>
              <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{m.message}</p>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <form key={s} action={updateMessageStatusAction.bind(null, m.id, s)}>
                    <button
                      type="submit"
                      className={"av2-btn s" + (m.status === s ? " p" : "")}
                    >
                      {s}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
`);

/* ---------- 5) System (/admin/system) ---------- */
g("src/app/(admin)/admin/system/page.tsx", `import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createServiceClient, adminConfigured } from "@/lib/supabase/service";
import { saveMaintenanceAction } from "@/app/(admin)/actions";

async function maintenanceEnabled(): Promise<boolean> {
  if (!adminConfigured()) return false;
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    return Boolean((data?.value as { enabled?: boolean } | null)?.enabled);
  } catch {
    return false;
  }
}

export default async function SystemPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  await requireAdmin();
  const maint = await maintenanceEnabled();

  return (
    <AdminShell heading="System">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Safety, backups and site-wide controls.
      </p>
      {saved ? <p className="av2-chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}
      <div className="av2-g av2-e2">
        <div className="av2-c">
          <h3>Controls</h3>
          <form action={saveMaintenanceAction}>
            <div className="av2-row">
              <div className="gr">
                Maintenance mode
                <small>Shows a friendly back-soon page to visitors</small>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="maintenance" defaultChecked={maint} />
                {maint ? "on" : "off"}
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="submit" className="av2-btn p">Save</button>
            </div>
          </form>
          <div className="av2-row" style={{ marginTop: 8 }}>
            <div className="gr">
              Backup
              <small>Content as JSON plus media list (after migrations)</small>
            </div>
            <span className="av2-chip">planned</span>
          </div>
          <div className="av2-row">
            <div className="gr">
              Two-factor login
              <small>Authenticator app</small>
            </div>
            <span className="av2-chip warn">not set up</span>
          </div>
          <div className="av2-row">
            <div className="gr">
              Email notifications
              <small>New message alerts (Resend)</small>
            </div>
            <span className="av2-chip">needs API key</span>
          </div>
        </div>
        <div className="av2-c">
          <h3>Roles</h3>
          <div className="av2-row">
            <div className="gr">
              Administrator
              <small>Full access (admins table, is_admin enforced)</small>
            </div>
            <span className="av2-chip acc">you</span>
          </div>
          <div className="av2-note">
            Audit log arrives with the audit-log migration (Stage 5.2 follow-up).
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
`);
console.log("all v2 pages written");
