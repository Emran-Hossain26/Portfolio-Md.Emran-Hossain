import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { SEO_PATHS } from "@/lib/admin-constants";
import { getPageSeo, getSeoSettings } from "@/lib/cms";
import { saveSeoAction, saveSeoSettingsAction } from "@/app/(admin)/actions";

const LANGS = [
  { lang: "en", label: "English" },
  { lang: "bn", label: "Bangla" },
] as const;

export default async function SeoPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  await requireAdmin();

  const settings = await getSeoSettings();
  const rows = await Promise.all(
    SEO_PATHS.map(async (path) => ({
      path,
      override: await getPageSeo(path),
    })),
  );

  return (
    <AdminShell current="/admin/seo" heading="SEO">
      {saved ? <p className="admin-check pass">Saved.</p> : null}
      <p className="admin-note">
        Global defaults, verification codes and per-page overrides. Per-page
        overrides take precedence over the defaults below.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 8 }}>Global settings</h3>
        <form action={saveSeoSettingsAction} className="admin-editor">
          <label>
            Title template (%s = page title)
            <input
              name="title_template"
              defaultValue={settings.title_template}
              placeholder="%s | Md Emran Hossain"
            />
          </label>
          <label>
            Default description (EN)
            <textarea
              name="default_description_en"
              rows={2}
              defaultValue={settings.default_description_en}
            />
          </label>
          <label>
            Default description (BN)
            <textarea
              name="default_description_bn"
              rows={2}
              defaultValue={settings.default_description_bn}
            />
          </label>
          <label>
            Google Search Console verification
            <input name="gsc_verification" defaultValue={settings.gsc_verification} />
          </label>
          <label>
            Bing verification
            <input name="bing_verification" defaultValue={settings.bing_verification} />
          </label>
          <label>
            Analytics ID (e.g. G-XXXX)
            <input name="analytics_id" defaultValue={settings.analytics_id} />
          </label>
          <div className="admin-actions">
            <button type="submit" className="btn p">
              Save settings
            </button>
          </div>
        </form>
      </div>

      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 8 }}>Per-page overrides</h2>
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

