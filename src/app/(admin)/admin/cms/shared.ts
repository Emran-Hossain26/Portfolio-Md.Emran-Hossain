/** Client-safe CMS types/constants — no server imports (used by CmsManager). */

export type CmsModule = "projects" | "services" | "experience";

export const TABS = ["all", "published", "drafts", "unpublished", "archived", "trash"] as const;
export type CmsTab = (typeof TABS)[number];

/** One dashboard row — normalized across the three modules. */
export type CmsAdminRow = {
  id: string;
  slug: string;
  name: string;
  nameSub: string;
  badge: string;
  tags: string[];
  thumb: string;
  pubStatus: string;
  legacyPublished: boolean;
  featured: boolean;
  updatedAt: string;
  deletedAt: string | null;
};
