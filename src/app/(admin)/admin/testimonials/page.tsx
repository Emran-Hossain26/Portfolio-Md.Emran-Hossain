import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, type AdminField } from "@/components/admin/RowForm";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { placeholderTestimonials as seedTestimonials } from "@/data/testimonials";

type Row = Record<string, unknown> & { id: string };


const SPEC: {
  name: string;
  label: string;
  type: AdminField["type"];
  options?: { value: string; label: string }[];
}[] = [
  { name: "name", label: "Client name", type: "text" },
  { name: "company", label: "Company / role", type: "text" },
  { name: "quote_en", label: "Quote (EN)", type: "textarea" },
  { name: "quote_bn", label: "Quote (BN)", type: "textarea" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "pending", label: "Pending moderation" },
      { value: "approved", label: "Approved (public)" },
      { value: "hidden", label: "Hidden" },
    ],
  },
];

export default async function AdminTestimonialsPage() {
  await requireAdmin();

  let rows: Row[];
  if (adminConfigured()) {
    const db = createServiceClient();
    const { data } = await db
      .from("testimonials")
      .select("id,name,company,quote_en,quote_bn,status,source,rating")
      .order("created_at", { ascending: false });
    if (data) {
      rows = data as Row[];
    } else {
      // Pre-migration: source/rating columns missing — retry without them.
      const retry = await db
        .from("testimonials")
        .select("id,name,company,quote_en,quote_bn,status")
        .order("created_at", { ascending: false });
      rows = (retry.data ?? []) as Row[];
    }
  } else {
    rows = seedTestimonials.map((t, index) => ({
      id: `seed-${index}`,
      name: t.name.en.split(",")[0],
      company: t.name.en.split(",")[1]?.trim() ?? "Company",
      quote_en: t.quote.en,
      quote_bn: t.quote.bn,
      status: "approved",
      source: "admin",
      rating: null,
    }));
  }

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  const blank: Record<string, unknown> = {
    name: "",
    company: "",
    quote_en: "",
    quote_bn: "",
    status: "pending",
  };

  return (
    <AdminShell current="/admin/testimonials" heading="Testimonials">
      <p className="admin-note">
        Only “Approved” quotes appear on the site. Real client quotes only —
        never invent employers, names or dates (content rule).
        {pendingCount > 0 ? (
          <>
            {" "}Visitors submitted {pendingCount} review{pendingCount > 1 ? "s" : ""} —
            marked <b>public</b> below, waiting for your approval.
          </>
        ) : null}
      </p>
      {rows.map((row) => (
        <div key={row.id}>
          {row.status === "pending" ? (
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              <span className="chip warn">pending approval</span>
              {row.source === "public" ? <span className="chip">from website form</span> : null}
              {typeof row.rating === "number" && row.rating > 0 ? (
                <span className="chip acc">{row.rating} ★</span>
              ) : null}
            </div>
          ) : null}
          <RowForm
            table="testimonials"
            id={row.id}
            fields={SPEC.map((field) => ({
              ...field,
              value: (row[field.name] ?? "") as string,
            }))}
          />
        </div>
      ))}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add testimonial</h2>
      <RowForm
        table="testimonials"
        id="__new"
        fields={SPEC.map((f) => ({ ...f, value: blank[f.name] as string }))}
      />
    </AdminShell>
  );
}
