import type { APIRoute } from "astro";
import { createSessionCookie, requireEnv, verifyPassword } from "../../lib/auth";

/**
 * Sanitize the "next" redirect URL to prevent open-redirect attacks.
 * Only allow local paths starting with a single slash.
 */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/memory";
  if (!next.startsWith("/") || next.startsWith("//")) return "/memory";
  return next;
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  try {
    // Verify that the Cloudflare runtime environment is available
    if (!locals.runtime) {
      return new Response("Error: locals.runtime is missing", { status: 500 });
    }
    if (!locals.runtime.env) {
      return new Response("Error: locals.runtime.env is missing", { status: 500 });
    }

    const env = requireEnv(locals.runtime.env);
    const form = await request.formData();
    const password = form.get("password");
    const next = safeNext(form.get("next"));

    if (typeof password !== "string" || !(await verifyPassword(password, env.ACCESS_PASSWORD_HASH))) {
      return redirect(`/login?error=1&next=${encodeURIComponent(next)}`, 302);
    }

    const headers = new Headers();
    headers.set("Set-Cookie", await createSessionCookie(env));
    headers.set("Location", next);
    return new Response(null, { status: 302, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Login error: ${message}`, { status: 500 });
  }
};
