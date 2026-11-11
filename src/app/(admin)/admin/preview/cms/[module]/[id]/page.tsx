import { requireAdmin } from "@/lib/supabase/admin-auth";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PreviewShell } from "@/components/admin/PreviewShell";
import { fetchCmsRow, type CmsModule } from "../../../../cms/data";

const MODULES: Record<string, { base: string; table: string }> = {
  projects: { base: "/admin/projects", table: "projects" },
  services: { base: "/admin/services", table: "services" },
  experience: { base: "/admin/experience", table: "experience" },
};

const s = (v: unknown) => String(v ?? "");

/**
 * Task U4: realistic draft preview using the actual public components.
 * Renders ANY status (draft/unpublished/archived) but only inside the
 * admin-gated chrome — never on the public site, never publishes.
 */
export default async function CmsPreviewPage({
  params,
}: {
  params: Promise<{ module: string; id: string }>;
}) {
  await requireAdmin();
  const { module, id } = await params;
  const cfg = MODULES[module];
  if (!cfg) notFound();
  const row = await fetchCmsRow(module as CmsModule, id);
  if (!row) notFound();

  const mod = module as CmsModule;
  const name = s(row.title_en || row.role_en);
  const nameSub = s(row.title_bn || row.role_bn);
  const desc =
    mod === "projects" ? s(row.problem_en) : mod === "services" ? s(row.desc_en) : s(row.summary_en) || s(row.details);
  const fullDesc = mod === "projects" ? s(row.solution_en) : mod === "services" ? s(row.full_desc_en) : s(row.details);
  const tags = Array.isArray(row.tech) ? (row.tech as string[]) : Array.isArray(row.tags) ? (row.tags as string[]) : [];
  const thumb = mod === "projects" ? s(row.cover_url) : mod === "services" ? s(row.image_url) : s(row.logo_url);
  const badge =
    mod === "projects" ? s(row.category) : mod === "services" ? s(row.price) : s(row.employment_type).replace("-", " ");
  const status = s(row.pub_status) || (row.published !== false ? "published" : "draft");

  const duration =
    mod === "experience"
      ? row.is_current === true
        ? `${s(row.start_date)} — Present`
        : `${s(row.start_date)} — ${s(row.end_date)}`
      : "";

  return (
    <AdminShell current={cfg.base} heading={`Preview: ${name}`}>
      <PreviewShell module={mod} backHref={`${cfg.base}/${id}`} revisionsHref={`${cfg.base}/${id}/revisions`}>
        <article className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
            ) : null}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22 }}>{name}</h2>
              {nameSub ? <p style={{ color: "var(--mut)" }}>{nameSub}</p> : null}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                <span className="chip acc">{status}</span>
                {badge ? <span className="chip">{badge}</span> : null}
                {duration ? <span className="chip">{duration}</span> : null}
                {row.featured === true ? <span className="chip">★ featured</span> : null}
              </div>
            </div>
          </div>
          {desc ? <p style={{ marginTop: 12 }}>{desc}</p> : null}
          {fullDesc && fullDesc !== desc ? <p style={{ marginTop: 8, color: "var(--mut)" }}>{fullDesc}</p> : null}
          {tags.length ? (
            <div className="tags" style={{ marginTop: 12 }}>
              {tags.map((t) => <span key={t}>{t}</span>)}
            </div>
          ) : null}
          <p className="admin-note" style={{ marginTop: 14 }}>
            This is the admin-only preview of the actual public card layout. The record is <b>{status}</b> — the
            public site shows it only after Publish.
          </p>
        </article>
      </PreviewShell>
    </AdminShell>
  );
}
