import { defineMiddleware } from "astro:middleware";
import { isAuthenticated } from "./lib/auth";

const privatePrefixes = ["/memory", "/timeline", "/photos", "/articles"];

// Host whitelist: replace with your production domain after deployment.
// Preview URLs (e.g., <hash>-your-project.workers.dev) will be blocked.
const ALLOWED_HOSTS: string[] = [
  // "your-domain.workers.dev",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Optional: block preview URLs in production.
  // Uncomment the following block after setting ALLOWED_HOSTS.
  //
  // if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(url.hostname)) {
  //   return new Response("Not Found", { status: 404 });
  // }

  const env = context.locals.runtime?.env;
  const authed = await isAuthenticated(context.request, env);
  context.locals.isAuthenticated = authed;

  if (privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) && !authed) {
    return context.redirect(`/login?next=${encodeURIComponent(pathname)}`, 302);
  }

  const response = await next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  // CSP: only allow same-origin resources to prevent XSS.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
    ].join("; ")
  );
  if (privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
});
