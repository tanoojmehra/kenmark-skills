#!/usr/bin/env node

/**
 * Integration test: kenmark-skills cleanup modes in a temp HOME.
 */

const os = require("os");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const cliPath = path.join(__dirname, "cli.js");

function pathEntryExists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function rmDirSafe(dir) {
  if (!dir || !pathEntryExists(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function runCleanup(args, home) {
  return spawnSync(process.execPath, [cliPath, "cleanup", ...args], {
    cwd: repoRoot,
    env: { ...process.env, HOME: home },
    encoding: "utf8"
  });
}

function writeSkillDir(dir, name) {
  const skillDir = path.join(dir, name);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    `---\nname: ${name}\n---\n# ${name}\n`,
    "utf8"
  );
  return skillDir;
}

function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kenmark-cleanup-"));
  const home = path.join(tmp, "home");
  fs.mkdirSync(home, { recursive: true });

  let exitCode = 0;
  try {
    const missingTarget = path.join(home, ".kenmark", "store", "skills", "stale-skill");
    const geminiSkills = path.join(home, ".gemini", "skills");
    fs.mkdirSync(geminiSkills, { recursive: true });
    fs.symlinkSync(missingTarget, path.join(geminiSkills, "stale-skill"), "dir");

    const dryRun = runCleanup(["--ide", "gemini", "--dry-run", "-y"], home);
    if (dryRun.status !== 0) {
      throw new Error(`cleanup --dry-run exited with ${dryRun.status}`);
    }
    if (!/Would remove 1 broken symlink/.test(dryRun.stdout || "")) {
      throw new Error("Expected dry-run to report 1 broken symlink");
    }
    if (!pathEntryExists(path.join(geminiSkills, "stale-skill"))) {
      throw new Error("Dry-run should not remove the broken symlink");
    }

    const cleanup = runCleanup(["--ide", "gemini", "-y"], home);
    if (cleanup.status !== 0) {
      console.error(cleanup.stdout);
      console.error(cleanup.stderr);
      throw new Error(`cleanup exited with ${cleanup.status}`);
    }
    if (pathEntryExists(path.join(geminiSkills, "stale-skill"))) {
      throw new Error("Expected broken symlink to be removed by cleanup");
    }
    if (!/Removed 1 broken symlink/.test(cleanup.stdout || "")) {
      throw new Error("Expected cleanup summary to report 1 removed broken symlink");
    }

    const cursorSkills = path.join(home, ".cursor", "skills");
    fs.mkdirSync(cursorSkills, { recursive: true });
    writeSkillDir(cursorSkills, "kenmark-commit");
    writeSkillDir(cursorSkills, "impeccable");
    writeSkillDir(cursorSkills, "my-custom-skill");

    const kenmarkDry = runCleanup(
      ["--ide", "cursor", "--kenmark", "--dry-run", "-y"],
      home
    );
    if (kenmarkDry.status !== 0) {
      throw new Error(`cleanup --kenmark --dry-run exited with ${kenmarkDry.status}`);
    }
    if (!/Would remove 1 kenmark-\* skill path/.test(kenmarkDry.stdout || "")) {
      throw new Error("Expected kenmark dry-run to report 1 kenmark skill path");
    }
    if (!pathEntryExists(path.join(cursorSkills, "kenmark-commit"))) {
      throw new Error("Kenmark dry-run should not remove kenmark-commit");
    }

    const kenmarkRun = runCleanup(["--ide", "cursor", "--kenmark", "-y"], home);
    if (kenmarkRun.status !== 0) {
      throw new Error(`cleanup --kenmark exited with ${kenmarkRun.status}`);
    }
    if (pathEntryExists(path.join(cursorSkills, "kenmark-commit"))) {
      throw new Error("Expected kenmark-commit to be removed by --kenmark cleanup");
    }
    if (!pathEntryExists(path.join(cursorSkills, "impeccable"))) {
      throw new Error("impeccable should remain after --kenmark cleanup");
    }
    if (!pathEntryExists(path.join(cursorSkills, "my-custom-skill"))) {
      throw new Error("my-custom-skill should never be removed by cleanup");
    }

    const packsRun = runCleanup(["--ide", "cursor", "--packs", "-y"], home);
    if (packsRun.status !== 0) {
      throw new Error(`cleanup --packs exited with ${packsRun.status}`);
    }
    if (pathEntryExists(path.join(cursorSkills, "impeccable"))) {
      throw new Error("Expected impeccable to be removed by --packs cleanup");
    }
    if (!pathEntryExists(path.join(cursorSkills, "my-custom-skill"))) {
      throw new Error("my-custom-skill should remain after --packs cleanup");
    }

    console.log("Cleanup temp HOME test passed.");
  } catch (err) {
    console.error(`Cleanup temp HOME test failed: ${err.message}`);
    exitCode = 1;
  } finally {
    rmDirSafe(tmp);
  }

  process.exit(exitCode);
}

main();
