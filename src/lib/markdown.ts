import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** Render untrusted Markdown to sanitized HTML (allowlists links/formatting). */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "b", "strong", "i", "em", "ul", "ol", "li", "h2", "h3",
      "h4", "blockquote", "a", "code", "pre", "hr",
    ],
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
