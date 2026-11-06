import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getBranding, getFooterText, getAboutTexts } from "@/lib/cms";
import { saveBrandingAction, saveBrandBadgeAction } from "@/app/(admin)/actions";


async function BrandingInner({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  await requireAdmin();

  const [branding, footer, about] = await Promise.all([
    getBranding(),
    getFooterText(),
    getAboutTexts(),
  ]);

  const errors: Record<string, string> = {
    empty: "Choose a file first.",
    size: "File is larger than 2 MB.",
    type: "Use PNG, JPG, WebP or SVG.",
    upload: "Upload failed — check the storage bucket.",
  };

  return (
    <AdminShell heading="Branding, footer & about">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Site name, badge, copyright line and the About-page bio. Empty fields
        fall back to the built-in seed texts.
      </p>
      {saved ? <p className="chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}
      {error ? <p className="chip bad" style={{ marginBottom: 12 }}>{errors[error] ?? "Something went wrong."}</p> : null}

      <div className="g e2">
        <div className="c">
          <h3>Brand</h3>
          <form action={saveBrandingAction} style={{ display: "grid", gap: 10 }}>
            <div className="g2" style={{ gap: 10 }}>
              <label>
                Brand name (EN)
                <input type="text" name="brand_en" defaultValue={branding?.brand_en ?? ""} maxLength={60} placeholder="Emran Hossain" />
              </label>
              <label>
                ব্র্যান্ড নাম (BN)
                <input type="text" name="brand_bn" defaultValue={branding?.brand_bn ?? ""} maxLength={60} placeholder="ইমরান হোসেন" />
              </label>
            </div>
            <label>
              Footer text (EN)
              <input type="text" name="footer_en" defaultValue={footer?.en ?? ""} maxLength={300} placeholder="© {year} Md Emran Hossain" />
            </label>
            <label>
              ফুটার টেক্সট (BN)
              <input type="text" name="footer_bn" defaultValue={footer?.bn ?? ""} maxLength={300} placeholder="© {year} মোঃ ইমরান হোসেন" />
            </label>
            <label>
              About bio (EN) — blank line = new paragraph
              <textarea name="about_en" rows={6} defaultValue={about?.en ?? ""} />
            </label>
            <label>
              বায়ো (BN) — ফাঁকা লাইন = নতুন প্যারা
              <textarea name="about_bn" rows={6} defaultValue={about?.bn ?? ""} />
            </label>
            <div>
              <button type="submit" className="btn p">Save</button>
            </div>
          </form>
        </div>

        <div className="c">
          <h3>Logo / badge</h3>
          {branding?.badge_url ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.badge_url}
                alt="Current badge"
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)" }}
              />
              <span className="chip ok">active</span>
            </div>
          ) : (
            <p className="note">No badge uploaded — the header shows the text-only brand.</p>
          )}
          <form action={saveBrandBadgeAction} style={{ display: "grid", gap: 10 }}>
            <label>
              Badge image (PNG/JPG/WebP/SVG, max 2 MB)
              <input type="file" name="badge" accept=".png,.jpg,.jpeg,.webp,.svg" />
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="submit" className="btn p">Upload badge</button>
            </div>
          </form>
          {branding?.badge_url ? (
            <form action={saveBrandingAction} style={{ marginTop: 12 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" name="remove_badge" />
                Remove badge
              </label>
              <input type="hidden" name="brand_en" value={branding?.brand_en ?? ""} />
              <input type="hidden" name="brand_bn" value={branding?.brand_bn ?? ""} />
              <input type="hidden" name="footer_en" value={footer?.en ?? ""} />
              <input type="hidden" name="footer_bn" value={footer?.bn ?? ""} />
              <input type="hidden" name="about_en" value={about?.en ?? ""} />
              <input type="hidden" name="about_bn" value={about?.bn ?? ""} />
              <div style={{ marginTop: 8 }}>
                <button type="submit" className="btn s">Remove</button>
              </div>
            </form>
          ) : null}
          <p className="note" style={{ marginTop: 12 }}>
            The badge appears next to the brand name in the public header. The
            footer line supports <code>{"{year}"}</code> for the current year.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}

export default function BrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <BrandingInner searchParams={searchParams} />
    </Suspense>
  );
}
