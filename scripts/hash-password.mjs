#!/usr/bin/env node
// Generate a SHA-256 password hash for wrangler secret.
import { createHash } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node hash-password.mjs <password>");
  process.exit(1);
}

const hash = createHash("sha256").update(password).digest("base64");
console.log(`sha256:${hash}`);
