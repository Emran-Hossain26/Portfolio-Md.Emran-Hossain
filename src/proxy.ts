import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 proxy convention (formerly middleware.ts).
// Routes every request through the locale negotiator, excluding
// static files, APIs and Next internals.
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
