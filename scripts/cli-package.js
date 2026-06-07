#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function readLocalPackageVersion(repoRoot) {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")
    );
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

function parseSemver(version) {
  const match = String(version || "")
    .trim()
    .replace(/^v/, "")
    .match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function semverLt(a, b) {
  const left = parseSemver(a);
  const right = parseSemver(b);
  if (!left || !right) return false;
  for (let i = 0; i < 3; i += 1) {
    if (left[i] < right[i]) return true;
    if (left[i] > right[i]) return false;
  }
  return false;
}

function fetchNpmLatestVersion() {
  const result = spawnSync("npm view kenmark-skills version", {
    shell: true,
    encoding: "utf8",
    timeout: 15000
  });
  if (result.status !== 0) return null;
  const version = (result.stdout || "").trim();
  return version || null;
}

function globalKenmarkInstalled() {
  const result = spawnSync("npm list -g kenmark-skills --depth=0", {
    shell: true,
    encoding: "utf8"
  });
  return result.status === 0 && /kenmark-skills@/.test(result.stdout || "");
}

function globalNpmRoot() {
  const result = spawnSync("npm root -g", {
    shell: true,
    encoding: "utf8"
  });
  if (result.status !== 0) return null;
  const root = (result.stdout || "").trim();
  return root || null;
}

function globalKenmarkSetupScriptPath() {
  const root = globalNpmRoot();
  if (!root) return null;
  const scriptPath = path.join(root, "kenmark-skills", "scripts", "kenmark-setup.js");
  return fs.existsSync(scriptPath) ? scriptPath : null;
}

function runningFromGlobalPackage(setupScriptPath) {
  const globalSetup = globalKenmarkSetupScriptPath();
  return Boolean(
    globalSetup &&
      setupScriptPath &&
      path.resolve(globalSetup) === path.resolve(setupScriptPath)
  );
}

function readGlobalPackageVersion() {
  const root = globalNpmRoot();
  if (!root) return null;
  return readLocalPackageVersion(path.join(root, "kenmark-skills"));
}

function runNpmInstallLatest(dryRun) {
  const cmd = "npm install -g kenmark-skills@latest";
  console.log("\n━━━ npm package ━━━");
  console.log(`$ ${cmd}`);
  if (dryRun) return { status: 0 };
  return spawnSync(cmd, { shell: true, stdio: "inherit", env: process.env });
}

function formatStaleCliHint(localVersion, latestVersion, { globalInstalled }) {
  const lines = [
    "",
    `CLI v${localVersion} is outdated (npm latest v${latestVersion}).`
  ];
  if (globalInstalled) {
    lines.push(
      "  Upgrade: accept the prompt, pass --upgrade-cli -y, or run:",
      "  npm install -g kenmark-skills@latest"
    );
  } else {
    lines.push("  Run: npx kenmark-skills@latest init");
  }
  lines.push("");
  return lines.join("\n");
}

module.exports = {
  readLocalPackageVersion,
  parseSemver,
  semverLt,
  fetchNpmLatestVersion,
  globalKenmarkInstalled,
  globalNpmRoot,
  globalKenmarkSetupScriptPath,
  runningFromGlobalPackage,
  readGlobalPackageVersion,
  runNpmInstallLatest,
  formatStaleCliHint
};
