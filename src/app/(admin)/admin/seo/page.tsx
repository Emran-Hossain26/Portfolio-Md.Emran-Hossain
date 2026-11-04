import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { SEO_PATHS } from "@/lib/admin-constants";
import { getPageSeo } from "@/lib/cms";
import { saveSeoAction } from "@/app/(admin)/actions";

const LANGS = [
  { lang: "en", label: "English" },
  { lang: "bn", label: "Bangla" },
] as const;

export default async function SeoPage() {
  await requireAdmin();

  const rows = await Promise.all(
    SEO_PATHS.map(async (path) => ({
      path,
      override: await getPageSeo(path),
    })),
  );

  return (
    <AdminShell current="/admin/seo" heading="SEO">
      <p className="admin-note">
        Per-page, per-language <code>&lt;title&gt;</code> and meta description.
        Limits: title ≤ 60 chars, description ≤ 160 chars. Empty fields fall
        back to the built-in messages (messages/en.json, messages/bn.json) at{" "}
        <code>meta.pages.*</code>. Overrides flow through to canonical URLs,
        hreflang, open graph and twitter cards.
      </p>
      {rows.map(({ path, override }) =>
        LANGS.map(({ lang, label }) => (
          <div className="card" style={{ marginTop: 14 }} key={`${path}-${lang}`}>
            <h3 style={{ marginBottom: 8 }}>
              {path === "/" ? "Home" : path} · {label}
            </h3>
            <form action={saveSeoAction} className="admin-editor">
              <input type="hidden" name="__path" value={path} />
              <input type="hidden" name="__lang" value={lang} />
              <label>
                Title (≤ 60)
                <input
                  type="text"
                  name="title"
                  maxLength={60}
                  defaultValue={override?.title[lang as "en" | "bn"] ?? ""}
                  placeholder={`Built-in: messages/${lang}.json → meta.pages`}
                  spellCheck={lang === "en"}
                />
              </label>
              <label>
                Description (≤ 160)
                <textarea
                  name="description"
                  rows={3}
                  maxLength={160}
                  defaultValue={override?.description[lang as "en" | "bn"] ?? ""}
                  spellCheck={lang === "en"}
                />
              </label>
              <div className="admin-actions">
                <button type="submit" className="btn p">
                  Save {label}
                </button>
              </div>
            </form>
          </div>
        )),
      )}
    </AdminShell>
  );
}
