#!/usr/bin/env node

/**
 * Integration test: real global setup into a temporary HOME directory.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { LEGACY_SKILL_RENAMES } = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const cliPath = path.join(__dirname, "cli.js");

function rmDirSafe(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function listDirNames(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() || e.isSymbolicLink())
    .map((e) => e.name);
}

function main() {
  const tempHome = path.join(
    os.tmpdir(),
    `kenmark-test-home-${process.pid}-${Date.now()}`
  );

  console.log(`kenmark-skills install integration test\n  HOME=${tempHome}\n`);

  let exitCode = 0;
  try {
    fs.mkdirSync(tempHome, { recursive: true });

    const result = spawnSync(
      process.execPath,
      [cliPath, "setup", "--global", "--ide", "claude", "-y", "--skip-adopt"],
      {
        cwd: repoRoot,
        stdio: "inherit",
        env: { ...process.env, HOME: tempHome }
      }
    );
    const code = result.status === null ? 1 : result.status;
    assert(code === 0, `setup exited with ${code}`);

    const storeSkills = path.join(tempHome, ".kenmark", "store", "skills");
    assert(fs.existsSync(storeSkills), `missing store: ${storeSkills}`);

    const claudeSkills = path.join(tempHome, ".claude", "skills");
    assert(fs.existsSync(claudeSkills), `missing Claude skills dir: ${claudeSkills}`);

    const claudeNames = listDirNames(claudeSkills);
    const kenmarkLinked = claudeNames.filter((n) => n.startsWith("kenmark-"));
    assert(
      kenmarkLinked.length > 0,
      `expected kenmark-* entries under .claude/skills, found: ${claudeNames.join(", ") || "(none)"}`
    );

    const legacyNames = Object.keys(LEGACY_SKILL_RENAMES);
    for (const legacy of legacyNames) {
      assert(
        !fs.existsSync(path.join(storeSkills, legacy)),
        `legacy unprefixed store skill created: ${legacy}`
      );
      assert(
        !fs.existsSync(path.join(claudeSkills, legacy)),
        `legacy unprefixed Claude skill link created: ${legacy}`
      );
    }

    const commandsDir = path.join(tempHome, ".claude", "commands");
    if (fs.existsSync(commandsDir)) {
      const legacyCommandBasenames = new Set([
        ...Object.keys(LEGACY_SKILL_RENAMES),
        ...Object.keys(LEGACY_SKILL_RENAMES).map((k) => `kenmark-${k}`)
      ]);
      const unexpected = fs
        .readdirSync(commandsDir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""))
        .filter((base) => legacyCommandBasenames.has(base));
      assert(
        unexpected.length === 0,
        `unexpected Claude command wrappers: ${unexpected.join(", ")}`
      );
    }

    const manifestPath = path.join(tempHome, ".kenmark", "manifest.json");
    assert(fs.existsSync(manifestPath), `missing manifest: ${manifestPath}`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert(
      manifest.skills && Object.keys(manifest.skills).length > 0,
      "manifest.json has no skills entries"
    );

    console.log("\nOK — temp HOME install integration test passed.");
  } catch (err) {
    console.error(`\nInstall integration test failed: ${err.message}`);
    exitCode = 1;
  } finally {
    rmDirSafe(tempHome);
  }

  process.exit(exitCode);
}

main();
