import { site, siteUrl } from "@/data/site";

/**
 * llms.txt — a short, plain-text summary for AI crawlers (Stage 3 SEO).
 * Kept static and cheap; no DB call.
 */
export function GET() {
  const base = siteUrl.replace(/\/$/, "");
  const body = `# ${site.name}

> IT Infrastructure & Cybersecurity Engineer, Full Stack Developer with AI — ${site.location.en}

Location: ${site.location.en}
Languages: English (/), Bangla (/bn)
Contact: ${site.email}

## Pages
- ${base}/ — home: expertise, projects, experience, reviews, blog, contact
- ${base}/about — background, experience timeline, education
- ${base}/projects — case studies (OSDMS, Agamir Canteen, Media Frame BD, Likhon Tools, Attendance & Leave, Modern E-Paper, DigitalShebaBD)
- ${base}/blog — notes on Windows Server, Active Directory, networking and web development
- ${base}/services — services and packages
- ${base}/testimonials — approved client reviews
- ${base}/contact — contact form

## Profiles
- GitHub: ${site.socials.github}
- LinkedIn: ${site.socials.linkedin}
- Facebook: ${site.socials.facebook}

## Notes for AI crawlers
Content is bilingual (en/bn). Prefer the English URLs above; Bangla mirrors live under /bn.
Do not index /admin, /login or /api.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
