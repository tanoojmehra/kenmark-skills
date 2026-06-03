#!/usr/bin/env node

/**
 * Pack tarball install smoke test — npm pack, install in temp project, run npx CLI.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const repoRoot = path.resolve(__dirname, "..");

function run(cmd, args, options = {}) {
  const label = options.label || [cmd, ...args].join(" ");
  const result = spawnSync(cmd, args, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    env: options.env || process.env,
    stdio: options.stdio || "pipe"
  });
  const code = result.status === null ? 1 : result.status;
  if (code !== 0 && !options.allowFail) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join("\n");
    throw new Error(`${label} failed (exit ${code})\n${detail}`.trim());
  }
  return { label, result, code };
}

function rmDirSafe(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function main() {
  console.log("kenmark-skills pack install test\n");

  const workRoot = path.join(
    os.tmpdir(),
    `kenmark-pack-test-${process.pid}-${Date.now()}`
  );
  const installDir = path.join(workRoot, "consumer");
  let tarballPath = null;

  try {
    fs.mkdirSync(workRoot, { recursive: true });

    const pack = run("npm", ["pack", "--silent"], { cwd: repoRoot });
    const packLine = (pack.result.stdout || "").trim().split(/\r?\n/).pop();
    if (!packLine) {
      throw new Error("npm pack produced no tarball name");
    }
    tarballPath = path.isAbsolute(packLine)
      ? packLine
      : path.join(repoRoot, packLine);
    if (!fs.existsSync(tarballPath)) {
      throw new Error(`tarball not found: ${tarballPath}`);
    }
    console.log(`  ✓ npm pack → ${path.basename(tarballPath)}`);

    fs.mkdirSync(installDir, { recursive: true });
    run("npm", ["init", "-y"], { cwd: installDir });
    run("npm", ["install", tarballPath], { cwd: installDir });

    const npxCommands = [
      ["kenmark-skills", "help"],
      ["kenmark-skills", "validate"],
      ["kenmark-skills", "setup", "--dry-run", "--global", "--ide", "claude", "-y"]
    ];

    for (const args of npxCommands) {
      run("npx", args, { cwd: installDir });
      console.log(`  ✓ npx ${args.join(" ")}`);
    }

    console.log("\nOK — pack install test passed.");
  } catch (err) {
    console.error(`\nPack test failed: ${err.message}`);
    process.exit(1);
  } finally {
    if (tarballPath && fs.existsSync(tarballPath)) {
      try {
        fs.unlinkSync(tarballPath);
      } catch {
        /* ignore */
      }
    }
    rmDirSafe(workRoot);
  }
}

main();
