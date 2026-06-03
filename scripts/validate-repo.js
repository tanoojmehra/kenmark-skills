#!/usr/bin/env node

/**
 * Repo/package validation implementation for kenmark-skills.
 *
 * Entry points (same checks):
 * - `npm run validate` / `npm test` → this file
 * - `kenmark-skills validate` → `scripts/validate.js` → this file
 */

const fs = require("fs");
const path = require("path");
const {
  loadCatalog,
  getPack,
  resolveProfilePackRefs,
  listProfiles
} = require("./recommended-catalog");
const { LEGACY_SKILL_RENAMES } = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const userSkillsDir = path.join(repoRoot, "skills", "user-skills");
const catalogPath = path.join(userSkillsDir, "recommended-catalog.json");
const packageJsonPath = path.join(repoRoot, "package.json");

const REQUIRED_SKILL_FIELDS = [
  "name",
  "version",
  "category",
  "scope",
  "phase",
  "description",
  "triggers",
  "allowed-tools",
  "risk",
  "disable-model-invocation"
];

const VALID_SCOPES = new Set(["universal", "project-specific"]);
const VALID_CATEGORIES = new Set([
  "onboarding",
  "workflow",
  "git",
  "issues",
  "admin"
]);
const VALID_RISKS = new Set([
  "read-only",
  "write-files",
  "shell",
  "git-write",
  "destructive-possible"
]);

/** Literal phrases that must not appear in universal bundled content or the catalog. */
const FORBIDDEN_LITERALS = [
  "preamble-tier",
  "Kenmark-as-workflow"
];

/** Regex patterns for project-specific leakage (paths, legacy markers). */
const FORBIDDEN_PATTERNS = [
  { re: /\/Users\/[A-Za-z0-9_.-]+\//, label: "hardcoded macOS user path (/Users/.../)" },
  { re: /\\Users\\[A-Za-z0-9_.-]+\\/, label: "hardcoded Windows user path (\\Users\\...\\)" },
  { re: /C:\\Users\\[A-Za-z0-9_.-]+\\/i, label: "hardcoded Windows user path (C:\\Users\\...\\)" }
];

const REQUIRED_PACKAGE_SCRIPTS = [
  "init",
  "setup",
  "update",
  "adopt",
  "uninstall",
  "inventory",
  "subagents-inventory",
  "install-recommended",
  "doctor",
  "doctor:local",
  "check",
  "validate",
  "test",
  "pack:check"
];

const REQUIRED_PACKAGE_FILES = [
  "CHANGELOG.md",
  "skills/README.md",
  "skills/user-skills/**/*",
  "skills/user-skills/recommended-catalog.json",
  "config/mcp-servers.json",
  "config/mcp-profiles.json",
  "scripts/cli.js",
  "scripts/kenmark-hub.js",
  "scripts/recommended-catalog.js",
  "scripts/setup-skills.js",
  "scripts/doctor.js",
  "scripts/validate.js",
  "scripts/validate-repo.js",
  "scripts/kenmark-setup.js",
  "scripts/skills-inventory.js",
  "scripts/kenmark-packs.js",
  "scripts/kenmark-update.js",
  "scripts/skills-adopt.js",
  "scripts/subagents-inventory.js",
  "scripts/interactive.js"
];

/** Scripts spawned by scripts/cli.js — must exist on disk (regression guard for publish). */
const CLI_SPAWNED_SCRIPTS = [
  "scripts/kenmark-setup.js",
  "scripts/setup-skills.js",
  "scripts/kenmark-packs.js",
  "scripts/kenmark-update.js",
  "scripts/skills-adopt.js",
  "scripts/skills-inventory.js",
  "scripts/subagents-inventory.js",
  "scripts/validate.js",
  "scripts/doctor.js"
];

/** Paths scanned for forbidden literals/patterns. CHANGELOG is historical — excluded. */
const FORBIDDEN_SCAN_RELATIVE = [
  "README.md",
  "skills/README.md",
  "skills/user-skills",
  "scripts",
  "config"
];

const FORBIDDEN_SCAN_EXCLUDE_RELATIVE = new Set([
  "CHANGELOG.md",
  "scripts/validate-repo.js", // defines FORBIDDEN_* lists and path-pattern labels
  "scripts/kenmark-hub.js" // LEGACY_SKILL_RENAMES map and cleanup paths
]);

/** Former Kenmark skill ids — must not appear in user-facing docs (see findLegacySkillNameReferences). */
const LEGACY_SKILL_NAMES = Object.keys(LEGACY_SKILL_RENAMES);

const LEGACY_NAME_DOC_SCAN_RELATIVE = [
  "README.md",
  "skills/README.md",
  "skills/user-skills",
  "scripts",
  "config",
  "package.json"
];

const LEGACY_NAME_DOC_SCAN_EXCLUDE = new Set([
  ...FORBIDDEN_SCAN_EXCLUDE_RELATIVE,
  "skills/user-skills/recommended-catalog.json"
]);

const SETUP_INSTALL_SCRIPTS = ["scripts/setup-skills.js", "scripts/kenmark-hub.js"];

const FORBIDDEN_SCAN_EXTENSIONS = new Set([".md", ".json", ".js"]);

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

/** Direct children of skills/user-skills/ that contain SKILL.md (source of truth for bundled count). */
function listBundledSkillDirs() {
  if (!fs.existsSync(userSkillsDir)) {
    return [];
  }
  return fs
    .readdirSync(userSkillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) =>
      fs.existsSync(path.join(userSkillsDir, name, "SKILL.md"))
    )
    .sort();
}

function parseSkillCountFromText(text, re, label) {
  const match = text.match(re);
  if (!match) {
    return { error: `missing skill count (${label})` };
  }
  const n = Number.parseInt(match[1], 10);
  if (!Number.isFinite(n) || n < 1) {
    return { error: `invalid skill count (${label}): "${match[1]}"` };
  }
  return { count: n };
}

/**
 * Documented Kenmark bundled skill counts must match dirs with SKILL.md.
 * Patterns extract the number so adding skill #24 only requires updating copy once.
 */
const SKILL_COUNT_DOC_CHECKS = [
  {
    file: "package.json",
    label: 'description "N universal Kenmark"',
    getText: () => {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      return String(pkg.description || "");
    },
    re: /(\d+)\s+universal\s+Kenmark/i
  },
  {
    file: "README.md",
    label: "intro **N first-party skills**",
    getText: () => fs.readFileSync(path.join(repoRoot, "README.md"), "utf8"),
    re: /\*\*(\d+)\s+first-party skills\*\*/i
  },
  {
    file: "README.md",
    label: "skills table | Kenmark skills | N |",
    getText: () => fs.readFileSync(path.join(repoRoot, "README.md"), "utf8"),
    re: /\|\s*Kenmark skills\s*\|\s*(\d+)\s*\|/i
  },
  {
    file: "README.md",
    label: "commands table Install N Kenmark skills",
    getText: () => fs.readFileSync(path.join(repoRoot, "README.md"), "utf8"),
    re: /Install\s+(\d+)\s+Kenmark skills/i
  },
  {
    file: "README.md",
    label: "init vs setup table | N Kenmark skills |",
    getText: () => fs.readFileSync(path.join(repoRoot, "README.md"), "utf8"),
    re: /\|\s*(\d+)\s+Kenmark skills\s*\|/i
  },
  {
    file: "README.md",
    label: "repo tree # N universal skills",
    getText: () => fs.readFileSync(path.join(repoRoot, "README.md"), "utf8"),
    re: /#\s*(\d+)\s+universal skills/i
  },
  {
    file: "skills/README.md",
    label: "bundled universal skills (N)",
    getText: () =>
      fs.readFileSync(path.join(repoRoot, "skills", "README.md"), "utf8"),
    re: /bundled universal skills\s*\((\d+)\)/i
  }
];

function validateSkillCountConsistency() {
  const actual = listBundledSkillDirs();
  const actualCount = actual.length;

  if (actualCount === 0) {
    fail(
      "skill count: no bundled skills (skills/user-skills/*/SKILL.md); run validateSkills for details"
    );
    return;
  }

  const declaredByFile = new Map();

  for (const check of SKILL_COUNT_DOC_CHECKS) {
    let text;
    try {
      text = check.getText();
    } catch (err) {
      fail(`${check.file}: unreadable for skill count (${err.message})`);
      continue;
    }

    const parsed = parseSkillCountFromText(text, check.re, check.label);
    if (parsed.error) {
      fail(`${check.file}: ${parsed.error}`);
      continue;
    }

    if (parsed.count !== actualCount) {
      fail(
        `${check.file}: ${check.label} says ${parsed.count} but skills/user-skills has ${actualCount} SKILL.md dirs (${actual.join(", ")})`
      );
    }

    const prev = declaredByFile.get(check.file);
    if (prev !== undefined && prev !== parsed.count) {
      fail(
        `${check.file}: inconsistent documented skill counts (${prev} vs ${parsed.count})`
      );
    }
    declaredByFile.set(check.file, parsed.count);
  }

  console.log(
    `  ✓ skill count ${actualCount} — package.json, README.md, skills/README.md match skills/user-skills/*/SKILL.md`
  );
}

function unquoteScalar(raw) {
  const value = String(raw || "").trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function splitFrontmatter(content) {
  if (!content.startsWith("---")) {
    return { error: "missing opening ---" };
  }
  const end = content.indexOf("\n---", 3);
  if (end === -1) {
    return { error: "unclosed frontmatter (no closing ---)" };
  }
  return { block: content.slice(3, end) };
}

/**
 * Parse scalar and list fields from a YAML frontmatter block.
 */
function parseFrontmatterBlock(block) {
  const fields = {};
  let currentListKey = null;
  let listItems = [];

  function flushList() {
    if (currentListKey && listItems.length) {
      fields[currentListKey] = listItems;
    }
    currentListKey = null;
    listItems = [];
  }

  for (const line of block.split(/\r?\n/)) {
    const keyMatch = line.match(/^([\w-]+):\s*(.*)$/);
    if (keyMatch) {
      flushList();
      const key = keyMatch[1];
      const rest = keyMatch[2].trim();
      if (rest === "") {
        currentListKey = key;
        fields[key] = [];
        continue;
      }
      fields[key] = unquoteScalar(rest);
      continue;
    }
    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && currentListKey) {
      listItems.push(unquoteScalar(listMatch[1].trim()));
      fields[currentListKey] = listItems;
      continue;
    }
    if (line.trim() !== "" && !line.match(/^\s+#/)) {
      flushList();
    }
  }
  flushList();
  return fields;
}

function validateSkillFrontmatter(skillDir, skillMdPath) {
  const rel = path.relative(repoRoot, skillMdPath);
  let content;
  try {
    content = fs.readFileSync(skillMdPath, "utf8");
  } catch (err) {
    fail(`${rel}: unreadable (${err.message})`);
    return;
  }

  const { block, error } = splitFrontmatter(content);
  if (error) {
    fail(`${rel}: ${error}`);
    return;
  }

  const fm = parseFrontmatterBlock(block);

  for (const field of REQUIRED_SKILL_FIELDS) {
    if (fm[field] === undefined || fm[field] === "") {
      fail(`${rel}: missing required frontmatter field "${field}"`);
    }
  }

  if (Array.isArray(fm.triggers) && fm.triggers.length === 0) {
    fail(`${rel}: "triggers" must have at least one entry`);
  }
  if (Array.isArray(fm["allowed-tools"]) && fm["allowed-tools"].length === 0) {
    fail(`${rel}: "allowed-tools" must have at least one entry`);
  }

  const scope = String(fm.scope || "").trim();
  if (!VALID_SCOPES.has(scope)) {
    fail(
      `${rel}: invalid scope "${scope}" (expected universal or project-specific)`
    );
  } else if (scope !== "universal") {
    fail(
      `${rel}: bundled package skills must use scope: universal (found ${scope})`
    );
  }

  const category = String(fm.category || "").trim();
  if (!VALID_CATEGORIES.has(category)) {
    fail(
      `${rel}: invalid category "${category}" (expected one of ${[...VALID_CATEGORIES].join(", ")})`
    );
  }

  const risk = String(fm.risk || "").trim();
  if (!VALID_RISKS.has(risk)) {
    fail(
      `${rel}: invalid risk "${risk}" (expected one of ${[...VALID_RISKS].join(", ")})`
    );
  }

  const name = String(fm.name || "").trim();
  if (!skillDir.startsWith("kenmark-")) {
    fail(`${rel}: bundled skill directory must start with "kenmark-"`);
  }
  if (name && !name.startsWith("kenmark-")) {
    fail(`${rel}: bundled skill frontmatter name must start with "kenmark-"`);
  }
  if (name && name !== skillDir) {
    fail(`${rel}: frontmatter name "${name}" does not match directory "${skillDir}"`);
  }

  if (scope === "project-specific" && !fm.project) {
    warn(`${rel}: scope is project-specific but "project" is not set`);
  }
}

function validateSkills() {
  if (!fs.existsSync(userSkillsDir)) {
    fail("skills/user-skills/ directory missing");
    return;
  }

  const entries = fs.readdirSync(userSkillsDir, { withFileTypes: true });
  const allDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const skillDirs = listBundledSkillDirs();

  if (skillDirs.length === 0) {
    fail("no skill directories with SKILL.md under skills/user-skills/");
  }

  for (const skillDir of allDirs.sort()) {
    if (!skillDir.startsWith("kenmark-")) {
      fail(
        `skills/user-skills/${skillDir}/: active first-party skill folder must start with "kenmark-"`
      );
    }
    if (!skillDirs.includes(skillDir)) {
      fail(`skills/user-skills/${skillDir}/SKILL.md missing`);
    }
  }

  for (const skillDir of skillDirs) {
    validateSkillFrontmatter(
      skillDir,
      path.join(userSkillsDir, skillDir, "SKILL.md")
    );
  }
}

function packHasInstallMetadata(pack) {
  const inst = pack.install;
  if (!inst || typeof inst !== "object") {
    return false;
  }

  const strategy = pack.installStrategy || inst.strategy;
  if (strategy === "git-sync") {
    return Boolean(
      inst.repoUrl &&
        inst.global &&
        typeof inst.global.target === "string" &&
        inst.project &&
        typeof inst.project.target === "string"
    );
  }

  if (strategy === "manual") {
    function manualScopeOk(block) {
      if (!block || typeof block !== "object") return false;
      return block.manual === true;
    }
    return manualScopeOk(inst.global) && manualScopeOk(inst.project);
  }

  function scopeOk(block) {
    if (!block || typeof block !== "object") return false;
    return (
      typeof block.command === "string" ||
      typeof block.target === "string"
    );
  }

  return scopeOk(inst.global) && scopeOk(inst.project);
}

function validateCatalog() {
  let catalog;
  try {
    catalog = loadCatalog();
  } catch (err) {
    fail(`recommended-catalog.json: invalid JSON (${err.message})`);
    return;
  }

  if (!catalog || typeof catalog !== "object") {
    fail("recommended-catalog.json: root must be an object");
    return;
  }

  if (typeof catalog.version !== "number" || catalog.version < 1) {
    fail("recommended-catalog.json: \"version\" must be a positive number");
  }

  const packs = catalog.packs;
  if (!Array.isArray(packs) || packs.length === 0) {
    fail("recommended-catalog.json: \"packs\" must be a non-empty array");
    return;
  }

  const packIds = new Set();
  for (const pack of packs) {
    if (!pack || typeof pack.id !== "string" || !pack.id.trim()) {
      fail("recommended-catalog.json: every pack needs a non-empty \"id\"");
      continue;
    }
    if (packIds.has(pack.id)) {
      fail(`recommended-catalog.json: duplicate pack id "${pack.id}"`);
    }
    packIds.add(pack.id);
    if (!packHasInstallMetadata(pack)) {
      fail(
        `recommended-catalog.json: pack "${pack.id}" missing install metadata (global+project command/target, manual scopes, or git-sync repoUrl+targets)`
      );
    }
    const strategy = pack.installStrategy || pack.install?.strategy;
    if (strategy === "manual") {
      for (const scope of ["global", "project"]) {
        if (pack.install?.[scope]?.command) {
          fail(
            `recommended-catalog.json: pack "${pack.id}" installStrategy is manual but install.${scope}.command is set`
          );
        }
      }
    }
  }

  const profiles = catalog.profiles;
  if (!Array.isArray(profiles) || profiles.length === 0) {
    fail("recommended-catalog.json: \"profiles\" must be a non-empty array");
    return;
  }

  const profileIds = new Set();
  let defaultCount = 0;
  for (const profile of profiles) {
    if (!profile || typeof profile.id !== "string" || !profile.id.trim()) {
      fail("recommended-catalog.json: every profile needs a non-empty \"id\"");
      continue;
    }
    if (profileIds.has(profile.id)) {
      fail(`recommended-catalog.json: duplicate profile id "${profile.id}"`);
    }
    profileIds.add(profile.id);
    if (profile.default) defaultCount += 1;

    const refs = resolveProfilePackRefs(profile.id, catalog);
    if (!refs) {
      fail(
        `recommended-catalog.json: profile "${profile.id}" could not be resolved (check "extends" chain)`
      );
      continue;
    }
    if (!Array.isArray(profile.packs) && !profile.extends) {
      fail(
        `recommended-catalog.json: profile "${profile.id}" has no packs and no extends`
      );
    }
    for (const ref of refs) {
      if (!getPack(catalog, ref.id)) {
        fail(
          `recommended-catalog.json: profile "${profile.id}" references unknown pack id "${ref.id}"`
        );
      }
    }
  }

  if (defaultCount !== 1) {
    fail(
      `recommended-catalog.json: expected exactly one profile with default: true (found ${defaultCount})`
    );
  }

  const defaultProfile = catalog.defaults?.profile;
  if (defaultProfile && !profileIds.has(defaultProfile)) {
    fail(
      `recommended-catalog.json: defaults.profile "${defaultProfile}" does not match any profile id`
    );
  }

  const listed = listProfiles(catalog).map((p) => p.id);
  for (const id of listed) {
    if (!profileIds.has(id)) {
      fail(`recommended-catalog.json: listProfiles returned unknown id "${id}"`);
    }
  }
}

/** kenmark-init must document the numbered KB scaffold (regression guard). */
const INIT_BRAIN_KB_MARKERS = [
  "brain/kb",
  "00-project-overview.md",
  "Step 1.5",
  "Brain KB maintenance",
  "KB update requirement"
];

const COMMIT_PUSH_KB_MARKERS = ["Brain KB check before commit", "brain/kb/"];

function validateInitBrainKb() {
  const initBrainPath = path.join(userSkillsDir, "kenmark-init", "SKILL.md");
  if (!fs.existsSync(initBrainPath)) {
    fail("skills/user-skills/kenmark-init/SKILL.md missing (KB validation skipped)");
    return;
  }
  let text;
  try {
    text = fs.readFileSync(initBrainPath, "utf8");
  } catch (err) {
    fail(`kenmark-init/SKILL.md: unreadable (${err.message})`);
    return;
  }
  for (const marker of INIT_BRAIN_KB_MARKERS) {
    if (!text.includes(marker)) {
      fail(`kenmark-init/SKILL.md: missing required KB marker "${marker}"`);
    }
  }

  const commitPushPath = path.join(userSkillsDir, "kenmark-commit", "SKILL.md");
  if (!fs.existsSync(commitPushPath)) {
    fail("skills/user-skills/kenmark-commit/SKILL.md missing (KB validation skipped)");
    return;
  }
  try {
    text = fs.readFileSync(commitPushPath, "utf8");
  } catch (err) {
    fail(`kenmark-commit/SKILL.md: unreadable (${err.message})`);
    return;
  }
  for (const marker of COMMIT_PUSH_KB_MARKERS) {
    if (!text.includes(marker)) {
      fail(`kenmark-commit/SKILL.md: missing required KB marker "${marker}"`);
    }
  }
}

function validatePackageJson() {
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch (err) {
    fail(`package.json: unreadable (${err.message})`);
    return;
  }

  const scripts = pkg.scripts || {};
  for (const name of REQUIRED_PACKAGE_SCRIPTS) {
    if (typeof scripts[name] !== "string" || !scripts[name].trim()) {
      fail(`package.json: missing or empty scripts.${name}`);
    }
  }

  if (scripts.validate !== "node scripts/validate-repo.js") {
    fail('package.json: scripts.validate must be "node scripts/validate-repo.js"');
  }
  if (scripts.test !== "node scripts/validate-repo.js") {
    fail('package.json: scripts.test must be "node scripts/validate-repo.js"');
  }
  if (scripts["doctor:local"] !== "node scripts/cli.js doctor") {
    fail('package.json: scripts["doctor:local"] must be "node scripts/cli.js doctor"');
  }

  const cliPath = path.join(repoRoot, "scripts", "cli.js");
  let cliSrc = "";
  try {
    cliSrc = fs.readFileSync(cliPath, "utf8");
  } catch (err) {
    fail(`scripts/cli.js: unreadable (${err.message})`);
  }
  if (!cliSrc.includes('command === "validate"')) {
    fail('scripts/cli.js must register the "validate" command');
  }
  if (!cliSrc.includes('"validate.js"')) {
    fail('scripts/cli.js validate must spawn scripts/validate.js (not validate-repo.js directly)');
  }

  const files = pkg.files || [];
  for (const entry of REQUIRED_PACKAGE_FILES) {
    if (!files.includes(entry)) {
      fail(`package.json: files must include "${entry}"`);
    }

    const abs = path.join(repoRoot, entry);
    if (!entry.includes("*") && !fs.existsSync(abs)) {
      fail(`package.json: files includes missing path "${entry}"`);
    }
  }

  for (const rel of CLI_SPAWNED_SCRIPTS) {
    if (!fs.existsSync(path.join(repoRoot, rel))) {
      fail(`scripts/cli.js references missing script: ${rel}`);
    }
  }

  const bin = pkg.bin || {};
  if (bin["kenmark-skills"] !== "scripts/cli.js") {
    fail('package.json: bin["kenmark-skills"] must point to scripts/cli.js');
  }

  const engines = pkg.engines || {};
  if (!engines.node || !String(engines.node).includes("18")) {
    fail('package.json: engines.node must require >=18');
  }

  for (const rel of ["config/mcp-servers.json", "config/mcp-profiles.json"]) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) {
      fail(`missing required config file: ${rel}`);
    }
  }
}

function collectFilesRecursive(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursive(abs, acc);
    } else if (entry.isFile()) {
      acc.push(abs);
    }
  }
  return acc;
}

function stripInitBrainMarkerSyntax(text) {
  return text
    .replace(/<!--\s*init-brain:[\s\S]*?-->/g, "")
    .replace(/init-brain:(START|END)/g, "")
    .replace(/`init-brain`/g, "");
}

function textReferencesLegacyInitBrainSkill(text) {
  return (
    /user-skills\/init-brain\b/i.test(text) ||
    /skills\/init-brain\b/i.test(text) ||
    /\brun\s+init-brain\b/i.test(text) ||
    /\/init-brain\b/.test(text)
  );
}

function textReferencesLegacyTroubleshootSkill(text) {
  return (
    /user-skills\/troubleshoot\b/i.test(text) ||
    /skills\/troubleshoot\b/i.test(text) ||
    /`troubleshoot`/i.test(text) ||
    /\/troubleshoot\b/.test(text)
  );
}

/** Legacy skill id appears without the kenmark- namespace prefix. */
function textReferencesUnprefixedLegacySkill(text, legacyName) {
  const escaped = legacyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<!kenmark-)${escaped}`).test(text);
}

function findLegacySkillNameReferences() {
  const filesToScan = new Set();

  for (const rel of LEGACY_NAME_DOC_SCAN_RELATIVE) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) {
      for (const f of collectFilesRecursive(abs)) {
        filesToScan.add(f);
      }
    } else {
      filesToScan.add(abs);
    }
  }

  for (const abs of filesToScan) {
    const rel = path.relative(repoRoot, abs);
    if (LEGACY_NAME_DOC_SCAN_EXCLUDE.has(rel)) continue;
    if (!FORBIDDEN_SCAN_EXTENSIONS.has(path.extname(abs))) continue;

    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    for (const legacyName of LEGACY_SKILL_NAMES) {
      if (legacyName === "init-brain") {
        const checkText =
          rel === path.join("skills", "user-skills", "kenmark-init", "SKILL.md")
            ? stripInitBrainMarkerSyntax(text)
            : text;
        if (textReferencesLegacyInitBrainSkill(checkText)) {
          fail(
            `${rel}: references legacy skill name "init-brain" (use kenmark-init)`
          );
        }
        continue;
      }

      if (legacyName === "troubleshoot") {
        if (textReferencesLegacyTroubleshootSkill(text)) {
          fail(
            `${rel}: references legacy skill name "troubleshoot" (use kenmark-troubleshoot)`
          );
        }
        continue;
      }

      if (textReferencesUnprefixedLegacySkill(text, legacyName)) {
        fail(
          `${rel}: references legacy skill name "${legacyName}" (use ${LEGACY_SKILL_RENAMES[legacyName]})`
        );
      }
    }
  }
}

function validateClaudeWrapperPolicy() {
  const setupPath = path.join(repoRoot, "scripts", "setup-skills.js");
  let setupSrc = "";
  try {
    setupSrc = fs.readFileSync(setupPath, "utf8");
  } catch (err) {
    fail(`scripts/setup-skills.js: unreadable (${err.message})`);
    return;
  }

  if (!setupSrc.includes("installKenmarkSkillsToStoreWithLegacyCleanup")) {
    fail(
      "scripts/setup-skills.js: must install Kenmark skills via installKenmarkSkillsToStoreWithLegacyCleanup (removes legacy paths and Claude wrappers)"
    );
  }
  if (
    /createKenmarkClaudeCommand|writeClaudeCommandWrapper|syncClaudeCommandWrappers/i.test(
      setupSrc
    )
  ) {
    fail(
      "scripts/setup-skills.js: must not create Claude slash-command wrappers (use kenmark-* skills under ~/.claude/skills/)"
    );
  }

  const hubPath = path.join(repoRoot, "scripts", "kenmark-hub.js");
  let hubSrc = "";
  try {
    hubSrc = fs.readFileSync(hubPath, "utf8");
  } catch (err) {
    fail(`scripts/kenmark-hub.js: unreadable (${err.message})`);
    return;
  }

  const wrapperFn = hubSrc.match(
    /function removeKenmarkClaudeCommandWrappers\([\s\S]*?\n\}/
  );
  if (!wrapperFn) {
    fail("scripts/kenmark-hub.js: removeKenmarkClaudeCommandWrappers missing");
    return;
  }
  if (wrapperFn[0].includes("writeFileSync")) {
    fail(
      "scripts/kenmark-hub.js: removeKenmarkClaudeCommandWrappers must only remove wrappers, not write ~/.claude/commands/*.md"
    );
  }
  if (/function createKenmarkClaudeCommand/i.test(hubSrc)) {
    fail(
      "scripts/kenmark-hub.js: must not define Claude slash-command wrapper generators"
    );
  }

  const legacyFn = hubSrc.match(
    /function removeLegacyKenmarkInstalls\([\s\S]*?\n\}/
  );
  if (!legacyFn) {
    fail("scripts/kenmark-hub.js: removeLegacyKenmarkInstalls missing");
    return;
  }
  if (!legacyFn[0].includes("collectKenmarkLegacyOwnershipProofs")) {
    fail(
      "scripts/kenmark-hub.js: removeLegacyKenmarkInstalls must verify Kenmark ownership before deleting legacy paths"
    );
  }
  if (!legacyFn[0].includes("legacy-candidate-review-required")) {
    fail(
      "scripts/kenmark-hub.js: removeLegacyKenmarkInstalls must skip unproven legacy paths (legacy-candidate-review-required)"
    );
  }
  if (!hubSrc.includes("backupLegacyCleanupPath") || !hubSrc.includes('"legacy-cleanup"')) {
    fail(
      "scripts/kenmark-hub.js: legacy cleanup must back up proven removals under ~/.kenmark/backups/legacy-cleanup/"
    );
  }
  if (!wrapperFn[0].includes("collectKenmarkCommandOwnershipProofs")) {
    fail(
      "scripts/kenmark-hub.js: removeKenmarkClaudeCommandWrappers must verify ownership before deleting command files"
    );
  }
  if (!wrapperFn[0].includes("legacy-candidate-review-required")) {
    fail(
      "scripts/kenmark-hub.js: removeKenmarkClaudeCommandWrappers must skip unproven command files (legacy-candidate-review-required)"
    );
  }

  for (const rel of SETUP_INSTALL_SCRIPTS) {
    const abs = path.join(repoRoot, rel);
    let src = "";
    try {
      src = fs.readFileSync(abs, "utf8");
    } catch (err) {
      fail(`${rel}: unreadable (${err.message})`);
      continue;
    }
    if (/writeFileSync\s*\([^)]*["']commands["']|writeFileSync\s*\([^)]*\/commands\//.test(src)) {
      fail(
        `${rel}: must not write Kenmark slash-command wrappers under ~/.claude/commands/`
      );
    }
  }

  console.log(
    "  ✓ namespace — bundled skills kenmark-*; setup removes Claude command wrappers (none generated)"
  );
}

function findForbiddenTerms() {
  const filesToScan = new Set();

  for (const rel of FORBIDDEN_SCAN_RELATIVE) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) {
      for (const f of collectFilesRecursive(abs)) {
        filesToScan.add(f);
      }
    } else {
      filesToScan.add(abs);
    }
  }

  for (const abs of filesToScan) {
    const rel = path.relative(repoRoot, abs);
    if (FORBIDDEN_SCAN_EXCLUDE_RELATIVE.has(rel)) continue;
    if (!FORBIDDEN_SCAN_EXTENSIONS.has(path.extname(abs))) continue;

    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    if (abs.endsWith("SKILL.md")) {
      const { block } = splitFrontmatter(text);
      if (block) {
        const fm = parseFrontmatterBlock(block);
        if (fm.scope && fm.scope !== "universal") {
          continue;
        }
      }
    }

    for (const literal of FORBIDDEN_LITERALS) {
      if (text.includes(literal)) {
        fail(`${rel}: forbidden project-specific term "${literal}"`);
      }
    }
    for (const { re, label } of FORBIDDEN_PATTERNS) {
      const match = text.match(re);
      if (match) {
        fail(`${rel}: forbidden pattern (${label}): ${match[0]}`);
      }
    }
  }
}

function main() {
  console.log("kenmark-skills validate — checking repo invariants\n");

  validateSkills();
  validateSkillCountConsistency();
  validateCatalog();
  validateInitBrainKb();
  validatePackageJson();
  validateClaudeWrapperPolicy();
  findLegacySkillNameReferences();
  findForbiddenTerms();

  if (warnings.length) {
    console.log("Warnings:");
    for (const w of warnings) {
      console.log(`  ⚠ ${w}`);
    }
    console.log("");
  }

  if (errors.length) {
    console.error("Validation failed:\n");
    for (const e of errors) {
      console.error(`  ✗ ${e}`);
    }
    console.error(`\n${errors.length} error(s).`);
    process.exit(1);
  }

  console.log("OK — all validation checks passed.");
  if (warnings.length) {
    console.log(`(${warnings.length} warning(s))`);
  }
}

main();
