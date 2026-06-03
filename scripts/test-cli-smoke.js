#!/usr/bin/env node

/**
 * Smoke-test kenmark-skills CLI commands (dry-run / soft modes only).
 */

const { spawnSync } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const cliPath = path.join(__dirname, "cli.js");

const COMMANDS = [
  ["help"],
  ["validate"],
  ["setup", "--dry-run", "--global", "--ide", "claude", "-y"],
  ["init", "--dry-run", "--global", "--ide", "claude", "--skip-recommended", "-y"],
  ["install-recommended", "--list"],
  [
    "install-recommended",
    "--preset",
    "core-next",
    "--dry-run",
    "--global",
    "--ide",
    "claude",
    "-y"
  ],
  [
    "install-recommended",
    "--profile",
    "lean",
    "--dry-run",
    "--global",
    "--ide",
    "claude",
    "-y"
  ],
  ["update", "--both", "--dry-run", "--global", "--ide", "claude", "-y"],
  ["doctor", "--soft", "--no-fail"]
];

function runCli(args) {
  const label = `node scripts/cli.js ${args.join(" ")}`;
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" }
  });
  return { label, result };
}

function main() {
  console.log("kenmark-skills CLI smoke tests\n");
  const failures = [];

  for (const args of COMMANDS) {
    const { label, result } = runCli(args);
    const code = result.status === null ? 1 : result.status;
    if (code !== 0) {
      failures.push({
        label,
        code,
        stderr: (result.stderr || "").trim(),
        stdout: (result.stdout || "").trim()
      });
      console.error(`  ✗ ${label} (exit ${code})`);
      if (result.stderr) console.error(result.stderr.slice(0, 2000));
      if (result.stdout) console.error(result.stdout.slice(0, 2000));
    } else {
      console.log(`  ✓ ${label}`);
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} CLI smoke test(s) failed.`);
    process.exit(1);
  }

  console.log("\nOK — all CLI smoke tests passed.");
}

main();
