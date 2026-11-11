import type { Localized } from "./types";

export type Post = {
  slug: string;
  title: Localized;
  meta: Localized;
  body: Localized;
};

/** Sample posts only — real post data arrives with the blog/Supabase milestone. */
export const samplePosts: Post[] = [];
;

export function getPost(slug: string): Post | undefined {
  return samplePosts.find((post) => post.slug === slug);
}
