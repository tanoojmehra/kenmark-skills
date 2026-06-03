#!/usr/bin/env node

/**
 * Smoke tests for verify-before-install in kenmark-packs.js.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const repoRoot = path.resolve(__dirname, "..");
const packsScript = path.join(__dirname, "kenmark-packs.js");

function rmDirSafe(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function runPacks(args, env) {
  return spawnSync(process.execPath, [packsScript, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", ...env },
    stdio: "pipe"
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  console.log("kenmark-packs verify-before-install tests\n");
  const failures = [];

  const dryRun = runPacks(
    ["--ids", "impeccable", "--global", "--dry-run", "-y", "--skip-adopt"],
    {}
  );
  const dryStdout = (dryRun.stdout || "") + (dryRun.stderr || "");
  if (dryRun.status !== 0) {
    failures.push(`dry-run impeccable exited ${dryRun.status}`);
  } else if (!/npx --yes skills add pbakaus\/impeccable|skills add pbakaus\/impeccable/.test(dryStdout)) {
    failures.push("dry-run impeccable did not show install command in plan");
  } else {
    console.log("  ✓ dry-run shows impeccable install plan");
  }

  const tempHome = path.join(
    os.tmpdir(),
    `kenmark-packs-verify-${process.pid}-${Date.now()}`
  );
  try {
    fs.mkdirSync(path.join(tempHome, ".agents", "skills", "impeccable"), {
      recursive: true
    });
    fs.writeFileSync(
      path.join(tempHome, ".agents", "skills", "impeccable", "SKILL.md"),
      "# impeccable\n"
    );

    const skipRun = runPacks(
      ["--ids", "impeccable", "--global", "-y", "--skip-adopt"],
      { HOME: tempHome }
    );
    const skipStdout = (skipRun.stdout || "") + (skipRun.stderr || "");
    if (skipRun.status !== 0) {
      failures.push(`verify-OK skip run exited ${skipRun.status}`);
    } else if (!/Verify: already installed/.test(skipStdout)) {
      failures.push("verify-OK run did not report already installed");
    } else if (!/Skipping install/.test(skipStdout)) {
      failures.push("verify-OK run did not skip install");
    } else if (/skills add pbakaus\/impeccable/.test(skipStdout)) {
      failures.push("verify-OK run still invoked skills add installer");
    } else {
      console.log("  ✓ verify-OK pack skips install");
    }

    const forceRun = runPacks(
      ["--ids", "impeccable", "--global", "-y", "--skip-adopt", "--force", "--dry-run"],
      { HOME: tempHome }
    );
    const forceStdout = (forceRun.stdout || "") + (forceRun.stderr || "");
    if (forceRun.status !== 0) {
      failures.push(`--force dry-run exited ${forceRun.status}`);
    } else if (!/skills add pbakaus\/impeccable/.test(forceStdout)) {
      failures.push("--force dry-run did not show install command");
    } else if (/Skipping install/.test(forceStdout)) {
      failures.push("--force dry-run incorrectly skipped install");
    } else {
      console.log("  ✓ --force shows install even when verify would pass");
    }
  } finally {
    rmDirSafe(tempHome);
  }

  if (failures.length) {
    console.error(`\n${failures.length} verify-before-install test(s) failed:`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }

  console.log("\nOK — verify-before-install tests passed.");
}

main();
