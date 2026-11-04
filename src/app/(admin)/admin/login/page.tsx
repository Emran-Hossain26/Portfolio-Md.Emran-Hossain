import Link from "next/link";
import { loginAction } from "@/app/(admin)/actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const { error, reason } = await searchParams;

  return (
    <main style={{ paddingTop: 40 }}>
      {reason === "notconfigured" ? (
        <p className="admin-note">
          Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and
          ADMIN_EMAIL in .env.local, then restart the server.
        </p>
      ) : null}
      {reason === "unauthorized" || error === "unauthorized" ? (
        <p className="admin-check fail">
          That account is not the configured admin (ADMIN_EMAIL).
        </p>
      ) : null}
      {error === "auth" ? (
        <p className="admin-check fail">Wrong email or password.</p>
      ) : null}
      <h1 style={{ fontSize: 26, margin: "18px 0 16px" }}>Admin login</h1>
      <form action={loginAction} className="admin-editor">
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        <div className="admin-actions">
          <button type="submit" className="btn p">
            Sign in
          </button>
        </div>
      </form>
      <p className="admin-note" style={{ marginTop: 14 }}>
        <Link href="/">← Back to site</Link>
      </p>
    </main>
  );
}
