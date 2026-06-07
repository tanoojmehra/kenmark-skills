#!/usr/bin/env node

/**
 * Integration test: kenmark-skills cleanup removes broken symlinks in a temp HOME.
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

    const dryRun = spawnSync(
      process.execPath,
      [cliPath, "cleanup", "--global", "--ide", "gemini", "--dry-run", "-y"],
      {
        cwd: repoRoot,
        env: { ...process.env, HOME: home },
        encoding: "utf8"
      }
    );
    if (dryRun.status !== 0) {
      throw new Error(`cleanup --dry-run exited with ${dryRun.status}`);
    }
    if (!/Would remove 1 broken symlink/.test(dryRun.stdout || "")) {
      throw new Error("Expected dry-run to report 1 broken symlink");
    }
    if (!pathEntryExists(path.join(geminiSkills, "stale-skill"))) {
      throw new Error("Dry-run should not remove the broken symlink");
    }

    const cleanup = spawnSync(
      process.execPath,
      [cliPath, "cleanup", "--global", "--ide", "gemini", "-y"],
      {
        cwd: repoRoot,
        env: { ...process.env, HOME: home },
        encoding: "utf8"
      }
    );
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
