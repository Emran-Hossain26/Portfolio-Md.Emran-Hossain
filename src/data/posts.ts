import type { Localized } from "./types";

export type Post = {
  slug: string;
  title: Localized;
  meta: Localized;
  body: Localized;
};

/** Sample posts only — real post data arrives with the blog/Supabase milestone. */
export const samplePosts: Post[] = [
  {
    slug: "harden-windows-server-10-steps",
    title: {
      en: "How to harden Windows Server in 10 steps",
      bn: "১০ ধাপে Windows Server হার্ডেন করার উপায়",
    },
    meta: {
      en: "Sample post · 5 min read",
      bn: "নমুনা পোস্ট · ৫ মিনিট পড়া",
    },
    body: {
      en: "This is a sample placeholder article. The real, written article will be published once the blog milestone lands and content moves into Supabase. Nothing here is presented as finished work.",
      bn: "এটি একটি নমুনা প্লেসহোল্ডার পোস্ট। ব্লগ মাইলস্টোন ও Supabase কনটেন্ট চালু হলে আসল লেখা প্রকাশ হবে।",
    },
  },
  {
    slug: "active-directory-small-office-mistakes",
    title: {
      en: "Active Directory mistakes small offices make",
      bn: "ছোট অফিসে Active Directory-র সাধারণ ভুল",
    },
    meta: {
      en: "Sample post · 6 min read",
      bn: "নমুনা পোস্ট · ৬ মিনিট পড়া",
    },
    body: {
      en: "This is a sample placeholder article. The real, written article will be published once the blog milestone lands and content moves into Supabase. Nothing here is presented as finished work.",
      bn: "এটি একটি নমুনা প্লেসহোল্ডার পোস্ট। ব্লগ মাইলস্টোন ও Supabase কনটেন্ট চালু হলে আসল লেখা প্রকাশ হবে।",
    },
  },
];

export function getPost(slug: string): Post | undefined {
  return samplePosts.find((post) => post.slug === slug);
}
