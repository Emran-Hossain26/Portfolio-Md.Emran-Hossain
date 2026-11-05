import { logoutAction } from "@/app/(admin)/actions";

export default function LogoutPage() {
  logoutAction().catch(() => {
    // Silently fail, redirect anyway
  });
  return null;
}
