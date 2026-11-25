"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { logAdminAction } from "@/lib/audit";

const BACK = "/admin/comments";

export async function setCommentStatusAction(id: string, status: string) {
  if (!adminConfigured()) redirect(BACK);
  const user = await requireAdmin();
  if (!["pending", "approved", "hidden"].includes(status)) redirect(BACK);
  await createServiceClient().from("blog_comments").update({ status }).eq("id", id);
  await logAdminAction(user, "update", "blog_comments", id, null, { status });
  redirect(BACK);
}

export async function deleteCommentAction(id: string) {
  if (!adminConfigured()) redirect(BACK);
  const user = await requireAdmin();
  const db = createServiceClient();
  // Replies cascade in the DB; drop likes of this comment too.
  await db.from("blog_likes").delete().eq("target", "comment:" + id);
  await db.from("blog_comments").delete().eq("id", id);
  await logAdminAction(user, "delete", "blog_comments", id, null, null);
  redirect(BACK);
}
