import Link from "next/link";
import { adminConfigured } from "@/lib/supabase/admin";

/**
 * Page wrapper INSIDE the admin chrome. The sidebar/header/footer live in
 * the (admin) layout — this renders the page heading only (single nav).
 */
export function AdminShell({
  current,
  heading,
  children,
}: {
  /** Kept for call-site compatibility; navigation chrome moved to the layout. */
  current?: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-content p-8 max-w-6xl mx-auto w-full">
      {!adminConfigured() ? (
        <div className="admin-note">
          <b>Supabase is not configured yet.</b> Add
          NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY (+ ADMIN_EMAIL) to .env.local and run
          supabase/schema.sql. Forms below show seed data and cannot save yet.
          <br />
          <Link href="/login">Go to login &rarr;</Link>
        </div>
      ) : null}
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{heading}</h1>
      {children}
    </div>
  );
}
