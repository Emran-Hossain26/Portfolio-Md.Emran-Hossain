import { redirect } from "next/navigation";

/**
 * Task U5: /admin/messages was the legacy contact-messages inbox and read
 * the same data as the unified Inbox (/admin/inbox) — keeping both invited
 * divergent moderation. The route now forwards there.
 */
export default function MessagesPage() {
  redirect("/admin/inbox");
}
