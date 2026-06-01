const SESSION_COOKIE = "memory_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type RuntimeEnv = {
  ACCESS_PASSWORD_HASH: string;
  SESSION_SECRET: string;
};

/** Encode a string into UTF-8 bytes. */
function getTextBytes(value: string) {
  return new TextEncoder().encode(value);
}

/**
 * Convert an ArrayBuffer into a Base64URL string.
 * Avoids spread-into-String.fromCharCode which can overflow for large buffers.
 */
function toBase64Url(bytes: ArrayBuffer) {
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/** Compute SHA-256 digest of a string. */
async function sha256(value: string) {
  return toBase64Url(await crypto.subtle.digest("SHA-256", getTextBytes(value)));
}

/** Compute HMAC-SHA-256 signature. */
async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    getTextBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, getTextBytes(value)));
}

/** Constant-time string comparison to prevent timing attacks. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Read a Node.js environment variable (local dev fallback). */
function getNodeEnv(key: string): string | undefined {
  // @ts-ignore - process is only available in Node.js local dev, not Cloudflare Workers
  return typeof process !== "undefined" ? process.env[key] : undefined;
}

/** Resolve env from Cloudflare runtime or process.env (local dev fallback).
 * Falls back to a default password (123456) so the project works out of the box.
 * Override in Cloudflare Workers dashboard or .dev.vars for production.
 */
function resolveEnv(env?: Partial<RuntimeEnv>): RuntimeEnv {
  const hash = env?.ACCESS_PASSWORD_HASH || getNodeEnv("ACCESS_PASSWORD_HASH");
  const secret = env?.SESSION_SECRET || getNodeEnv("SESSION_SECRET");
  if (hash && secret) {
    return { ACCESS_PASSWORD_HASH: hash, SESSION_SECRET: secret };
  }
  // Default fallback: password = "123456", secret = fixed dev value.
  return {
    ACCESS_PASSWORD_HASH: "sha256:jZae727K08KaOmKSgOaGzww_XVqGr_PKEgIMkjrcbJI",
    SESSION_SECRET: "memory-website-default-secret",
  };
}

/** Hash a plain-text password with SHA-256. */
export async function hashPassword(password: string) {
  return `sha256:${await sha256(password)}`;
}

/** Verify a password against a stored SHA-256 hash. */
export async function verifyPassword(password: string, expectedHash: string) {
  if (!expectedHash?.startsWith("sha256:")) return false;
  const actual = await hashPassword(password);
  return safeEqual(actual, expectedHash);
}

/** Create an HTTP-only session cookie signed with HMAC. */
export async function createSessionCookie(env: RuntimeEnv) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `v1.${expiresAt}`;
  const signature = await hmac(env.SESSION_SECRET, payload);
  const value = `${payload}.${signature}`;
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

/** Create a cookie header that clears the session. */
export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

/** Check whether the request carries a valid session cookie. */
export async function isAuthenticated(request: Request, env?: RuntimeEnv) {
  const resolved = resolveEnv(env);
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  if (!cookie) return false;
  const value = cookie.slice(SESSION_COOKIE.length + 1);
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = await hmac(resolved.SESSION_SECRET, payload);
  return safeEqual(parts[2], expected);
}

/** Get the runtime env (custom or default fallback). */
export function requireEnv(env?: RuntimeEnv) {
  return resolveEnv(env);
}
