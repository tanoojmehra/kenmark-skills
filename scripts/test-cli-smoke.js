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
  ["version"],
  ["--version"],
  ["-v"],
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
  [
    "install-recommended",
    "--ids",
    "impeccable",
    "--dry-run",
    "--global",
    "--skip-adopt",
    "-y"
  ],
  ["update", "--kenmark-only", "--global", "--ide", "auto", "-y", "--dry-run"],
  ["update", "--both", "--global", "--ide", "auto", "--dry-run", "-y"],
  ["doctor", "--soft", "--no-fail"]
];

/** @type {{ args: string[], expectStdout?: RegExp[], rejectStdout?: RegExp[] }[]} */
const ASSERTIONS = [
  {
    args: ["update", "--kenmark-only", "--global", "--ide", "auto", "-y", "--dry-run"],
    expectStdout: [
      /setup-skills\.js --global --install --ide auto -y/,
      /Kenmark skills/
    ],
    rejectStdout: [/Recommended packs/, /kenmark-packs\.js/, /--all/]
  },
  {
    args: ["update", "--both", "--global", "--ide", "auto", "--dry-run", "-y"],
    expectStdout: [
      /setup-skills\.js --global --install --ide auto -y/,
      /kenmark-packs\.js --global -y --ids /
    ],
    rejectStdout: [/--all/]
  },
  {
    args: [
      "install-recommended",
      "--ids",
      "impeccable",
      "--dry-run",
      "--global",
      "--skip-adopt",
      "-y"
    ],
    expectStdout: [/skills add pbakaus\/impeccable|pbakaus\/impeccable/],
    rejectStdout: [/Already installed: impeccable — skipping install/]
  }
];

const pkgVersion = require(path.join(repoRoot, "package.json")).version;

function runCli(args) {
  const label = `node scripts/cli.js ${args.join(" ")}`;
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" }
  });
  return { label, result };
}

function checkAssertions(label, stdout, rules) {
  const problems = [];
  for (const re of rules.expectStdout || []) {
    if (!re.test(stdout)) {
      problems.push(`expected stdout to match ${re}`);
    }
  }
  for (const re of rules.rejectStdout || []) {
    if (re.test(stdout)) {
      problems.push(`expected stdout NOT to match ${re}`);
    }
  }
  return problems;
}

function main() {
  console.log("kenmark-skills CLI smoke tests\n");
  const failures = [];

  for (const args of COMMANDS) {
    const { label, result } = runCli(args);
    const code = result.status === null ? 1 : result.status;
    const stdout = (result.stdout || "") + (result.stderr || "");
    const isVersionCmd =
      args[0] === "version" || args[0] === "--version" || args[0] === "-v";
    if (isVersionCmd && code === 0 && !stdout.trim().includes(pkgVersion)) {
      failures.push({
        label,
        code,
        stderr: `expected version ${pkgVersion}, got: ${stdout.trim()}`
      });
      console.error(`  ✗ ${label} (version mismatch)`);
      continue;
    }
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

  for (const rules of ASSERTIONS) {
    const { label, result } = runCli(rules.args);
    const code = result.status === null ? 1 : result.status;
    const stdout = (result.stdout || "") + (result.stderr || "");
    const problems = [];
    if (code !== 0) {
      problems.push(`exit ${code}`);
    }
    problems.push(...checkAssertions(label, stdout, rules));
    if (problems.length) {
      failures.push({ label, problems, stdout: stdout.trim() });
      console.error(`  ✗ ${label} (assertions)`);
      for (const p of problems) console.error(`      ${p}`);
    } else {
      console.log(`  ✓ ${label} (assertions)`);
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} CLI smoke test(s) failed.`);
    process.exit(1);
  }

  console.log("\nOK — all CLI smoke tests passed.");
}

main();
