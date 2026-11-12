import { redirect } from "next/navigation";

/**
 * Task U5: /admin/texts was the legacy hero-texts editor and wrote the same
 * `hero_texts` settings key as the newer Hero editor (/admin/hero) — keeping
 * both invited conflicting edits. The route now forwards there.
 */
export default function TextsPage() {
  redirect("/admin/hero");
}
