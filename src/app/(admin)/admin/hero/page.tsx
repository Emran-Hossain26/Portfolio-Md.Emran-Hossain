import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getHeroTexts } from "@/lib/cms";
import { saveHeroTextsAction } from "@/app/(admin)/actions";
import { Suspense } from "react";
import { pick, type Locale } from "@/data/types";

async function HeroEditorInner({
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

export default function HeroEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <HeroEditorInner searchParams={searchParams} />
    </Suspense>
  );
}
