import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getHeroTexts } from "@/lib/cms";
import { Suspense } from "react";
import { HeroEditorForm } from "@/components/admin/HeroEditorForm";

async function HeroEditorInner() {
  await requireAdmin();
  const t = await getHeroTexts();

  return (
    <>
      <div className="hd">
        <div>
          <h2>Hero editor</h2>
          <p>Edit the first screen in both languages. The preview updates as you type.</p>
        </div>
      </div>
      <HeroEditorForm
        initial={{
          heading_en: t?.heading?.en ?? "",
          heading_bn: t?.heading?.bn ?? "",
          intro_en: t?.intro?.en ?? "",
          intro_bn: t?.intro?.bn ?? "",
          cta_en: t?.cta?.en ?? "",
          cta_bn: t?.cta?.bn ?? "",
          avail: t?.avail !== false,
        }}
      />
    </>
  );
}

export default function HeroEditorPage() {
  return (
    <Suspense fallback={null}>
      <HeroEditorInner />
    </Suspense>
  );
}
