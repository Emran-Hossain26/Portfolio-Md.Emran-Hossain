import { LoginScene } from "@/components/admin/LoginScene";
import "./login-scene.css";

// searchParams drive the error messages; keep the route blocking rather
// than having the shell stream twice during dev navigations.
export const instant = false;

const ERRORS: Record<string, string> = {
  auth: "Wrong email or password.",
  unauthorized: "That account is not the configured admin (ADMIN_EMAIL).",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const { error, reason } = await searchParams;
  const message =
    reason === "notconfigured"
      ? "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and ADMIN_EMAIL in .env.local, then restart the server."
      : error
        ? (ERRORS[error] ?? "Sign-in failed, please try again.")
        : null;

  return <LoginScene error={message} />;
}
