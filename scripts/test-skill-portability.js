#!/usr/bin/env node

/**
 * Unit tests for skill path portability helpers.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  normalizeSkillPaths,
  findNonPortablePaths,
  scanSkillForNonPortablePaths,
  processSkillPortability
} = require("./kenmark-hub");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function testNormalizeAndDetect() {
  const skillName = "kenmark-test";
  const input =
    "See `.cursor/skills/kenmark-test/scripts/foo.js` and `.agents/skills/kenmark-test/bar`";
  const expected = "See `./scripts/foo.js` and `./bar`";

  assert(normalizeSkillPaths(input, skillName) === expected, "normalizeSkillPaths rewrites IDE anchors");
  assert(findNonPortablePaths(input, skillName).length === 2, "findNonPortablePaths detects anchors");
  assert(findNonPortablePaths(expected, skillName).length === 0, "findNonPortablePaths ignores normalized paths");
}

function testProcessSkillPortability() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kenmark-portability-"));
  try {
    const skillName = "sample-skill";
    const skillDir = path.join(tmp, skillName);
    const scriptsDir = path.join(skillDir, "scripts");
    fs.mkdirSync(scriptsDir, { recursive: true });

    const badAnchor = `.cursor/skills/${skillName}/scripts/run.js`;
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), `Run ${badAnchor}\n`, "utf8");
    fs.writeFileSync(path.join(scriptsDir, "run.js"), `module.exports = "${badAnchor}";\n`, "utf8");
    fs.writeFileSync(path.join(scriptsDir, "helper.mjs"), `export const x = "${badAnchor}";\n`, "utf8");

    processSkillPortability(skillDir, skillName);

    assert(
      fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8").includes("./scripts/run.js"),
      "SKILL.md normalized"
    );
    assert(
      fs.readFileSync(path.join(scriptsDir, "run.js"), "utf8").includes("./scripts/run.js"),
      "run.js normalized"
    );
    assert(
      fs.readFileSync(path.join(scriptsDir, "helper.mjs"), "utf8").includes("./scripts/run.js"),
      "helper.mjs normalized"
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function testScanSkillForNonPortablePaths() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kenmark-portability-scan-"));
  try {
    const skillName = "scan-skill";
    const skillDir = path.join(tmp, skillName);
    const scriptsDir = path.join(skillDir, "scripts");
    fs.mkdirSync(scriptsDir, { recursive: true });

    fs.writeFileSync(path.join(skillDir, "SKILL.md"), "clean\n", "utf8");
    fs.writeFileSync(
      path.join(scriptsDir, "bad.js"),
      `require(".claude/skills/${skillName}/scripts/tool.js");\n`,
      "utf8"
    );

    const findings = scanSkillForNonPortablePaths(skillDir, skillName);
    assert(findings.length === 1, "scan finds non-portable script paths");
    assert(findings[0].relPath === path.join("scripts", "bad.js"), "scan reports script rel path");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  console.log("kenmark-skills portability test\n");
  testNormalizeAndDetect();
  console.log("  ✓ normalizeSkillPaths / findNonPortablePaths");
  testProcessSkillPortability();
  console.log("  ✓ processSkillPortability");
  testScanSkillForNonPortablePaths();
  console.log("  ✓ scanSkillForNonPortablePaths");
  console.log("\nOK — skill portability tests passed.");
}

main();
