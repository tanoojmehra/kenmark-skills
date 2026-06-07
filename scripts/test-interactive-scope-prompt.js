#!/usr/bin/env node

/**
 * Unit tests for scope prompt copy (install vs cleanup).
 */

const { getScopePromptLines } = require("./interactive");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const install = getScopePromptLines("install");
  assert(
    install.title === "Where should skills be installed?",
    `install title mismatch: ${install.title}`
  );
  assert(
    install.lines[0].includes("all projects on this machine"),
    "install global line should mention all projects"
  );
  assert(
    !install.lines[0].includes("user home IDE folders"),
    "install global line must not use cleanup wording"
  );

  const installRequired = getScopePromptLines("install", { required: true });
  assert(
    !installRequired.lines[0].includes("[default]"),
    "required install prompt should omit [default]"
  );

  const cleanup = getScopePromptLines("cleanup");
  assert(
    cleanup.title === "Where should cleanup run?",
    `cleanup title mismatch: ${cleanup.title}`
  );
  assert(
    cleanup.lines[0].includes("user home IDE folders"),
    "cleanup global line should mention user home IDE folders"
  );
  assert(
    !cleanup.title.includes("installed"),
    "cleanup title must not mention installed"
  );
  assert(
    cleanup.lines[0].includes("[default]"),
    "default cleanup prompt should mark global as default"
  );

  const cleanupRequired = getScopePromptLines("cleanup", { required: true });
  assert(
    !cleanupRequired.lines[0].includes("[default]"),
    "required cleanup prompt should omit [default]"
  );

  console.log("interactive scope prompt tests passed.");
}

try {
  main();
} catch (err) {
  console.error(`interactive scope prompt tests failed: ${err.message}`);
  process.exit(1);
}
