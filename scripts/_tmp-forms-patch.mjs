import { readFileSync, writeFileSync } from "node:fs";
const nlOf = (s) => (s.includes("\r\n") ? "\r\n" : "\n");

function patch(f, pairs) {
  let s = readFileSync(f, "utf8");
  const nl = nlOf(s);
  let hit = 0;
  for (const [find, repl] of pairs) {
    const a = find.split("\n").join(nl);
    if (s.includes(a)) {
      s = s.split(a).join(repl.split("\n").join(nl));
      hit++;
    }
  }
  writeFileSync(f, s);
  return hit;
}

console.log("contact:", patch("src/components/home/ContactForm.tsx", [
  [`import { submitContactAction, type PublicActionResult } from "@/lib/actions/public";`,
   `import { submitContactAction, type PublicActionResult } from "@/lib/actions/public";
import { TurnstileWidget } from "@/components/TurnstileWidget";`],
  [`      {/* Honeypot — invisible, removed from tab order, only bots fill it. */}`,
   `      {/* Turnstile (item 4) — renders only when the site key is set */}
      <TurnstileWidget />
      {/* Honeypot — invisible, removed from tab order, only bots fill it. */}`],
]));

console.log("quote:", patch("src/components/QuoteForm.tsx", [
  [`import { submitQuoteAction, type PublicActionResult } from "@/lib/actions/public";`,
   `import { submitQuoteAction, type PublicActionResult } from "@/lib/actions/public";
import { TurnstileWidget } from "@/components/TurnstileWidget";`],
  [`      {/* Honeypot */}`,
   `      <TurnstileWidget />
      {/* Honeypot */}`],
]));

console.log("testimonial:", patch("src/components/TestimonialSubmitForm.tsx", [
  [`import { submitTestimonialAction, type PublicActionResult } from "@/lib/actions/public";`,
   `import { submitTestimonialAction, type PublicActionResult } from "@/lib/actions/public";
import { TurnstileWidget } from "@/components/TurnstileWidget";`],
  [`        {/* Honeypot — hidden from humans, catnip for bots */}`,
   `        <TurnstileWidget />
        {/* Honeypot — hidden from humans, catnip for bots */}`],
]));

// messages: error_turnstile
for (const lang of ["en", "bn"]) {
  const p = `messages/${lang}.json`;
  const d = JSON.parse(readFileSync(p, "utf8"));
  const msg = lang === "en"
    ? "Verification failed — please complete the anti-bot check and try again."
    : "যাচাই ব্যর্থ — অ্যান্টি-বট চেক সম্পন্ন করে আবার চেষ্টা করুন।";
  d.contactForm.error_turnstile = msg;
  d.quote.error_turnstile = msg;
  d.pages.testimonials.form.error_turnstile = msg;
  writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
}
console.log("messages ok");
