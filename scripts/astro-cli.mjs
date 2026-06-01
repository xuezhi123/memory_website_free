#!/usr/bin/env node
// Thin wrapper that runs the Astro CLI via npx so it picks up the local install.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const astro = join(__dirname, "..", "node_modules", ".bin", "astro");

const result = spawnSync(astro, process.argv.slice(2), {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 0);
