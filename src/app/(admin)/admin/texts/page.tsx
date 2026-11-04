import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { saveTextsAction } from "@/app/(admin)/actions";
import { getHeroTexts } from "@/lib/cms";

export default async function TextsPage() {
  await requireAdmin();
  const texts = await getHeroTexts();

  return (
    <AdminShell current="/admin/texts" heading="Hero texts">
      <form action={saveTextsAction} className="admin-editor">
        <label>
          Heading (EN)
          <textarea
            name="hero_heading_en"
            rows={2}
            defaultValue={texts?.heading.en ?? ""}
          />
        </label>
        <label>
          Intro (EN)
          <textarea name="hero_intro_en" rows={3} defaultValue={texts?.intro.en ?? ""} />
        </label>
        <label>
          Heading (BN)
          <textarea
            name="hero_heading_bn"
            rows={2}
            defaultValue={texts?.heading.bn ?? ""}
          />
        </label>
        <label>
          Intro (BN)
          <textarea name="hero_intro_bn" rows={3} defaultValue={texts?.intro.bn ?? ""} />
        </label>
        <p className="admin-note">
          Empty fields fall back to the built-in texts (messages/en.json,
          messages/bn.json). Saving here overrides them on both locales.
        </p>
        <div className="admin-actions">
          <button type="submit" className="btn p">
            Save texts
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
