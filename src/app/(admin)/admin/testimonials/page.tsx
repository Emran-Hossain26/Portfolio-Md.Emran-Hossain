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
    const { data } = await createServiceClient()
      .from("testimonials")
      .select("id,name,company,quote_en,quote_bn,status")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as Row[];
  } else {
    rows = seedTestimonials.map((t, index) => ({
      id: `seed-${index}`,
      name: t.name.en.split(",")[0],
      company: t.name.en.split(",")[1]?.trim() ?? "Company",
      quote_en: t.quote.en,
      quote_bn: t.quote.bn,
      status: "approved",
    }));
  }

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
      </p>
      {rows.map((row) => (
        <RowForm
          key={row.id}
          table="testimonials"
          id={row.id}
          fields={SPEC.map((field) => ({
            ...field,
            value: (row[field.name] ?? "") as string,
          }))}
        />
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
