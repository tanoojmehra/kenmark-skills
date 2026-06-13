#!/usr/bin/env node

/**
 * Integration test: dangling legacy skill symlinks are removed during setup.
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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kenmark-broken-links-"));
  const home = path.join(tmp, "home");
  fs.mkdirSync(home, { recursive: true });

  let exitCode = 0;
  try {
    const oldStore = path.join(
      home,
      ".kenmark",
      "store",
      "skills",
      "issues-check"
    );
    const cursorSkills = path.join(home, ".cursor", "skills");
    fs.mkdirSync(cursorSkills, { recursive: true });

    fs.symlinkSync(oldStore, path.join(cursorSkills, "issues-check"), "dir");

    const result = spawnSync(
      process.execPath,
      [cliPath, "setup", "--ide", "cursor", "-y", "--skip-adopt"],
      {
        cwd: repoRoot,
        env: { ...process.env, HOME: home },
        encoding: "utf8"
      }
    );

    if (result.status !== 0) {
      console.error(result.stdout);
      console.error(result.stderr);
      throw new Error(`setup exited with ${result.status}`);
    }

    const stale = path.join(cursorSkills, "issues-check");
    if (pathEntryExists(stale)) {
      throw new Error("Expected stale dangling legacy symlink to be removed");
    }

    const newLink = path.join(cursorSkills, "kenmark-issues-check");
    if (!fs.existsSync(path.join(newLink, "SKILL.md"))) {
      throw new Error("Expected new kenmark-issues-check link to resolve");
    }

    console.log("Broken symlink cleanup test passed.");
  } catch (err) {
    console.error(`Broken symlink cleanup test failed: ${err.message}`);
    exitCode = 1;
  } finally {
    rmDirSafe(tmp);
  }

  process.exit(exitCode);
}

main();
