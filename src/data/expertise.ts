import type { Locale, Localized } from "./types";

export const expertiseItems: { title: Localized; desc: Localized }[] = [
  {
    title: { en: "IT Infrastructure", bn: "আইটি ইনফ্রাস্ট্রাকচার" },
    desc: {
      en: "Windows Server, Active Directory, Linux administration, backup and monitoring.",
      bn: "Windows Server, Active Directory, লিনাক্স অ্যাডমিনিস্ট্রেশন, ব্যাকআপ ও মনিটরিং।",
    },
  },
  {
    title: { en: "IT Security & Endpoint Management", bn: "আইটি সিকিউরিটি ও এন্ডপয়েন্ট ম্যানেজমেন্ট" },
    desc: {
      en: "SentinelOne endpoint protection, access control, user-wise asset assignment and secure configurations.",
      bn: "SentinelOne এন্ডপয়েন্ট সুরক্ষা, অ্যাক্সেস কন্ট্রোল, ইউজার-ভিত্তিক অ্যাসেট অ্যাসাইনমেন্ট ও নিরাপদ কনফিগারেশন।",
    },
  },
  {
    title: { en: "Networking", bn: "নেটওয়ার্কিং" },
    desc: {
      en: "LAN design, firewalls, VPN, multi-floor office networks.",
      bn: "ল্যান ডিজাইন, ফায়ারওয়াল, VPN, মাল্টি-ফ্লোর অফিস নেটওয়ার্ক।",
    },
  },
  {
    title: { en: "AI-Assisted Software Development", bn: "AI-সহায়তায় সফটওয়্যার উন্নয়ন" },
    desc: {
      en: "Independently led, prompt-directed development of business software — PHP, TypeScript and modern web apps built faster with AI tooling.",
      bn: "স্বাধীনভাবে পরিচালিত, প্রম্পট-নির্দেশিত বিজনেস সফটওয়্যার উন্নয়ন — PHP, TypeScript এবং এআই টুলিংয়ে দ্রুত তৈরি আধুনিক ওয়েব অ্যাপ।",
    },
  },
];

/** Hero "service status" panel rows — labels kept as in the approved mockup. */
export const statusItems: string[] = [
  "Windows Server / AD",
  "Linux & Networking",
  "IT Security & Endpoint Protection",
  "AI-Assisted Software Solutions",
];

export function pickLocale(locale: Locale) {
  return <T extends { title: Localized; desc: Localized; tags?: string[]; href?: string }>(
    items: T[]
  ) =>
    items.map((item) => ({
      ...item,
      title: item.title[locale],
      desc: item.desc[locale],
    }));
}
