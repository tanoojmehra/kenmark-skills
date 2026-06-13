#!/usr/bin/env node

/**
 * Gemini/Codex skill path dedupe — temp HOME integration tests.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  buildGlobalTargets,
  dedupeAliasTargetIdes,
  findGeminiCodexDuplicateSkills,
  hadGeminiCodexAliasOverlap
} = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const cliPath = path.join(__dirname, "cli.js");

function rmDirSafe(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function listSkillDirNames(skillsRoot) {
  if (!fs.existsSync(skillsRoot)) return [];
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() || e.isSymbolicLink())
    .map((e) => e.name)
    .filter((name) => name !== ".kenmark-managed");
}

function runSetup(args, home) {
  return spawnSync(process.execPath, [cliPath, "setup", ...args], {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, HOME: home, NO_COLOR: "1" }
  });
}

function main() {
  console.log("kenmark-skills Gemini/Codex dedupe tests\n");
  const failures = [];

  try {
    assert(
      hadGeminiCodexAliasOverlap(["codex", "gemini"]),
      "expected codex+gemini overlap"
    );
    assert(
      !hadGeminiCodexAliasOverlap(["codex", "cursor"]),
      "codex+cursor is not an alias overlap"
    );
    const deduped = dedupeAliasTargetIdes(["cursor", "codex", "gemini", "claude"]);
    assert(
      deduped.includes("codex") && !deduped.includes("gemini"),
      `dedupe should drop gemini when codex present: ${deduped.join(",")}`
    );
    console.log("  ✓ dedupeAliasTargetIdes unit checks");
  } catch (err) {
    failures.push(err.message);
  }

  const bothHome = path.join(
    os.tmpdir(),
    `kenmark-gemini-codex-both-${process.pid}-${Date.now()}`
  );
  try {
    fs.mkdirSync(bothHome, { recursive: true });
    const bothRun = runSetup(
      ["--ide", "codex,gemini", "-y", "--skip-adopt"],
      bothHome
    );
    if (bothRun.status !== 0) {
      failures.push(`codex+gemini setup exited ${bothRun.status}`);
    } else {
      const targets = buildGlobalTargets(bothHome);
      const agentsInit = path.join(targets.codex, "kenmark-init", "SKILL.md");
      const geminiInit = path.join(targets.gemini, "kenmark-init", "SKILL.md");
      assert(fs.existsSync(agentsInit), "kenmark-init missing under ~/.agents/skills");
      assert(!fs.existsSync(geminiInit), "kenmark-init should not be under ~/.gemini/skills");
      const geminiNames = listSkillDirNames(targets.gemini);
      assert(
        geminiNames.length === 0,
        `expected empty ~/.gemini/skills, found: ${geminiNames.join(", ")}`
      );
      const dupes = findGeminiCodexDuplicateSkills(targets);
      assert(dupes.length === 0, `duplicate scan found ${dupes.length} skill(s)`);
      console.log("  ✓ codex+gemini install links once to ~/.agents/skills");
    }
  } catch (err) {
    failures.push(err.message);
  } finally {
    rmDirSafe(bothHome);
  }

  const geminiOnlyHome = path.join(
    os.tmpdir(),
    `kenmark-gemini-only-${process.pid}-${Date.now()}`
  );
  try {
    fs.mkdirSync(geminiOnlyHome, { recursive: true });
    const geminiRun = runSetup(
      ["--ide", "gemini", "-y", "--skip-adopt"],
      geminiOnlyHome
    );
    if (geminiRun.status !== 0) {
      failures.push(`gemini-only setup exited ${geminiRun.status}`);
    } else {
      const targets = buildGlobalTargets(geminiOnlyHome);
      const geminiInit = path.join(targets.gemini, "kenmark-init", "SKILL.md");
      assert(fs.existsSync(geminiInit), "kenmark-init missing under ~/.gemini/skills");
      console.log("  ✓ gemini-only install links to ~/.gemini/skills");
    }
  } catch (err) {
    failures.push(err.message);
  } finally {
    rmDirSafe(geminiOnlyHome);
  }

  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`);
    for (const f of failures) console.error(`  • ${f}`);
    process.exit(1);
  }

  console.log("\nOK — Gemini/Codex dedupe tests passed.");
}

main();
