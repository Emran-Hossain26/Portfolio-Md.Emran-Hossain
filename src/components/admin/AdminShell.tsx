import Link from "next/link";
import { ADMIN_SECTIONS } from "@/lib/admin-constants";
import { adminConfigured } from "@/lib/supabase/admin";
import { logoutAction } from "@/app/(admin)/actions";

export function AdminShell({
  current,
  heading,
  children,
}: {
  current: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <main style={{ paddingTop: 24 }}>
      <b>
        <Link href="/admin">Emran Portfolio Admin</Link>
      </b>
      <nav className="admin-nav">
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            aria-current={current === section.href ? "page" : undefined}
          >
            {section.label}
          </Link>
        ))}
        <form action={logoutAction}>
          <button type="submit" className="btn admin-danger">
            Log out
          </button>
        </form>
      </nav>
      {!adminConfigured() ? (
        <p className="admin-note">
          <b>Supabase is not configured yet.</b> Add
          NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY (+ ADMIN_EMAIL) to .env.local and run
          supabase/schema.sql. Forms below show seed data and cannot save yet.
          <br />
          <Link href="/login">Go to login →</Link>
        </p>
      ) : null}
      <h1 style={{ fontSize: 26, margin: "22px 0 10px" }}>{heading}</h1>
      {children}
    </main>
  );
}
