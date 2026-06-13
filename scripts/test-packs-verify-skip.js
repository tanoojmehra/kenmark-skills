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
const cliScript = path.join(__dirname, "cli.js");
const { buildGlobalTargets, dedupeAliasTargetIdes } = require("./kenmark-hub");

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

function runCli(args, env) {
  return spawnSync(process.execPath, [cliScript, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", ...env },
    stdio: "pipe"
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function skillPresent(homeDir, ideKey, skillName, requestedIdes) {
  const targets = buildGlobalTargets(homeDir);
  const allIdes = Object.keys(targets);
  const linkIdes = dedupeAliasTargetIdes(requestedIdes || allIdes);
  let effectiveIde = ideKey;
  if (!linkIdes.includes(ideKey)) {
    if (ideKey === "gemini" && linkIdes.includes("codex")) {
      effectiveIde = "codex";
    } else {
      return false;
    }
  }
  const skillPath = path.join(targets[effectiveIde], skillName, "SKILL.md");
  return fs.existsSync(skillPath);
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
    const agentsSkill = path.join(
      tempHome,
      ".agents",
      "skills",
      "impeccable",
      "SKILL.md"
    );
    fs.mkdirSync(path.dirname(agentsSkill), { recursive: true });
    fs.writeFileSync(agentsSkill, "# impeccable\n");

    const skipRun = runPacks(
      ["--ids", "impeccable", "--global", "-y", "--skip-adopt"],
      { HOME: tempHome }
    );
    const skipStdout = (skipRun.stdout || "") + (skipRun.stderr || "");
    if (skipRun.status !== 0) {
      failures.push(`verify-OK skip run exited ${skipRun.status}`);
    } else if (!/Already installed: impeccable — skipping install/.test(skipStdout)) {
      failures.push("verify-OK run did not report already installed");
    } else if (!/Use --force to reinstall/.test(skipStdout)) {
      failures.push("verify-OK run did not mention --force");
    } else if (/skills add pbakaus\/impeccable/.test(skipStdout)) {
      failures.push("verify-OK run still invoked skills add installer");
    } else {
      console.log("  ✓ verify-OK pack skips install");
    }

    const cliSkip = runCli(
      [
        "install-recommended",
        "--ids",
        "impeccable",
        "--global",
        "--ide",
        "claude",
        "-y",
        "--skip-adopt"
      ],
      { HOME: tempHome }
    );
    const cliSkipStdout = (cliSkip.stdout || "") + (cliSkip.stderr || "");
    if (cliSkip.status !== 0) {
      failures.push(`cli verify-OK skip exited ${cliSkip.status}`);
    } else if (!/Already installed: impeccable — skipping install/.test(cliSkipStdout)) {
      failures.push("cli verify-OK run did not skip install");
    } else if (/skills add pbakaus\/impeccable/.test(cliSkipStdout)) {
      failures.push("cli verify-OK run still invoked skills add installer");
    } else {
      console.log("  ✓ cli install-recommended skips when verify OK");
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
    } else if (/Already installed: impeccable — skipping install/.test(forceStdout)) {
      failures.push("--force dry-run incorrectly skipped install");
    } else {
      console.log("  ✓ --force shows install even when verify would pass");
    }

    const cliForce = runCli(
      [
        "install-recommended",
        "--ids",
        "impeccable",
        "--global",
        "--ide",
        "claude",
        "-y",
        "--skip-adopt",
        "--force",
        "--dry-run"
      ],
      { HOME: tempHome }
    );
    const cliForceStdout = (cliForce.stdout || "") + (cliForce.stderr || "");
    if (cliForce.status !== 0) {
      failures.push(`cli --force dry-run exited ${cliForce.status}`);
    } else if (!/skills add pbakaus\/impeccable/.test(cliForceStdout)) {
      failures.push("cli --force dry-run did not show install command");
    } else if (/Already installed: impeccable — skipping install/.test(cliForceStdout)) {
      failures.push("cli --force dry-run incorrectly skipped install");
    } else {
      console.log("  ✓ cli --force shows install when verify would pass");
    }

    const wireHome = path.join(
      os.tmpdir(),
      `kenmark-packs-wire-${process.pid}-${Date.now()}`
    );
    try {
      const claudeOnlySkill = path.join(
        wireHome,
        ".claude",
        "skills",
        "simplify",
        "SKILL.md"
      );
      fs.mkdirSync(path.dirname(claudeOnlySkill), { recursive: true });
      fs.writeFileSync(claudeOnlySkill, "# simplify\n");

      const wireRun = runPacks(
        [
          "--ids",
          "simplify",
          "--global",
          "-y",
          "--ide",
          "cursor,codex,gemini,opencode,minimax"
        ],
        { HOME: wireHome }
      );
      const wireStdout = (wireRun.stdout || "") + (wireRun.stderr || "");
      if (wireRun.status !== 0) {
        failures.push(`wire skip run exited ${wireRun.status}`);
      } else if (
        !/Already installed: simplify — skipping install/.test(wireStdout)
      ) {
        failures.push("wire run did not skip install for simplify");
      } else {
        const ides = ["cursor", "codex", "gemini", "opencode", "minimax"];
        const missing = ides.filter(
          (ide) => !skillPresent(wireHome, ide, "simplify", ides)
        );
        if (missing.length) {
          failures.push(
            `wire run did not link simplify to: ${missing.join(", ")}`
          );
        } else {
          const storeSkill = path.join(
            wireHome,
            ".kenmark",
            "store",
            "skills",
            "simplify",
            "SKILL.md"
          );
          if (!fs.existsSync(storeSkill)) {
            failures.push("wire run did not adopt simplify into store");
          } else {
            console.log(
              "  ✓ already-installed pack wires to all selected IDEs"
            );
          }
        }
      }
    } finally {
      rmDirSafe(wireHome);
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
