import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 proxy convention (formerly middleware.ts).
// Routes public requests through the locale negotiator; /admin (outside
// the [locale] tree), APIs, static files and Next internals are excluded.
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
