/**
 * Runs `pnpm install --no-frozen-lockfile` and feeds "y" on stdin so prompts like
 * "The modules directory ... will be removed and reinstalled. Proceed? (Y/n)" auto-confirm.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const pnpmArgs = ["install", "--no-frozen-lockfile", ...args];

const child = spawn("pnpm", pnpmArgs, {
  cwd: root,
  stdio: ["pipe", "inherit", "inherit"],
  shell: process.platform === "win32",
});

const timer = setInterval(() => {
  try {
    child.stdin.write("y\n");
  } catch {
    /* stdin closed */
  }
}, 120);

child.on("close", (code) => {
  clearInterval(timer);
  try {
    child.stdin.end();
  } catch {
    /* ignore */
  }
  process.exit(code ?? 0);
});
