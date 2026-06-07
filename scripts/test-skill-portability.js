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
  processSkillPortability,
  findCwdRelativeScriptInvocations,
  normalizeCwdRelativeScripts,
  summarizeAdoptResults,
  formatAdoptPassSummary
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

function testNormalizeCwdRelativeScripts() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kenmark-portability-cwd-"));
  try {
    const skillName = "impeccable";
    const skillDir = path.join(tmp, skillName);
    const scriptsDir = path.join(skillDir, "scripts");
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.writeFileSync(path.join(scriptsDir, "context.mjs"), "// context\n", "utf8");
    fs.writeFileSync(path.join(scriptsDir, "detect.mjs"), "// detect\n", "utf8");

    const input =
      "Run `node ./scripts/context.mjs` and `node ./scripts/detect.mjs --json src`";
    const expectedScript = fs.realpathSync.native
      ? fs.realpathSync.native(path.join(skillDir, "scripts", "context.mjs"))
      : fs.realpathSync(path.join(skillDir, "scripts", "context.mjs"));
    const expectedDetect = fs.realpathSync.native
      ? fs.realpathSync.native(path.join(skillDir, "scripts", "detect.mjs"))
      : fs.realpathSync(path.join(skillDir, "scripts", "detect.mjs"));
    const output = normalizeCwdRelativeScripts(input, skillDir);

    assert(output.includes(`node ${JSON.stringify(expectedScript)}`), "context path absolute");
    assert(
      output.includes(`node ${JSON.stringify(expectedDetect)} --json src`),
      "detect path absolute with args preserved"
    );
    assert(findCwdRelativeScriptInvocations(output).length === 0, "no cwd-relative left");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function testProcessSkillPortabilityCwdRelative() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kenmark-portability-cwd-process-"));
  try {
    const skillName = "impeccable";
    const skillDir = path.join(tmp, skillName);
    const scriptsDir = path.join(skillDir, "scripts");
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.writeFileSync(path.join(scriptsDir, "context.mjs"), "// context\n", "utf8");
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "Run `node ./scripts/context.mjs` once per session.\n",
      "utf8"
    );

    processSkillPortability(skillDir, skillName);

    const skillMd = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    const expected = fs.realpathSync.native
      ? fs.realpathSync.native(path.join(skillDir, "scripts", "context.mjs"))
      : fs.realpathSync(path.join(skillDir, "scripts", "context.mjs"));
    assert(skillMd.includes(`node ${JSON.stringify(expected)}`), "SKILL.md cwd-relative rewritten");
    const findings = scanSkillForNonPortablePaths(skillDir, skillName);
    assert(
      findings.filter((f) => f.kind === "cwd-relative-script").length === 0,
      "scan finds no cwd-relative script invocations after repair"
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function testAdoptRepairsStoreCurrent() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kenmark-portability-adopt-"));
  try {
    const skillName = "impeccable";
    const storeDir = path.join(tmp, ".kenmark", "store", "skills");
    const skillDir = path.join(storeDir, skillName);
    const scriptsDir = path.join(skillDir, "scripts");
    fs.mkdirSync(scriptsDir, { recursive: true });

    const badAnchor = `.agents/skills/${skillName}/scripts/context.mjs`;
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      `node ${badAnchor}\nRun \`node ./scripts/context.mjs\`.\n`,
      "utf8"
    );
    fs.writeFileSync(path.join(scriptsDir, "context.mjs"), `// ${badAnchor}\n`, "utf8");

    processSkillPortability(skillDir, skillName);

    const skillMd = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    const absScript = JSON.stringify(
      fs.realpathSync.native
        ? fs.realpathSync.native(path.join(skillDir, "scripts", "context.mjs"))
        : fs.realpathSync(path.join(skillDir, "scripts", "context.mjs"))
    );
    assert(
      (skillMd.match(new RegExp(`node ${absScript.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g")) || [])
        .length >= 2,
      "store-current adopt repair normalizes IDE anchors and cwd-relative scripts"
    );
    assert(
      scanSkillForNonPortablePaths(skillDir, skillName).length === 0,
      "store-current adopt repair leaves no non-portable paths"
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function testSummarizeAdoptResults() {
  const mixed = [
    { name: "a", action: "adopted" },
    { name: "b", action: "store-current" },
    { name: "c", action: "store-current" },
    { name: "d", action: "review-required" },
    { name: "e", action: "skip", reason: "no-source" }
  ];
  const counts = summarizeAdoptResults(mixed);
  assert(counts.adopted === 1, "summarizeAdoptResults counts adopted");
  assert(counts.portabilityRefreshed === 2, "summarizeAdoptResults counts portability-refreshed");
  assert(counts.reviewRequired === 1, "summarizeAdoptResults counts review-required");
  assert(counts.skipped === 1, "summarizeAdoptResults counts skipped");
  assert(counts.total === 5, "summarizeAdoptResults counts total");

  const summary = formatAdoptPassSummary(mixed);
  assert(
    summary.line ===
      "Adopt pass: 1 adopted, 2 portability-refreshed of 5 candidate(s) (1 skipped)",
    "formatAdoptPassSummary mixed actions"
  );

  const allRefresh = Array.from({ length: 39 }, (_, i) => ({
    name: `skill-${i}`,
    action: "store-current"
  }));
  const allRefreshSummary = formatAdoptPassSummary(allRefresh);
  assert(
    allRefreshSummary.line ===
      "Adopt pass: 0 adopted, 39 portability-refreshed of 39 candidate(s)",
    "formatAdoptPassSummary all store-current"
  );

  const dryRun = formatAdoptPassSummary(
    [{ name: "x", action: "would-adopt-to-store" }, { name: "y", action: "store-ok" }],
    { dryRun: true }
  );
  assert(
    dryRun.line === "Adopt pass: 1 would adopt, 1 would portability-refresh of 2 candidate(s)",
    "formatAdoptPassSummary dry-run labels"
  );
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
  testNormalizeCwdRelativeScripts();
  console.log("  ✓ normalizeCwdRelativeScripts");
  testProcessSkillPortabilityCwdRelative();
  console.log("  ✓ processSkillPortability cwd-relative rewrite");
  testAdoptRepairsStoreCurrent();
  console.log("  ✓ adopt store-current repair");
  testSummarizeAdoptResults();
  console.log("  ✓ summarizeAdoptResults / formatAdoptPassSummary");
  testScanSkillForNonPortablePaths();
  console.log("  ✓ scanSkillForNonPortablePaths");
  console.log("\nOK — skill portability tests passed.");
}

main();
