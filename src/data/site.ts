// Identity and contact data. Locale-independent values; never invent data.

export const site = {
  name: "Md Emran Hossain",
  nameBn: "মোঃ ইমরান হোসেন",
  email: "engremran.it@gmail.com",
  phone: "+8801924437817",
  location: { en: "Dhaka, Bangladesh", bn: "ঢাকা, বাংলাদেশ" },
  socials: {
    github: "https://github.com/Emran-Hossain26",
    linkedin: "https://bd.linkedin.com/in/mohammad-emran-hossain-69198b75",
    facebook: "https://www.facebook.com/emran1997/",
  },
  liveProject: "https://likhontools.com/",
};

/**
 * Blog lives off-site (Hashnode) — the site itself carries no posts, so
 * visitors never load blog content here. The top-bar "Blog" link and the
 * /blog route forward to this URL. Replace with your own Hashnode profile
 * or publication URL, e.g. "https://yourblog.hashnode.dev".
 */
export const blogExternalUrl = "https://hashnode.com/";

/**
 * Single source of truth for canonical/OG URLs.
 * Domain not purchased yet: keep the *.vercel.app URL and swap this one
 * variable (env var) when the real domain is added.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://emran-portfolio.vercel.app";
