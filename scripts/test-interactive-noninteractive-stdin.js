#!/usr/bin/env node

/**
 * Regression: TTY/non-TTY stdin guards for init/update interactive mode.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  wantsInteractive,
  assertInteractiveStdin,
  NONINTERACTIVE_STDIN_HINT
} = require("./interactive");

const repoRoot = path.resolve(__dirname, "..");
const cliPath = path.join(__dirname, "cli.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function rmDirSafe(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

async function main() {
  assert(!wantsInteractive({ yes: true }), "wantsInteractive should be false with -y");

  const prev = process.env.KENMARK_SKILLS_NONINTERACTIVE;
  process.env.KENMARK_SKILLS_NONINTERACTIVE = "1";
  assert(!wantsInteractive({}), "wantsInteractive should be false with env flag");
  if (prev === undefined) delete process.env.KENMARK_SKILLS_NONINTERACTIVE;
  else process.env.KENMARK_SKILLS_NONINTERACTIVE = prev;

  assert(
    NONINTERACTIVE_STDIN_HINT.includes("KENMARK_SKILLS_NONINTERACTIVE"),
    "hint should mention env flag"
  );
  assert(NONINTERACTIVE_STDIN_HINT.includes("-y"), "hint should mention -y");

  const tempHome = path.join(
    os.tmpdir(),
    `kenmark-noninteractive-stdin-${process.pid}-${Date.now()}`
  );
  fs.mkdirSync(tempHome, { recursive: true });

  try {
    const piped = spawnSync(
      process.execPath,
      [cliPath, "init", "--skip-recommended", "-y"],
      {
        cwd: repoRoot,
        stdio: ["pipe", "pipe", "pipe"],
        encoding: "utf8",
        env: { ...process.env, HOME: tempHome }
      }
    );
    assert(piped.status === 0, `piped init should succeed: ${piped.stderr}`);
    assert(
      !(piped.stdout || "").includes("Nothing selected to install"),
      "piped init should not silently select nothing"
    );

    const destroyedStdin = spawnSync(
      process.execPath,
      [
        "-e",
        `
          Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
          Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
          process.stdin.destroy();
          require("./interactive").assertInteractiveStdin();
        `
      ],
      {
        cwd: path.join(__dirname),
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf8"
      }
    );
    assert(
      destroyedStdin.status === 1,
      `destroyed stdin should exit 1, got ${destroyedStdin.status}`
    );
    assert(
      (destroyedStdin.stderr || "").includes("Non-interactive stdin detected"),
      "destroyed stdin should print guidance"
    );

    console.log("interactive non-interactive stdin tests passed.");
  } finally {
    rmDirSafe(tempHome);
  }
}

main().catch((err) => {
  console.error(`interactive non-interactive stdin tests failed: ${err.message}`);
  process.exit(1);
});
