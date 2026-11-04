import type { Localized } from "./types";

/** Sample posts only — real post data arrives with the blog milestone. */
export const samplePosts: { title: Localized; meta: Localized }[] = [
  {
    title: {
      en: "How to harden Windows Server in 10 steps",
      bn: "১০ ধাপে Windows Server হার্ডেন করার উপায়",
    },
    meta: {
      en: "Sample post · 5 min read",
      bn: "নমুনা পোস্ট · ৫ মিনিট পড়া",
    },
  },
  {
    title: {
      en: "Active Directory mistakes small offices make",
      bn: "ছোট অফিসে Active Directory-র সাধারণ ভুল",
    },
    meta: {
      en: "Sample post · 6 min read",
      bn: "নমুনা পোস্ট · ৬ মিনিট পড়া",
    },
  },
];
