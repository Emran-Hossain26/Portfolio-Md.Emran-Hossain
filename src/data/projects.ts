import type { Localized } from "./types";

export type Project = {
  title: Localized;
  desc: Localized;
  tags: string[];
  /** Private repos get no source link; only live sites link out. */
  href?: string;
};

export const projects: Project[] = [
  {
    title: { en: "Likhon Tools", bn: "Likhon Tools" },
    desc: {
      en: "Bilingual Bangla/English online tools platform. Live.",
      bn: "বাংলা/ইংরেজি দ্বিভাষিক অনলাইন টুলস প্ল্যাটফর্ম। লাইভ।",
    },
    tags: ["TypeScript", "SEO", "Live"],
    href: "https://likhontools.com/",
  },
  {
    title: { en: "Media Frame BD", bn: "Media Frame BD" },
    desc: {
      en: "Design tool for photo cards, banners and thumbnails for creators and newsrooms.",
      bn: "ক্রিয়েটর ও নিউজরুমের জন্য ফটো কার্ড, ব্যানার ও থাম্বনেইল ডিজাইন টুল।",
    },
    tags: ["TypeScript"],
  },
  {
    title: { en: "OSDMS", bn: "OSDMS" },
    desc: {
      en: "Office stock, distribution and attendance management system.",
      bn: "অফিসের স্টক, বিতরণ ও হাজিরা ব্যবস্থাপনা সিস্টেম।",
    },
    tags: ["PHP", "Blade"],
  },
  {
    title: { en: "Office TV Control", bn: "অফিস টিভি কন্ট্রোল" },
    desc: {
      en: "Dashboard to control Android TVs across two floors, with live broadcast.",
      bn: "দুই তলার Android TV নিয়ন্ত্রণের ড্যাশবোর্ড, লাইভ সম্প্রচারসহ।",
    },
    tags: ["LAN", "Android 14"],
  },
];
