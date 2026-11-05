// Seeds the owner's real experience and education rows (CONTENT.md) into
// the live Supabase. Guarded: only inserts if the table is empty.
// Usage: node scripts/seed-experience-education.mjs
import { readFileSync } from "node:fs";

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split(/\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing Supabase env"); process.exit(1); }
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

// Old schema has a single details column: EN first, BN after a blank line.
const dual = (r) => ({ sort: r.sort, role_en: r.role_en, role_bn: r.role_bn, org_en: r.org_en, org_bn: r.org_bn, period: r.period_en, details: r.details_en + String.fromCharCode(10,10) + r.details_bn });

const experience = [
  { sort: 1, role_en: "IT Engineer (System)", role_bn: "আইটি ইঞ্জিনিয়ার (সিস্টেম)", org_en: "The Daily Kalbela", org_bn: "দ্য ডেইলি কালবেলা", period_en: "Sep 2022 – Present", period_bn: "সেপ্টেম্বর ২০২২ – বর্তমান", details_en: "Design, install and maintain networks, Active Directory servers and computing infrastructure. Routers, switches, LAN/WAN, DNS and DHCP. End-user support and user accounts. Keep systems and infrastructure highly available. Run QuarkXPress 2020 through e-paper submission.", details_bn: "নেটওয়ার্ক, Active Directory সার্ভার ও কম্পিউটিং ইনফ্রাস্ট্রাকচার ডিজাইন, ইনস্টল ও রক্ষণাবেক্ষণ। রাউটার, সুইচ, LAN/WAN, DNS ও DHCP। ইউজার সাপোর্ট ও অ্যাকাউন্ট ব্যবস্থা। সিস্টেম হাই-অ্যাভেইলেবল রাখা। QuarkXPress 2020 দিয়ে ই-পেপার প্রকাশনা।" },
  { sort: 2, role_en: "Analyst, Data Processing", role_bn: "বিশ্লেষক (ডেটা প্রসেসিং)", org_en: "Quantanite", org_bn: "কোয়ান্টানাইট", period_en: "Oct 2020 – Sep 2022", period_bn: "অক্টোবর ২০২০ – সেপ্টেম্বর ২০২২", details_en: "Collected and analysed data from primary and secondary sources using statistical techniques. Maintained databases and reported results to business teams. Worked with engineering teams on long-term data platform strategy.", details_bn: "প্রাথমিক ও মাধ্যমিক সূত্র থেকে পরিসংখ্যান কৌশলে ডেটা সংগ্রহ ও বিশ্লেষণ। ডেটাবেজ রক্ষণাবেক্ষণ ও বিজনেস টিমকে রিপোর্টিং। ইঞ্জিনিয়ারিং টিমের সাথে দীর্ঘমেয়াদি ডেটা প্ল্যাটফর্ম কৌশল।" },
  { sort: 3, role_en: "Assistant Engineer (Electrical)", role_bn: "সহকারী প্রকৌশলী (ইলেকট্রিক্যাল)", org_en: "Arina Electrical Company", org_bn: "আরিনা ইলেকট্রিক্যাল কোম্পানি", period_en: "Mar 2018 – Feb 2020", period_bn: "মার্চ ২০১৮ – ফেব্রুয়ারি ২০২০", details_en: "Installed, tested and maintained distribution transformers, HT/LT switchgear and PFI. Power studies, voltage drop and protective relay calculations. Substation quotations, lighting and substation service designs. On-grid and off-grid solar projects with inverters.", details_bn: "ডিস্ট্রিবিউশন ট্রান্সফরমার, HT/LT সুইচগিয়ার ও PFI ইনস্টল, টেস্ট ও রক্ষণাবেক্ষণ। পাওয়ার স্টাডি, ভোল্টেজ ড্রপ ও প্রোটেক্টিভ রিলে ক্যালকুলেশন। সাবস্টেশন কোটেশন, লাইটিং ও সাবস্টেশন সার্ভিস ডিজাইন। অন-গ্রিড/অফ-গ্রিড সোলার প্রজেক্ট।" },
  { sort: 4, role_en: "IT Executive Officer", role_bn: "আইটি এক্সিকিউটিভ অফিসার", org_en: "Gentle Park", org_bn: "জেন্টল পার্ক", period_en: "Sep 2014 – Mar 2018", period_bn: "সেপ্টেম্বর ২০১৪ – মার্চ ২০১৮", details_en: "Internal IT and mail server support. Managed stock levels through POS and reconciled head office and branch stock. Produced daily sales reports.", details_bn: "ইন্টার্নাল আইটি ও মেইল সার্ভার সাপোর্ট। POS-এর মাধ্যমে স্টক ব্যবস্থাপনা — হেড অফিস ও ব্রাঞ্জ রিকনসিলিয়েশন। দৈনিক বিক্রয় রিপোর্ট।" },
  { sort: 5, role_en: "Trainee Assistant Engineer", role_bn: "ট্রেইনি সহকারী প্রকৌশলী", org_en: "Biswas Builders Limited", org_bn: "বিশ্বাস বিল্ডার্স লিমিটেড", period_en: "Oct 2013 – Sep 2014", period_bn: "অক্টোবর ২০১৩ – সেপ্টেম্বর ২০১৪", details_en: "Tested and maintained electrical machines and equipment; checked electrical layouts on site.", details_bn: "ইলেকট্রিক্যাল মেশিন ও সরঞ্জাম টেস্ট ও রক্ষণাবেক্ষণ; সাইটে ইলেকট্রিক্যাল লেআউট যাচাই।" },
];

const education = [
  { sort: 1, degree_en: "B.Sc in Electrical & Electronic Engineering", degree_bn: "বি.স্ক (ইলেকট্রিক্যাল অ্যান্ড ইলেকট্রনিক ইঞ্জিনিয়ারিং)", org_en: "Atish Dipankar University of Science & Technology", org_bn: "আতিশ দীপঙ্কর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়", period: "2014" },
];

async function count(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*`, { headers: { ...H, Prefer: "count=exact" } });
  const range = r.headers.get("content-range") ?? "*/0";
  return parseInt(range.split("/")[1] ?? "0", 10);
}

for (const [table, rows] of [["experience", experience.map(dual)], ["education", education]]) {
  const n = await count(table);
  if (n > 0) { console.log(`${table}: ${n} rows already present — skipped`); continue; }
  const r = await fetch(`${url}/rest/v1/${table}`, { method: "POST", headers: H, body: JSON.stringify(rows) });
  console.log(`${table}: insert ${r.status} ${r.ok ? "OK" : await r.text()}`);
}
