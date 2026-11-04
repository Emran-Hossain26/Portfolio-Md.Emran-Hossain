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
    title: { en: "Cybersecurity & Cloud", bn: "সাইবার সিকিউরিটি ও ক্লাউড" },
    desc: {
      en: "Hardening, access control, network defence and secure cloud setups.",
      bn: "হার্ডেনিং, অ্যাক্সেস কন্ট্রোল, নেটওয়ার্ক নিরাপত্তা ও নিরাপদ ক্লাউড সেটআপ।",
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
    title: { en: "Full Stack with AI", bn: "এআই-সহ ফুল স্ট্যাক" },
    desc: {
      en: "PHP, TypeScript and modern web apps built faster with AI tooling.",
      bn: "PHP, TypeScript এবং এআই টুলিংয়ে দ্রুত তৈরি আধুনিক ওয়েব অ্যাপ।",
    },
  },
];

/** Hero "service status" panel rows — labels kept as in the approved mockup. */
export const statusItems: string[] = [
  "Windows Server / AD",
  "Linux & Networking",
  "Cloud Security",
  "Full Stack + AI",
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
