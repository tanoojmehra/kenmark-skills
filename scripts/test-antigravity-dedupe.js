#!/usr/bin/env node

/**
 * Antigravity CLI/IDE skill path dedupe — temp HOME integration tests.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  buildGlobalTargets,
  buildProjectTargets,
  dedupeAliasTargetIdes,
  findAntigravityCliGeminiDuplicateSkills,
  hadAntigravityCliGeminiAliasOverlap,
  getExtraProjectSkillPaths
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

function runSetup(args, home, cwd = repoRoot) {
  return spawnSync(process.execPath, [cliPath, "setup", ...args], {
    cwd,
    stdio: "inherit",
    env: { ...process.env, HOME: home, NO_COLOR: "1" }
  });
}

function main() {
  console.log("kenmark-skills Antigravity dedupe tests\n");
  const failures = [];

  try {
    assert(
      hadAntigravityCliGeminiAliasOverlap(["antigravity-cli", "gemini"]),
      "expected antigravity-cli+gemini overlap"
    );
    assert(
      !hadAntigravityCliGeminiAliasOverlap(["antigravity-cli", "cursor"]),
      "antigravity-cli+cursor is not an alias overlap"
    );
    const deduped = dedupeAliasTargetIdes([
      "cursor",
      "antigravity-cli",
      "gemini",
      "claude"
    ]);
    assert(
      deduped.includes("antigravity-cli") && !deduped.includes("gemini"),
      `dedupe should drop gemini when antigravity-cli present: ${deduped.join(",")}`
    );
    const extras = getExtraProjectSkillPaths("antigravity", "/tmp/proj");
    assert(
      extras.length === 1 && extras[0].endsWith(path.join(".agents", "skills")),
      `expected .agents/skills extra path, got ${extras.join(",")}`
    );
    console.log("  ✓ dedupeAliasTargetIdes / getExtraProjectSkillPaths unit checks");
  } catch (err) {
    failures.push(err.message);
  }

  const bothHome = path.join(
    os.tmpdir(),
    `kenmark-agy-gemini-both-${process.pid}-${Date.now()}`
  );
  try {
    fs.mkdirSync(bothHome, { recursive: true });
    const bothRun = runSetup(
      ["--global", "--ide", "antigravity-cli,gemini", "-y", "--skip-adopt"],
      bothHome
    );
    if (bothRun.status !== 0) {
      failures.push(`antigravity-cli+gemini setup exited ${bothRun.status}`);
    } else {
      const targets = buildGlobalTargets(bothHome);
      const agyInit = path.join(targets["antigravity-cli"], "kenmark-init", "SKILL.md");
      const geminiInit = path.join(targets.gemini, "kenmark-init", "SKILL.md");
      assert(fs.existsSync(agyInit), "kenmark-init missing under ~/.gemini/antigravity-cli/skills");
      assert(!fs.existsSync(geminiInit), "kenmark-init should not be under ~/.gemini/skills");
      const geminiNames = listSkillDirNames(targets.gemini);
      assert(
        geminiNames.length === 0,
        `expected empty ~/.gemini/skills, found: ${geminiNames.join(", ")}`
      );
      const dupes = findAntigravityCliGeminiDuplicateSkills(targets);
      assert(dupes.length === 0, `duplicate scan found ${dupes.length} skill(s)`);
      console.log("  ✓ antigravity-cli+gemini install links once to ~/.gemini/antigravity-cli/skills");
    }
  } catch (err) {
    failures.push(err.message);
  } finally {
    rmDirSafe(bothHome);
  }

  const agyOnlyHome = path.join(
    os.tmpdir(),
    `kenmark-agy-only-${process.pid}-${Date.now()}`
  );
  try {
    fs.mkdirSync(agyOnlyHome, { recursive: true });
    const agyRun = runSetup(
      ["--global", "--ide", "antigravity-cli", "-y", "--skip-adopt"],
      agyOnlyHome
    );
    if (agyRun.status !== 0) {
      failures.push(`antigravity-cli-only setup exited ${agyRun.status}`);
    } else {
      const targets = buildGlobalTargets(agyOnlyHome);
      const agyInit = path.join(targets["antigravity-cli"], "kenmark-init", "SKILL.md");
      assert(fs.existsSync(agyInit), "kenmark-init missing under ~/.gemini/antigravity-cli/skills");
      console.log("  ✓ antigravity-cli-only install links to dedicated global path");
    }
  } catch (err) {
    failures.push(err.message);
  } finally {
    rmDirSafe(agyOnlyHome);
  }

  const projectHome = path.join(
    os.tmpdir(),
    `kenmark-agy-project-${process.pid}-${Date.now()}`
  );
  const projectDir = path.join(
    os.tmpdir(),
    `kenmark-agy-projdir-${process.pid}-${Date.now()}`
  );
  try {
    fs.mkdirSync(projectHome, { recursive: true });
    fs.mkdirSync(projectDir, { recursive: true });
    const projRun = runSetup(
      ["--project", "--ide", "antigravity", "-y", "--skip-adopt"],
      projectHome,
      projectDir
    );
    if (projRun.status !== 0) {
      failures.push(`antigravity project setup exited ${projRun.status}`);
    } else {
      const targets = buildProjectTargets(projectDir);
      const agentInit = path.join(targets.antigravity, "kenmark-init", "SKILL.md");
      const agentsInit = path.join(targets["antigravity-cli"], "kenmark-init", "SKILL.md");
      assert(fs.existsSync(agentInit), "kenmark-init missing under .agent/skills");
      assert(fs.existsSync(agentsInit), "kenmark-init missing under .agents/skills");
      const agentStat = fs.lstatSync(path.join(targets.antigravity, "kenmark-init"));
      assert(!agentStat.isSymbolicLink(), "antigravity IDE skill should be copied, not symlinked");
      console.log("  ✓ antigravity project install copies to .agent/skills and .agents/skills");
    }
  } catch (err) {
    failures.push(err.message);
  } finally {
    rmDirSafe(projectHome);
    rmDirSafe(projectDir);
  }

  const mcpDryHome = path.join(
    os.tmpdir(),
    `kenmark-agy-mcp-${process.pid}-${Date.now()}`
  );
  try {
    fs.mkdirSync(mcpDryHome, { recursive: true });
    const mcpRun = spawnSync(
      process.execPath,
      [
        cliPath,
        "setup",
        "--dry-run",
        "--global",
        "--ide",
        "antigravity-cli,antigravity",
        "--mcp-profile",
        "web",
        "-y"
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, HOME: mcpDryHome, NO_COLOR: "1" }
      }
    );
    if (mcpRun.status !== 0) {
      failures.push(`antigravity MCP dry-run exited ${mcpRun.status}`);
    } else {
      const out = `${mcpRun.stdout || ""}${mcpRun.stderr || ""}`;
      assert(
        out.includes("antigravity-cli") && out.includes("browsermcp, playwright"),
        "dry-run output should mention antigravity-cli and MCP servers"
      );
      assert(
        out.includes(".gemini/antigravity/skills"),
        "dry-run output should mention antigravity IDE skills path"
      );
      console.log("  ✓ antigravity-cli+antigravity MCP dry-run plan");
    }
  } catch (err) {
    failures.push(err.message);
  } finally {
    rmDirSafe(mcpDryHome);
  }

  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`);
    for (const f of failures) console.error(`  • ${f}`);
    process.exit(1);
  }

  console.log("\nOK — Antigravity dedupe tests passed.");
}

main();
