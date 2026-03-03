#!/usr/bin/env node
/**
 * Starts the static dev server (serve) using SERVE_PORT from .env.
 * Load .env via: node -r dotenv/config scripts/serve-dev.mjs
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const port = parseInt(process.env.SERVE_PORT, 10) || 3000;

const child = spawn("npx", ["serve", ".", "-l", String(port), "--no-port-switching"], {
  stdio: "inherit",
  shell: true,
  cwd: rootDir,
});

child.on("exit", (code) => process.exit(code ?? 0));
