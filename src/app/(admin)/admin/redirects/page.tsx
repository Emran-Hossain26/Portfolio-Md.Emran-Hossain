import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { RowForm, fieldsFromSpec } from "@/components/admin/RowForm";
import { createServiceClient } from "@/lib/supabase/service";
import { adminConfigured } from "@/lib/supabase/service";

const ERRORS: Record<string, string> = {
  from: '"From" must be a relative path starting with "/".',
  to: '"To" must be a relative path starting with "/" or an https:// URL.',
  same: '"From" and "To" cannot be the same.',
  target: 'Targets under /admin or /api are not allowed.',
  loop: 'This redirect would create a loop.',
  chain: 'Redirect chain is too long (max 2 hops).',
};

export default async function RedirectsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  let rows: { id: string; from_url: string; to_url: string; permanent: boolean }[] = [];
  if (adminConfigured()) {
    const { data } = await createServiceClient()
      .from("redirects")
      .select("id,from_url,to_url,permanent")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as typeof rows;
  }

  const SPEC = [
    { name: "from_url", label: "From URL (e.g. /old-page)", type: "text" as const },
    { name: "to_url", label: "To URL (e.g. /new-page or https://...)", type: "text" as const },
    { name: "permanent", label: "Permanent (301)", type: "check" as const },
  ];

  return (
    <AdminShell current="/admin/redirects" heading="Redirect manager">
      {error && ERRORS[error] ? (
        <p className="admin-check fail">{ERRORS[error]}</p>
      ) : null}
      <p className="admin-note">
        301/302 redirects, cached 5 minutes in the proxy. Changes take effect
        within 5 minutes (or immediately after a revalidation).
      </p>
      {rows.map((r) => (
        <RowForm
          key={r.id}
          table="redirects"
          id={r.id}
          fields={fieldsFromSpec(SPEC, {
            from_url: r.from_url,
            to_url: r.to_url,
            permanent: r.permanent,
          })}
        />
      ))}
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Add redirect</h3>
        <RowForm
          table="redirects"
          id="__new"
          fields={fieldsFromSpec(SPEC, {
            from_url: "",
            to_url: "",
            permanent: true,
          })}
        />
      </div>
    </AdminShell>
  );
}

