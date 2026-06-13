#!/usr/bin/env node

/**
 * Unit tests for global-only scope behavior.
 */

const { spawnSync } = require("child_process");
const path = require("path");
const {
  getScopePromptLines,
  promptScope,
  rejectProjectScopeInArgv,
  PROJECT_SCOPE_REMOVED
} = require("./interactive");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const install = getScopePromptLines("install");
  assert(install.title === "Install scope", `install title mismatch: ${install.title}`);
  assert(
    install.lines[0].includes("global"),
    "install line should describe global scope"
  );
  assert(install.lines.length === 1, "install prompt should be global-only");

  const cleanup = getScopePromptLines("cleanup");
  assert(cleanup.title === "Cleanup scope", `cleanup title mismatch: ${cleanup.title}`);
  assert(
    cleanup.lines[0].includes("global"),
    "cleanup line should describe global scope"
  );

  const scope = await promptScope();
  assert(scope === "global", "promptScope should always return global");

  let rejected = false;
  const originalExit = process.exit;
  const originalError = console.error;
  process.exit = (code) => {
    rejected = code === 1;
    throw new Error("exit");
  };
  console.error = () => {};
  try {
    rejectProjectScopeInArgv(["--project"]);
  } catch (err) {
    if (err.message !== "exit") throw err;
  } finally {
    process.exit = originalExit;
    console.error = originalError;
  }
  assert(rejected, "rejectProjectScopeInArgv should exit on --project");
  assert(
    PROJECT_SCOPE_REMOVED.includes("global"),
    "PROJECT_SCOPE_REMOVED should mention global-only"
  );

  const setupScript = path.join(__dirname, "setup-skills.js");
  const result = spawnSync(process.execPath, [setupScript, "--project", "--help"], {
    encoding: "utf8"
  });
  assert(result.status === 1, "setup --project should exit 1");
  assert(
    (result.stderr || "").includes("Project scope is not supported"),
    "setup --project should print global-only message"
  );

  console.log("interactive global-only scope tests passed.");
}

main().catch((err) => {
  console.error(`interactive global-only scope tests failed: ${err.message}`);
  process.exit(1);
});
