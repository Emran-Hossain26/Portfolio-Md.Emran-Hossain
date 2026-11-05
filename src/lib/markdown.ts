import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** Hosts whose https images are allowed in rendered Markdown. */
function allowedImageHosts(): string[] {
  const hosts = new Set<string>();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try { hosts.add(new URL(siteUrl).hostname); } catch {}
  }
  const supa = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supa) {
    try { hosts.add(new URL(supa).hostname); } catch {}
  }
  return [...hosts];
}

function isAllowedImageSrc(src: string): boolean {
  try {
    const u = new URL(src, "https://example.com");
    if (u.protocol !== "https:") return false;
    return allowedImageHosts().includes(u.hostname);
  } catch {
    return false;
  }
}

/** Slugify a heading text into an anchor id (matches extractToc in cms.ts). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*_`]/g, "")
    .trim()
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Configure marked once: GFM (tables, strikethrough, task lists) + heading ids.
marked.setOptions({ gfm: true, breaks: false });
const renderer = new marked.Renderer();
renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
  const id = slugify(text);
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};
marked.use({ renderer });

/** Render untrusted Markdown to sanitized HTML (allowlists links/formatting). */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "b", "strong", "i", "em", "ul", "ol", "li", "h2", "h3",
      "h4", "blockquote", "a", "code", "pre", "hr", "table", "thead", "tbody",
      "tr", "th", "td", "img", "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
      pre: ["class"],
      td: ["align"],
      th: ["align"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const out: sanitizeHtml.Attributes = { ...attribs, rel: "noopener noreferrer" };
        if (/^https?:\/\//.test(href)) out.target = "_blank";
        if (/^\s*(javascript|data|vbscript):/i.test(href)) delete out.href;
        return { tagName, attribs: out };
      },
      img: (tagName, attribs) => {
        if (!attribs.src || !isAllowedImageSrc(attribs.src)) {
          return { tagName: "span", attribs: {} };
        }
        const out: sanitizeHtml.Attributes = { ...attribs };
        if (!out.alt) out.alt = "";
        return { tagName, attribs: out };
      },
    },
  });
}

export { slugify as extractHeadingId };