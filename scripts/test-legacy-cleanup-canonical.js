#!/usr/bin/env node

/**
 * Regression: init/store install + legacy cleanup must not remove canonical bundled skills.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { LEGACY_SKILL_RENAMES, listLegacyKenmarkSkillPaths } = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const cliPath = path.join(__dirname, "cli.js");

const CANONICAL_GUARD_SKILLS = [
  "kenmark-troubleshoot",
  "kenmark-repo-hygiene",
  "kenmark-tracker-setup",
  "kenmark-tracker-list",
  "kenmark-tracker-check",
  "kenmark-issues-scan",
  "kenmark-issues-fix-and-ship"
];

function rmDirSafe(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runCli(args, home) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    stdio: "pipe",
    encoding: "utf8",
    env: { ...process.env, HOME: home }
  });
}

function assertCanonicalSkillsPresent(storeSkills, label) {
  for (const skill of CANONICAL_GUARD_SKILLS) {
    assert(
      fs.existsSync(path.join(storeSkills, skill)),
      `${label}: missing canonical bundled skill ${skill}`
    );
  }
}

function main() {
  const tempHome = path.join(
    os.tmpdir(),
    `kenmark-legacy-cleanup-${process.pid}-${Date.now()}`
  );

  console.log(`kenmark-skills legacy cleanup regression test\n  HOME=${tempHome}\n`);

  let exitCode = 0;
  try {
    fs.mkdirSync(tempHome, { recursive: true });

    const setup = runCli(["setup", "--ide", "claude", "-y"], tempHome);
    assert(setup.status === 0, `setup exited with ${setup.status}\n${setup.stderr}`);

    const storeSkills = path.join(tempHome, ".kenmark", "store", "skills");
    assert(fs.existsSync(storeSkills), `missing store: ${storeSkills}`);
    assertCanonicalSkillsPresent(storeSkills, "after setup");

    const legacyPaths = listLegacyKenmarkSkillPaths();
    for (const canonical of Object.values(LEGACY_SKILL_RENAMES)) {
      assert(
        !legacyPaths.includes(canonical),
        `listLegacyKenmarkSkillPaths must not include canonical skill ${canonical}`
      );
    }

    const cleanup = runCli(
      ["cleanup", "--legacy-only", "--include-store", "-y"],
      tempHome
    );
    assert(
      cleanup.status === 0,
      `cleanup --legacy-only exited with ${cleanup.status}\n${cleanup.stderr}`
    );
    assertCanonicalSkillsPresent(storeSkills, "after legacy cleanup");

    const setupAgain = runCli(["setup", "--ide", "claude", "-y"], tempHome);
    assert(
      setupAgain.status === 0,
      `second setup exited with ${setupAgain.status}\n${setupAgain.stderr}`
    );
    assertCanonicalSkillsPresent(storeSkills, "after second setup");

    console.log("\nOK — legacy cleanup regression test passed.");
  } catch (err) {
    console.error(`\nLegacy cleanup regression test failed: ${err.message}`);
    exitCode = 1;
  } finally {
    rmDirSafe(tempHome);
  }

  process.exit(exitCode);
}

main();
