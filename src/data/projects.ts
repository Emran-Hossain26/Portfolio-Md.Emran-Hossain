import type { Localized } from "./types";

export type Project = {
  slug: string;
  title: Localized;
  desc: Localized;
  tags: string[];
  /** Private repos get no source link; only live sites link out. */
  href?: string;
  /** Optional OG/Twitter share image for the project page. */
  og_image?: string;
};

/**
 * Real projects from the owner CV (CONTENT.md). Private repos are case
 * studies without source links; only Likhon Tools is live.
 */
export const projects: Project[] = [
  {
    slug: "likhon-tools",
    title: { en: "Likhon Tools", bn: "লিখন টুলস" },
    desc: {
      en: "Bilingual web tools app with advanced text converters and Bangla text utilities. Live.",
      bn: "অ্যাডভান্সড টেক্সট কনভার্টার ও বাংলা টেক্সট ইউটিলিটির দ্বিভাষিক ওয়েব টুলস। লাইভ।",
    },
    tags: ["TypeScript", "JavaScript", "Node.js", "Live"],
    href: "https://likhontools.com/",
  },
  {
    slug: "media-frame-bd",
    title: { en: "Media Frame BD", bn: "মিডিয়া ফ্রেম বিডি" },
    desc: {
      en: "Bilingual online design suite for photo cards, news frames, barcodes and YouTube thumbnails — built for newsroom staff and local creators.",
      bn: "নিউজরুম কর্মী ও স্থানীয় ক্রিয়েটরদের জন্য ফটো কার্ড, নিউজ ফ্রেম, বারকোড ও থাম্বনেইলের দ্বিভাষিক অনলাইন ডিজাইন স্যুট।",
    },
    tags: ["TypeScript", "Node.js"],
  },
  {
    slug: "osdms",
    title: { en: "OSDMS — Office Stock & Distribution", bn: "ওএসডিএমএস — অফিস স্টক ও ডিস্ট্রিবিউশন" },
    desc: {
      en: "Self-hosted ERP and inventory system that streamlines distribution, tracks IT modules and centralises stock data for newsroom operations.",
      bn: "সেলফ-হোস্টেড ERP ও ইনভেন্টরি সিস্টেম — বিতরণ সহজ, আইটি মডিউল ট্র্যাকিং ও স্টক ডেটা এক জায়গায়।",
    },
    tags: ["PHP", "Laravel", "Blade", "MySQL"],
  },
  {
    slug: "office-tv-control",
    title: { en: "Office TV Control", bn: "অফিস টিভি কন্ট্রোল" },
    desc: {
      en: "Dashboard that controls Android TVs across two floors with live broadcast — the broadcast-infrastructure backbone of a national daily's video output.",
      bn: "দুই তলার Android TV নিয়ন্ত্রণের ড্যাশবোর্ড, লাইভ সম্প্রচারসহ — জাতীয় দৈনিকের ভিডিও আউটপুটের ব্রডকাস্ট-ইনফ্রাস্ট্রাকচার।",
    },
    tags: ["LAN", "Android 14", "Broadcast"],
  },
  {
    slug: "agamir-canteen",
    title: { en: "Agamir Canteen", bn: "আগামীর ক্যান্টিন" },
    desc: {
      en: "Internal PWA that digitises the canteen workflow: employees order, admins approve — with rotating menus and unified tracking.",
      bn: "ইন্টার্নাল PWA — কর্মীরা অর্ডার করে, অ্যাডমিন অনুমোদন দেয়; ঘুরে ফেরা মেনু ও ট্র্যাকিং এক জায়গায়।",
    },
    tags: ["PHP", "Laravel", "PWA", "Offline-first"],
  },
  {
    slug: "attendance-leave-management",
    title: { en: "Attendance & Leave Management", bn: "হাজিরা ও ছুটি ব্যবস্থাপনা" },
    desc: {
      en: "HR module that automates leave workflows and integrates ZKTeco biometric devices — no more manual attendance records.",
      bn: "HR মডিউল — ছুটির ওয়ার্কফ্লো অটোমেটেড, ZKTeco বায়োমেট্রিক ডিভাইস ইন্টিগ্রেশন।",
    },
    tags: ["PHP", "Laravel", "Blade", "ZKTeco"],
  },
  {
    slug: "modern-e-paper",
    title: { en: "Modern E-Paper Concept", bn: "মডার্ন ই-পেপার কনসেপ্ট" },
    desc: {
      en: "A fast, clean e-paper reading concept that also streamlines newsroom publishing.",
      bn: "দ্রুত, পরিচ্ছন্ন ই-পেপার পড়ার কনসেপ্ট — নিউজরুম প্রকাশনাও সহজ।",
    },
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    slug: "digitalshebabd",
    title: { en: "DigitalShebaBD", bn: "ডিজিটালশেবাবিডি" },
    desc: {
      en: "Service-oriented portal for quick access to essential local digital services and utilities.",
      bn: "স্থানীয় ডিজিটাল সেবা ও ইউটিলিটিতে দ্রুত পৌঁছানোর সার্ভিস-ওরিয়েন্টেড পোর্টাল।",
    },
    tags: ["TypeScript", "Web"],
  },
];
