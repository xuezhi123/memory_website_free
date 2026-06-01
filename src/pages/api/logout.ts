import type { APIRoute } from "astro";
import { clearSessionCookie } from "../../lib/auth";

/**
 * Clear the session cookie and redirect to the home page.
 */
export const POST: APIRoute = async () => {
  const headers = new Headers();
  headers.set("Set-Cookie", clearSessionCookie());
  headers.set("Location", "/");
  return new Response(null, { status: 302, headers });
};
