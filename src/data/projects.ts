import type { Localized } from "./types";

/** One slide of a project media slider (matches public.projects.slides jsonb). */
export type ProjectSlide = {
  src: string;
  caption_en: string;
  caption_bn: string;
};

/** One case-study metric row (public.projects.metrics jsonb). */
export type ProjectMetric = { label: string; value: string };

export type Project = {  slug: string;
  title: Localized;
  problem?: Localized;
  solution?: Localized;
  /** Case-study outcome paragraph (Stage 6); empty until the admin fills it. */
  result?: Localized;
  /** Outcome metrics, e.g. [{label:"Downtime", value:"-90%"}]. */
  metrics?: ProjectMetric[];
  tech: string[];
  /** slides = image slider of modules; video = click-to-load promo; none = no media. */
  media?: "slides" | "video" | "none";
  /** Promo video URL (YouTube/Vimeo/MP4) — used when media is "video". */
  video?: string;
  /** Slider entries — the ONLY screenshot source (4c); read via `slides` column. */
  slides?: ProjectSlide[];
  /** Optional live demo link ("Live demo" button only when set). */
  demo_url?: string;
  /** Preferred live link (Stage U2) — wins over demo_url when set. */
  live_url?: string;
  /** Public source repository ("Source" button only when set). */
  repo_url?: string;
  /** Lifecycle: running projects get a public "Running" badge. */
  status?: "running" | "completed" | "planned" | "paused";
  /** Featured projects float to the top of public lists. */
  featured?: boolean;
  /** Cover/thumbnail image (U4) — card media fallback and OG fallback. */
  cover_url?: string;
  /** Free-form category (U4), e.g. "Web app", "Infrastructure". */
  category?: string;
  /** personal | professional | client (U4). */
  project_type?: string;
  /** My role / responsibilities (U4). */
  role?: Localized;
  /** Key features list (U4, one per line). */
  features?: Localized;
  /** Per-record SEO overrides (U4) — used by the project page metadata. */
  seo?: {
    title?: Localized;
    desc?: Localized;
    keywords?: string;
    og_image?: string;
    canonical?: string;
    noindex?: boolean;
  };
  /** Optional OG/Twitter share image for the project page (seed/static only). */
  og_image?: string;
};

/**
 * Real projects from the owner CV (CONTENT.md), CONTENT.md order 1-7.
 * Private repos are case studies without source links; only Likhon Tools
 * has a demo_url. Slides stay empty until real screenshots are uploaded
 * from the admin (= clean placeholder on the site, never invented media).
 */
export const seedProjects: Project[] = [
  {
    slug: "osdms",
    title: { en: "OSDMS — Office Stock & Distribution", bn: "ওএসডিএমএস — অফিস স্টক ও ডিস্ট্রিবিউশন" },
    problem: {
      en: "Managing newsroom operations, IT equipment distribution and office inventory by hand is slow, error-prone and hard to track.",
      bn: "নিউজরুম অপারেশন, আইটি সরঞ্জাম বিতরণ ও অফিস ইনভেন্টরি হাতে পরিচালনা ধীর, ভুলপ্রবণ ও ট্র্যাক করা কঠিন।",
    },
    solution: {
      en: "Self-hosted ERP and inventory system that streamlines distribution, tracks IT modules and centralises stock data for newsroom operations.",
      bn: "সেলফ-হোস্টেড ERP ও ইনভেন্টরি সিস্টেম — বিতরণ সহজ, আইটি মডিউল ট্র্যাকিং ও স্টক ডেটা এক জায়গায়।",
    },
    tech: ["PHP", "Laravel", "Blade", "MySQL"],
    media: "slides",
    slides: [],
  },
  {
    slug: "agamir-canteen",
    title: { en: "Agamir Canteen", bn: "আগামীর ক্যান্টিন" },
    problem: {
      en: "Daily meal orders, rotating menus and admin approvals were chaotic with no unified tracking.",
      bn: "দৈনিক খাবারের অর্ডার, ঘুরে ফেরা মেনু ও অনুমোদন এলোমেলো, কোনো একক ট্র্যাকিং ছিল না।",
    },
    solution: {
      en: "Internal PWA that digitises the canteen workflow: employees order, admins approve — with rotating menus and unified tracking.",
      bn: "ইন্টার্নাল PWA — কর্মীরা অর্ডার করে, অ্যাডমিন অনুমোদন দেয়; ঘুরে ফেরা মেনু ও ট্র্যাকিং এক জায়গায়।",
    },
    tech: ["PHP", "Laravel", "PWA", "Offline-first"],
    media: "slides",
    slides: [],
  },
  {
    slug: "media-frame-bd",
    title: { en: "Media Frame BD", bn: "মিডিয়া ফ্রেম বিডি" },
    problem: {
      en: "Newsroom staff and local creators needed a fast way to make branded social assets without heavy design software.",
      bn: "নিউজরুম কর্মী ও স্থানীয় ক্রিয়েটরদের ভারী ডিজাইন সফটওয়্যার ছাড়াই দ্রুত ব্র্যান্ডেড সোশ্যাল অ্যাসেট বানানোর প্রয়োজন ছিল।",
    },
    solution: {
      en: "Bilingual online design suite for photo cards, news frames, barcodes and YouTube thumbnails — built for newsroom staff and local creators.",
      bn: "নিউজরুম কর্মী ও স্থানীয় ক্রিয়েটরদের জন্য ফটো কার্ড, নিউজ ফ্রেম, বারকোড ও থাম্বনেইলের দ্বিভাষিক অনলাইন ডিজাইন স্যুট।",
    },
    tech: ["TypeScript", "Node.js"],
    media: "video",
    slides: [],
  },
  {
    slug: "likhon-tools",
    title: { en: "Likhon Tools", bn: "লিখন টুলস" },
    problem: {
      en: "Users struggle with text conversion and formatting for bilingual Bangla and English content.",
      bn: "বাংলা ও ইংরেজি টেক্সট কনভার্সন ও ফরম্যাটিং অনেক ব্যবহারকারীর দৈনন্দিন ঝামেলা।",
    },
    solution: {
      en: "Bilingual web tools app with advanced text converters and Bangla text utilities. Live and in production.",
      bn: "অ্যাডভান্সড টেক্সট কনভার্টার ও বাংলা টেক্সট ইউটিলিটির দ্বিভাষিক ওয়েব টুলস। লাইভ ও প্রোডাকশনে।",
    },
    tech: ["TypeScript", "JavaScript", "Node.js"],
    media: "slides",
    demo_url: "https://likhontools.com/",
    slides: [],
  },
  {
    slug: "attendance-leave-management",
    title: { en: "Attendance & Leave Management", bn: "হাজিরা ও ছুটি ব্যবস্থাপনা" },
    problem: {
      en: "Manual attendance and leave handling caused bottlenecks and inaccurate records.",
      bn: "ম্যানুয়াল হাজিরা ও ছুটি ব্যবস্থাপনায় গতির বাধা ও ভুল রেকর্ড হতো।",
    },
    solution: {
      en: "HR module that automates leave workflows and integrates ZKTeco biometric devices — no more manual attendance records.",
      bn: "HR মডিউল — ছুটির ওয়ার্কফ্লো অটোমেটেড, ZKTeco বায়োমেট্রিক ডিভাইস ইন্টিগ্রেশন।",
    },
    tech: ["PHP", "Laravel", "Blade", "ZKTeco"],
    media: "slides",
    slides: [],
  },
  {
    slug: "modern-e-paper",
    title: { en: "Modern E-Paper Concept", bn: "মডার্ন ই-পেপার কনসেপ্ট" },
    problem: {
      en: "Digital newspaper platforms often lack a responsive, modern reading experience.",
      bn: "ডিজিটাল সংবাদপত্র প্ল্যাটফর্মে রেসপন্সিভ, মডার্ন পড়ার অভিজ্ঞতার অভাব থাকে।",
    },
    solution: {
      en: "A fast, clean e-paper reading concept that also streamlines newsroom publishing.",
      bn: "দ্রুত, পরিচ্ছন্ন ই-পেপার পড়ার কনসেপ্ট — নিউজরুম প্রকাশনাও সহজ।",
    },
    tech: ["HTML", "CSS", "JavaScript"],
    media: "video",
    slides: [],
  },
  {
    slug: "digitalshebabd",
    title: { en: "DigitalShebaBD", bn: "ডিজিটালশেবাবিডি" },
    problem: {
      en: "People lacked one clean place to reach local digital services and utilities.",
      bn: "স্থানীয় ডিজিটাল সেবা ও ইউটিলিটিতে পৌঁছানোর একটি পরিচ্ছন্ন ঠিকানার অভাব ছিল।",
    },
    solution: {
      en: "Service-oriented portal for quick access to essential local digital services and utilities.",
      bn: "স্থানীয় ডিজিটাল সেবা ও ইউটিলিটিতে দ্রুত পৌঁছানোর সার্ভিস-ওরিয়েন্টেড পোর্টাল।",
    },
    tech: ["TypeScript", "Web"],
    media: "slides",
    slides: [],
  },
];

/** Back-compat name used by CMS fallback + admin seed display. */
export const projects: Project[] = seedProjects;
