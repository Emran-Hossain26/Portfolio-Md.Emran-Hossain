import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { createServiceClient } from "@/lib/supabase/service";
import { renderMarkdown } from "@/lib/markdown";
import { pick, type Locale } from "@/data/types";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;

  const db = createServiceClient();
  const { data } = await db
    .from("posts")
    .select("slug,title_en,title_bn,body_en,body_bn,meta_en,meta_bn,status,scheduled_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();

  const title = pick(locale, { en: data.title_en as string, bn: data.title_bn as string });
  const body = pick(locale, { en: data.body_en as string, bn: data.body_bn as string });
  const meta = pick(locale, { en: data.meta_en as string, bn: data.meta_bn as string });

  return (
    <AdminShell current="/admin/preview" heading={`Preview: ${title}`}>
      <div
        style={{
          background: "#FFF3CD",
          border: "1px solid #FFE08A",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 18,
          fontSize: 14,
          color: "#664D03",
        }}
      >
        <b>Preview mode</b> — status: {String(data.status)}. This page is
        noindex and visible only to admins.{" "}
        <a href={`/admin/blog`} style={{ textDecoration: "underline" }}>
          Edit post →
        </a>
      </div>
      <article>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>{title}</h1>
        {meta ? <p className="mute" style={{ marginBottom: 18 }}>{meta}</p> : null}
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
      </article>
    </AdminShell>
  );
}
