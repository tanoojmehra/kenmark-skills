#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const DEFAULT_AGENT_IDES = ["cursor", "claude", "codex"];

const VENDORED_PREFIXES = [
  "gstack/",
  ".cursor/skills/gstack",
  ".factory/skills/gstack",
  ".agents/skills/gstack",
  ".gbrain/skills/gstack",
  ".hermes/skills/gstack",
  ".kiro/skills/gstack",
  ".openclaw/skills/gstack",
  ".opencode/skills/gstack",
  ".slate/skills/gstack",
  "plugins/cache/"
];

const AGENT_VENDORED_PREFIXES = [
  "gstack/",
  ".cursor/agents/gstack",
  ".factory/agents/gstack",
  ".agents/agents/gstack",
  ".gbrain/agents/gstack",
  ".hermes/agents/gstack",
  ".kiro/agents/gstack",
  ".openclaw/agents/gstack",
  ".opencode/agents/gstack",
  ".slate/agents/gstack",
  "plugins/cache/",
  "plugins/marketplaces/"
];

const IDE_SCAN_PRIORITY = [
  "agents",
  "cursor",
  "claude",
  "gemini",
  "codex",
  "opencode",
  "minimax",
  "kiro",
  "trae",
  "trae-cn",
  "rovo",
  "qoder"
];
const AGENT_IDE_SCAN_PRIORITY = [
  "claude",
  "cursor",
  "agents",
  "gemini",
  "codex",
  "opencode",
  "minimax",
  "kiro",
  "trae",
  "trae-cn",
  "rovo",
  "qoder"
];

function getKenmarkHome() {
  return path.join(os.homedir(), ".kenmark");
}

function getStoreDir() {
  return path.join(getKenmarkHome(), "store", "skills");
}

function getMcpStorePath() {
  return path.join(getKenmarkHome(), "store", "mcp.json");
}

function getBundledMcpPath(repoRoot) {
  return path.join(repoRoot, "config", "mcp-servers.json");
}

function getMcpProfilesPath(repoRoot) {
  return path.join(repoRoot, "config", "mcp-profiles.json");
}

function readMcpProfiles(repoRoot) {
  const profilesPath = getMcpProfilesPath(repoRoot);
  if (!fs.existsSync(profilesPath)) {
    return { profiles: { none: [], all: [] } };
  }
  try {
    const doc = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
    if (!doc.profiles || typeof doc.profiles !== "object") {
      return { profiles: { none: [], all: [] } };
    }
    return doc;
  } catch {
    return { profiles: { none: [], all: [] } };
  }
}

function listMcpProfileNames(repoRoot) {
  return Object.keys(readMcpProfiles(repoRoot).profiles).sort();
}

const MCP_PROFILE_DESCRIPTIONS = {
  none: "Skip — no MCP install or change",
  web: "Browser automation for UI testing and browsing",
  research: "Docs lookup and web fetch for library/API research",
  deep: "Reasoning plus research tools for complex investigation",
  all: "Every bundled MCP server"
};

const MCP_SERVER_DESCRIPTIONS = {
  playwright: "Browser automation",
  context7: "Library docs",
  "sequential-thinking": "Step-by-step reasoning",
  fetch: "Fetch URLs as markdown",
  browsermcp: "Browser MCP bridge"
};

function listMcpProfilesForPrompt(repoRoot) {
  const { profiles } = readMcpProfiles(repoRoot);
  return Object.keys(profiles)
    .sort((a, b) => {
      if (a === "none") return -1;
      if (b === "none") return 1;
      return a.localeCompare(b);
    })
    .map((id) => ({
      id,
      description: MCP_PROFILE_DESCRIPTIONS[id] || id,
      servers: profiles[id] || []
    }));
}

function resolveMcpProfileName(rawProfile, repoRoot) {
  const name = String(rawProfile || "none")
    .trim()
    .toLowerCase();
  const profiles = readMcpProfiles(repoRoot).profiles;
  if (!Object.prototype.hasOwnProperty.call(profiles, name)) {
    const known = Object.keys(profiles).sort().join(", ");
    throw new Error(`Unknown MCP profile "${rawProfile}". Known profiles: ${known}`);
  }
  return name;
}

function filterMcpDocumentByServers(bundledDoc, serverNames) {
  const incoming = bundledDoc.mcpServers || {};
  const filtered = {};
  const missing = [];
  for (const name of serverNames) {
    if (incoming[name]) {
      filtered[name] = incoming[name];
    } else {
      missing.push(name);
    }
  }
  if (missing.length) {
    throw new Error(
      `MCP profile references missing bundled server(s): ${missing.join(", ")}`
    );
  }
  return { mcpServers: filtered };
}

function buildMcpDocumentForProfile(repoRoot, profileName) {
  const profile = resolveMcpProfileName(profileName, repoRoot);
  const serverNames = readMcpProfiles(repoRoot).profiles[profile] || [];
  if (!serverNames.length) {
    return { profile, serverNames: [], doc: { mcpServers: {} } };
  }
  const bundledPath = getBundledMcpPath(repoRoot);
  const bundled = readMcpDocument(bundledPath);
  const doc = filterMcpDocumentByServers(bundled, serverNames);
  return { profile, serverNames: Object.keys(doc.mcpServers).sort(), doc };
}

function listBundledMcpServerNames(repoRoot) {
  const bundled = readMcpDocument(getBundledMcpPath(repoRoot));
  return Object.keys(bundled.mcpServers || {}).sort();
}

function listMcpServersForPrompt(repoRoot) {
  return listBundledMcpServerNames(repoRoot).map((id) => ({
    id,
    description: MCP_SERVER_DESCRIPTIONS[id] || id
  }));
}

function parseMcpServersArg(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveMcpServerNames(rawServers, repoRoot) {
  const names = parseMcpServersArg(rawServers);
  if (!names.length) return [];
  const bundled = readMcpDocument(getBundledMcpPath(repoRoot));
  const known = Object.keys(bundled.mcpServers || {});
  const invalid = names.filter((name) => !known.includes(name));
  if (invalid.length) {
    throw new Error(
      `Unknown MCP server(s): ${invalid.join(", ")}. Known servers: ${known.join(", ")}`
    );
  }
  return [...names].sort();
}

function buildMcpDocumentForServers(repoRoot, serverNames) {
  const resolved = resolveMcpServerNames(serverNames, repoRoot);
  if (!resolved.length) {
    return { serverNames: [], doc: { mcpServers: {} } };
  }
  const bundled = readMcpDocument(getBundledMcpPath(repoRoot));
  const doc = filterMcpDocumentByServers(bundled, resolved);
  return { serverNames: Object.keys(doc.mcpServers).sort(), doc };
}

function formatMcpPlanLine(serverNames, targetLabel = "Cursor / Claude") {
  const list = serverNames.length ? serverNames.join(", ") : "none";
  return `MCP servers (${list}) → ${targetLabel}`;
}

function resolveMcpInstall({ skipMcp, withMcp, mcpProfile, mcpServers, repoRoot }) {
  if (skipMcp) {
    return { enabled: false, serverNames: [], profile: null };
  }
  const serversFromArg = parseMcpServersArg(mcpServers);
  if (serversFromArg.length) {
    const serverNames = resolveMcpServerNames(serversFromArg, repoRoot);
    return { enabled: serverNames.length > 0, serverNames, profile: null };
  }
  if (mcpProfile) {
    const profile = String(mcpProfile).trim().toLowerCase();
    if (profile === "none") {
      return { enabled: false, serverNames: [], profile: "none" };
    }
    const { profile: resolved, serverNames } = buildMcpDocumentForProfile(repoRoot, profile);
    return { enabled: serverNames.length > 0, serverNames, profile: resolved };
  }
  if (withMcp) {
    const { serverNames } = buildMcpDocumentForProfile(repoRoot, "all");
    return { enabled: serverNames.length > 0, serverNames, profile: "all" };
  }
  return { enabled: false, serverNames: [], profile: null };
}

function shouldInstallMcp({ skipMcp, withMcp, mcpProfile, mcpServers, repoRoot }) {
  const resolved = resolveMcpInstall({ skipMcp, withMcp, mcpProfile, mcpServers, repoRoot });
  return {
    enabled: resolved.enabled,
    profile: resolved.profile || (resolved.enabled ? null : "none"),
    serverNames: resolved.serverNames
  };
}

function buildMcpGlobalTargets(homeDir = os.homedir()) {
  return {
    cursor: path.join(homeDir, ".cursor", "mcp.json"),
    claude: path.join(homeDir, ".claude.json")
  };
}

function buildMcpProjectTargets(projectDir = process.cwd()) {
  return {
    cursor: path.join(projectDir, ".cursor", "mcp.json"),
    claude: path.join(projectDir, ".mcp.json")
  };
}

function getAgentStoreDir() {
  return path.join(getKenmarkHome(), "store", "agents");
}

function getManifestPath() {
  return path.join(getKenmarkHome(), "manifest.json");
}

function getAgentManifestPath() {
  return path.join(getKenmarkHome(), "agent-manifest.json");
}

function buildGlobalTargets(homeDir = os.homedir()) {
  return {
    cursor: path.join(homeDir, ".cursor", "skills"),
    codex: path.join(homeDir, ".agents", "skills"),
    claude: path.join(homeDir, ".claude", "skills"),
    gemini: path.join(homeDir, ".gemini", "skills"),
    opencode: path.join(homeDir, ".opencode", "skills"),
    kiro: path.join(homeDir, ".kiro", "skills"),
    trae: path.join(homeDir, ".trae", "skills"),
    "trae-cn": path.join(homeDir, ".trae-cn", "skills"),
    rovo: path.join(homeDir, ".rovodev", "skills"),
    qoder: path.join(homeDir, ".qoder", "skills"),
    minimax: path.join(homeDir, ".minimax", "skills")
  };
}

function buildProjectTargets(projectDir = process.cwd()) {
  return {
    cursor: path.join(projectDir, ".cursor", "skills"),
    codex: path.join(projectDir, ".agents", "skills"),
    claude: path.join(projectDir, ".claude", "skills"),
    gemini: path.join(projectDir, ".gemini", "skills"),
    opencode: path.join(projectDir, ".opencode", "skills"),
    kiro: path.join(projectDir, ".kiro", "skills"),
    trae: path.join(projectDir, ".trae", "skills"),
    "trae-cn": path.join(projectDir, ".trae-cn", "skills"),
    rovo: path.join(projectDir, ".rovodev", "skills"),
    qoder: path.join(projectDir, ".qoder", "skills"),
    minimax: path.join(projectDir, ".minimax", "skills")
  };
}

function buildInventoryRoots(homeDir = os.homedir()) {
  return [
    { id: "kenmark-store", path: path.join(homeDir, ".kenmark", "store", "skills") },
    { id: "agents", path: path.join(homeDir, ".agents", "skills") },
    { id: "cursor", path: path.join(homeDir, ".cursor", "skills") },
    { id: "claude", path: path.join(homeDir, ".claude", "skills") },
    { id: "gemini", path: path.join(homeDir, ".gemini", "skills") },
    { id: "codex", path: path.join(homeDir, ".codex", "skills") },
    { id: "opencode", path: path.join(homeDir, ".opencode", "skills") },
    { id: "minimax", path: path.join(homeDir, ".minimax", "skills") },
    { id: "kiro", path: path.join(homeDir, ".kiro", "skills") },
    { id: "trae", path: path.join(homeDir, ".trae", "skills") },
    { id: "trae-cn", path: path.join(homeDir, ".trae-cn", "skills") },
    { id: "rovo", path: path.join(homeDir, ".rovodev", "skills") },
    { id: "qoder", path: path.join(homeDir, ".qoder", "skills") }
  ];
}

function buildAgentInventoryRoots(homeDir = os.homedir()) {
  return [
    { id: "kenmark-store", path: path.join(homeDir, ".kenmark", "store", "agents") },
    { id: "claude", path: path.join(homeDir, ".claude", "agents") },
    { id: "cursor", path: path.join(homeDir, ".cursor", "agents") },
    { id: "agents", path: path.join(homeDir, ".agents", "agents") },
    { id: "gemini", path: path.join(homeDir, ".gemini", "agents") },
    { id: "codex", path: path.join(homeDir, ".codex", "agents") },
    { id: "opencode", path: path.join(homeDir, ".opencode", "agents") },
    { id: "minimax", path: path.join(homeDir, ".minimax", "agents") },
    { id: "kiro", path: path.join(homeDir, ".kiro", "agents") },
    { id: "trae", path: path.join(homeDir, ".trae", "agents") },
    { id: "trae-cn", path: path.join(homeDir, ".trae-cn", "agents") },
    { id: "rovo", path: path.join(homeDir, ".rovodev", "agents") },
    { id: "qoder", path: path.join(homeDir, ".qoder", "agents") }
  ];
}

function isVendoredMirror(relativePath) {
  const norm = String(relativePath || "").replace(/\\/g, "/");
  return VENDORED_PREFIXES.some((prefix) => norm.includes(prefix));
}

function isVendoredAgent(relativePath) {
  const norm = String(relativePath || "").replace(/\\/g, "/");
  return AGENT_VENDORED_PREFIXES.some((prefix) => norm.includes(prefix));
}

function safeRealpath(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}

function getBackupsDir() {
  return path.join(getKenmarkHome(), "backups");
}

function timestampForPath() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function backupSkillDir(skillName, skillPath, reason = "overwrite") {
  if (!fs.existsSync(skillPath)) return null;

  const backupRoot = path.join(getBackupsDir(), timestampForPath(), skillName);
  fs.mkdirSync(path.dirname(backupRoot), { recursive: true });
  fs.cpSync(skillPath, backupRoot, { recursive: true });

  return {
    skillName,
    source: skillPath,
    backupPath: backupRoot,
    reason,
    createdAt: new Date().toISOString()
  };
}

function hashFile(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function hashDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return null;

  const entries = [];

  function walk(current) {
    for (const ent of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, ent.name);
      const relPath = path.relative(dirPath, fullPath).replace(/\\/g, "/");

      if (ent.isDirectory()) {
        walk(fullPath);
      } else if (ent.isFile()) {
        entries.push(`${relPath}:${hashFile(fullPath)}`);
      }
    }
  }

  walk(dirPath);

  return crypto
    .createHash("sha256")
    .update(entries.sort().join("\n"))
    .digest("hex");
}

const KENMARK_MANAGED_MARKER = ".kenmark-managed";

/** Unprefixed Kenmark skill folder names → current kenmark-* names (setup/update cleanup). */
const LEGACY_SKILL_RENAMES = {
  "init-brain": "kenmark-init",
  "skills-init": "kenmark-setup",
  "skills-router": "kenmark-router",
  troubleshoot: "kenmark-troubleshoot",
  "repo-hygiene": "kenmark-repo-hygiene",
  "repo-secrets-audit": "kenmark-repo-secrets",
  "repo-public-readiness": "kenmark-repo-public",
  "repo-kb-sync": "kenmark-repo-kb",
  "repo-docs-audit": "kenmark-repo-docs",
  "repo-structure-audit": "kenmark-repo-structure",
  "repo-dependency-audit": "kenmark-repo-deps",
  "repo-quality-gates": "kenmark-repo-quality",
  "repo-release-readiness": "kenmark-repo-release",
  "commit-push": "kenmark-commit",
  "issues-setup": "kenmark-issues-setup",
  "issues-list": "kenmark-issues-list",
  "issues-check": "kenmark-issues-check",
  "issues-scan": "kenmark-issues-scan",
  "issues-maintenance": "kenmark-issues-maintain",
  "issues-fix-and-ship": "kenmark-issues-fix-and-ship",
  "skills-install-recommended": "kenmark-packs",
  "skills-update": "kenmark-update",
  "skills-maintain": "kenmark-maintain",
  "subagents-maintain": "kenmark-agents"
};

function kenmarkClaudeCommandBasename(skillName) {
  return skillName.startsWith("kenmark-") ? skillName : `kenmark-${skillName}`;
}

function listLegacyKenmarkSkillPaths() {
  return [
    ...Object.keys(LEGACY_SKILL_RENAMES),
    ...Object.keys(LEGACY_SKILL_RENAMES).map((old) => `kenmark-${old}`)
  ];
}

const KENMARK_PACKAGE_SOURCE = "kenmark-package";

/** Substrings in SKILL.md that indicate a Kenmark-shipped skill (not name alone). */
const KENMARK_SKILL_OWNERSHIP_MARKERS = [
  "kenmark-skills",
  "~/.kenmark/store",
  "Kenmark skills",
  "Kenmark first-party",
  "Kenmark bundled",
  "Kenmark's curated",
  "Brain KB check before commit"
];

/** Substrings in generated Claude slash-command wrappers. */
const KENMARK_COMMAND_OWNERSHIP_MARKERS = [
  "from installed user skills",
  "# Kenmark ",
  "kenmark-skills"
];

function pathIsWithinDir(childPath, dirPath) {
  const child = safeRealpath(childPath);
  const dir = safeRealpath(dirPath);
  if (child === dir) return true;
  const rel = path.relative(dir, child);
  return Boolean(rel) && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function pathEntryExists(targetPath) {
  try {
    fs.lstatSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function lstatIfExists(targetPath) {
  try {
    return fs.lstatSync(targetPath);
  } catch {
    return null;
  }
}

function isBrokenSymlink(targetPath) {
  const stat = lstatIfExists(targetPath);
  if (!stat?.isSymbolicLink()) return false;
  return !fs.existsSync(targetPath);
}

function isSymlinkToKenmarkStore(skillPath, storeDir) {
  const stat = lstatIfExists(skillPath);
  if (!stat?.isSymbolicLink()) return false;

  try {
    const target = fs.readlinkSync(skillPath);
    const resolvedTarget = path.resolve(path.dirname(skillPath), target);
    const storeResolved = path.resolve(storeDir);
    const rel = path.relative(storeResolved, resolvedTarget);

    return (
      resolvedTarget === storeResolved ||
      (rel && !rel.startsWith("..") && !path.isAbsolute(rel))
    );
  } catch {
    return false;
  }
}

function hasKenmarkManagedSkillsRoot(skillPath) {
  const skillsRoot = path.dirname(skillPath);
  return fs.existsSync(path.join(skillsRoot, KENMARK_MANAGED_MARKER));
}

function readSkillMdText(skillPath) {
  const skillMd = path.join(skillPath, "SKILL.md");
  if (!fs.existsSync(skillMd)) return null;
  try {
    return fs.readFileSync(skillMd, "utf8");
  } catch {
    return null;
  }
}

function hasKenmarkSkillMdMarkers(skillPath) {
  const text = readSkillMdText(skillPath);
  if (!text) return false;
  if (KENMARK_SKILL_OWNERSHIP_MARKERS.some((marker) => text.includes(marker))) {
    return true;
  }
  const nameMatch = text.match(/^name:\s*(\S+)/m);
  return Boolean(nameMatch && nameMatch[1].startsWith("kenmark-"));
}

function isManifestKenmarkSkill(manifest, skillName) {
  const entry = manifest?.skills?.[skillName];
  if (!entry) return false;
  const src = String(entry.source || "");
  return src === KENMARK_PACKAGE_SOURCE || src.startsWith(`${KENMARK_PACKAGE_SOURCE}:`);
}

function collectKenmarkLegacyOwnershipProofs(skillPath, { storeDir, manifest, skillName }) {
  const proofs = [];
  if (isSymlinkToKenmarkStore(skillPath, storeDir)) proofs.push("symlink-to-store");
  if (hasKenmarkManagedSkillsRoot(skillPath)) proofs.push("kenmark-managed-root");
  if (hasKenmarkSkillMdMarkers(skillPath)) proofs.push("skill-md-marker");
  if (isManifestKenmarkSkill(manifest, skillName)) proofs.push("manifest-kenmark-package");
  return proofs;
}

function isProvenKenmarkLegacyPath(skillPath, context) {
  return collectKenmarkLegacyOwnershipProofs(skillPath, context).length > 0;
}

function backupLegacyCleanupPath(skillName, skillPath) {
  if (!pathEntryExists(skillPath)) return null;

  const backupRoot = path.join(
    getBackupsDir(),
    "legacy-cleanup",
    timestampForPath(),
    skillName
  );
  fs.mkdirSync(path.dirname(backupRoot), { recursive: true });

  const stat = lstatIfExists(skillPath);
  if (stat?.isSymbolicLink()) {
    const linkTarget = fs.readlinkSync(skillPath);
    fs.mkdirSync(backupRoot, { recursive: true });
    fs.writeFileSync(
      path.join(backupRoot, "SYMLINK_TARGET.txt"),
      `${linkTarget}\n`,
      "utf8"
    );
  } else {
    fs.cpSync(skillPath, backupRoot, { recursive: true });
  }

  return {
    skillName,
    source: skillPath,
    backupPath: backupRoot,
    reason: "legacy-cleanup",
    createdAt: new Date().toISOString()
  };
}

/**
 * Remove unprefixed Kenmark folders and old kenmark-<legacy> paths from store + IDE skill dirs
 * when ownership is proven (symlink to store, .kenmark-managed parent, SKILL.md markers, or manifest).
 * Unproven same-name paths are left in place with action legacy-candidate-review-required.
 * Proven removals are backed up under ~/.kenmark/backups/legacy-cleanup/<timestamp>/<skill-name>.
 */
function removeLegacyKenmarkInstalls(
  targetMap,
  { dryRun = false, includeStore = true } = {}
) {
  const legacyPaths = listLegacyKenmarkSkillPaths();
  const storeDir = getStoreDir();
  const manifest = readManifest();
  const results = [];
  const ownershipContext = { storeDir, manifest };

  const roots = new Set();
  if (includeStore && fs.existsSync(storeDir)) {
    roots.add(storeDir);
  }
  for (const targetPath of Object.values(targetMap || {})) {
    if (targetPath) roots.add(targetPath);
  }

  let manifestChanged = false;

  for (const root of roots) {
    for (const legacyName of legacyPaths) {
      const fullPath = path.join(root, legacyName);
      if (!pathEntryExists(fullPath)) continue;

      const proofs = collectKenmarkLegacyOwnershipProofs(fullPath, {
        ...ownershipContext,
        skillName: legacyName
      });

      if (!proofs.length) {
        results.push({
          path: fullPath,
          skillName: legacyName,
          action: "legacy-candidate-review-required",
          proofs: []
        });
        continue;
      }

      if (dryRun) {
        results.push({
          path: fullPath,
          skillName: legacyName,
          action: "would-remove",
          proofs
        });
        continue;
      }

      const backup = backupLegacyCleanupPath(legacyName, fullPath);
      removePathIfExists(fullPath);
      results.push({
        path: fullPath,
        skillName: legacyName,
        action: "removed",
        proofs,
        backup
      });
      if (manifest.skills && manifest.skills[legacyName]) {
        delete manifest.skills[legacyName];
        manifestChanged = true;
      }
    }
  }

  if (!dryRun && includeStore && manifestChanged) {
    writeManifest(manifest);
  }

  return results;
}

/** @deprecated Use removeKenmarkClaudeCommandWrappers */
function removeLegacyClaudeCommandWrappers(claudeSkillsPath, { dryRun = false } = {}) {
  return removeKenmarkClaudeCommandWrappers(claudeSkillsPath, [], { dryRun });
}

function collectKenmarkCommandOwnershipProofs(commandFile, { claudeSkillsPath, manifest }) {
  const proofs = [];
  const base = path.basename(commandFile, ".md");

  if (fs.existsSync(path.join(claudeSkillsPath, KENMARK_MANAGED_MARKER))) {
    proofs.push("kenmark-managed-root");
  }
  if (isManifestKenmarkSkill(manifest, base)) {
    proofs.push("manifest-kenmark-package");
  }

  try {
    const text = fs.readFileSync(commandFile, "utf8");
    if (KENMARK_COMMAND_OWNERSHIP_MARKERS.some((marker) => text.includes(marker))) {
      proofs.push("command-content-marker");
    }
  } catch {
    /* unreadable — no content proof */
  }

  return proofs;
}

function backupLegacyCleanupFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const base = path.basename(filePath);
  const backupRoot = path.join(
    getBackupsDir(),
    "legacy-cleanup",
    timestampForPath(),
    base
  );
  fs.mkdirSync(path.dirname(backupRoot), { recursive: true });
  fs.cpSync(filePath, backupRoot);
  return {
    skillName: base,
    source: filePath,
    backupPath: backupRoot,
    reason: "legacy-cleanup",
    createdAt: new Date().toISOString()
  };
}

/**
 * Remove generated Kenmark slash-command wrappers from ~/.claude/commands.
 * Namespaced kenmark-* skills are invoked directly; wrappers duplicate skill names.
 * Only removes files with proven Kenmark ownership (same proofs as legacy skill dirs).
 */
function removeKenmarkClaudeCommandWrappers(
  claudeSkillsPath,
  bundledSkillNames,
  { dryRun = false } = {}
) {
  const commandsDir = path.join(path.dirname(claudeSkillsPath), "commands");
  const manifest = readManifest();
  const basenames = new Set(listLegacyKenmarkSkillPaths());
  for (const skillName of bundledSkillNames || []) {
    basenames.add(kenmarkClaudeCommandBasename(skillName));
  }
  const results = [];

  for (const base of basenames) {
    const commandFile = path.join(commandsDir, `${base}.md`);
    if (!fs.existsSync(commandFile)) continue;

    const proofs = collectKenmarkCommandOwnershipProofs(commandFile, {
      claudeSkillsPath,
      manifest
    });

    if (!proofs.length) {
      results.push({
        path: commandFile,
        skillName: base,
        action: "legacy-candidate-review-required",
        proofs: []
      });
      continue;
    }

    if (dryRun) {
      results.push({
        path: commandFile,
        skillName: base,
        action: "would-remove",
        proofs
      });
      continue;
    }

    const backup = backupLegacyCleanupFile(commandFile);
    fs.rmSync(commandFile, { force: true });
    results.push({
      path: commandFile,
      skillName: base,
      action: "removed",
      proofs,
      backup
    });
  }

  return results;
}

/** Parent-dir entries ignored when inferring a real IDE install (Kenmark only creates `skills/`). */
const IDE_PARENT_IGNORED_ENTRIES = new Set(["skills"]);

function readDirEntryNames(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true }).map((ent) => ent.name);
  } catch {
    return null;
  }
}

function hasRealIdeInstallEvidence(ide, targetPath) {
  const parent = path.dirname(targetPath);
  const configRoot = path.dirname(parent);

  if (ide === "claude" && fs.existsSync(path.join(configRoot, ".claude.json"))) {
    return true;
  }

  const entries = readDirEntryNames(parent);
  if (!entries) return false;

  return entries.some((name) => !IDE_PARENT_IGNORED_ENTRIES.has(name));
}

function detectInstalledIdes(targetMap) {
  const detected = [];
  for (const [ide, targetPath] of Object.entries(targetMap)) {
    if (hasRealIdeInstallEvidence(ide, targetPath)) {
      detected.push(ide);
    }
  }
  return detected;
}

function detectManagedIdes(targetMap) {
  const managed = [];
  for (const [ide, targetPath] of Object.entries(targetMap)) {
    const markerPath = path.join(targetPath, KENMARK_MANAGED_MARKER);
    if (fs.existsSync(markerPath)) {
      managed.push(ide);
    }
  }
  return managed;
}

/** Resolve --ide all | cursor,codex | single from CLI flags. */
function resolveExplicitTargetIdes(ideArg, targetMap) {
  const requested = String(ideArg).toLowerCase();
  if (requested === "auto") {
    const detected = detectInstalledIdes(targetMap);
    if (detected.length > 0) return detected;
    return DEFAULT_AGENT_IDES.filter((ide) => targetMap[ide]);
  }
  if (requested === "all") {
    return Object.keys(targetMap);
  }
  if (requested.includes(",")) {
    const list = requested.split(",").map((s) => s.trim().toLowerCase());
    const invalid = list.filter((ide) => !targetMap[ide]);
    if (invalid.length) {
      throw new Error(`Unknown --ide value(s): ${invalid.join(", ")}`);
    }
    return list;
  }
  if (targetMap[requested]) {
    return [requested];
  }
  throw new Error(`Unknown --ide value: ${ideArg}`);
}

function buildTargetMapForIdes(fullMap, targetIdes) {
  const filtered = {};
  for (const ide of targetIdes) {
    filtered[ide] = fullMap[ide];
  }
  return filtered;
}

function writeKenmarkManagedMarker(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
  const markerPath = path.join(targetPath, KENMARK_MANAGED_MARKER);
  const payload = {
    managedBy: "kenmark-skills",
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(markerPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function ensureKenmarkTargetPath(targetPath, { dryRun = false } = {}) {
  if (dryRun) return;
  writeKenmarkManagedMarker(targetPath);
}

function resolveFallbackTargetIdes({ targetMap, strictTargets = false, mode = "global" } = {}) {
  const detected = detectInstalledIdes(targetMap);
  if (detected.length > 0) {
    return { targetIdes: detected, message: null };
  }

  if (strictTargets) {
    throw new Error(
      "No known IDE skill directories found. Pass --ide cursor|claude|codex|all, or remove --strict-targets."
    );
  }

  const targetIdes = DEFAULT_AGENT_IDES.filter((ide) => targetMap[ide]);
  const scopeLabel = mode === "project" ? "project" : "global";
  return {
    targetIdes,
    message: `No known ${scopeLabel} IDE skill directories found. Defaulting to: ${targetIdes.join(", ")}.`
  };
}

function resolveSkillRoot(skillPath) {
  const realPath = safeRealpath(skillPath);
  if (fs.existsSync(path.join(realPath, "SKILL.md"))) {
    return realPath;
  }
  let current = realPath;
  while (current !== path.parse(current).root) {
    current = path.dirname(current);
    if (fs.existsSync(path.join(current, "SKILL.md"))) {
      return current;
    }
  }
  return realPath;
}

function nonPortablePathPattern(skillName) {
  return new RegExp(
    `(\\.(agents|cursor|claude|gemini|opencode|kiro|trae|rovo|qoder|minimax)/skills/${skillName}/)`,
    "g"
  );
}

function findNonPortablePaths(content, skillName) {
  const matches = [];
  const pattern = nonPortablePathPattern(skillName);
  let match;
  while ((match = pattern.exec(content)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

function normalizeSkillPaths(content, skillName) {
  return content.replace(nonPortablePathPattern(skillName), "./");
}

const CWD_RELATIVE_SCRIPT_RE = /node \.\/scripts\/(\S+)/g;
const CWD_RELATIVE_SCRIPT_BACKTICK_RE = /`node \.\/scripts\/([^`]+)`/g;

function findCwdRelativeScriptInvocations(content) {
  const matches = [];
  for (const pattern of [
    new RegExp(CWD_RELATIVE_SCRIPT_BACKTICK_RE.source, "g"),
    new RegExp(CWD_RELATIVE_SCRIPT_RE.source, "g")
  ]) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      matches.push(match[0]);
    }
  }
  return matches;
}

function buildAbsoluteSkillScriptCommand(skillRoot, scriptAndArgs) {
  const tokens = scriptAndArgs.trim().split(/\s+/);
  const scriptFile = tokens[0];
  const args = tokens.slice(1).join(" ");
  const absScript = path.join(skillRoot, "scripts", scriptFile);
  const command = `node ${JSON.stringify(absScript)}`;
  return args ? `${command} ${args}` : command;
}

function normalizeCwdRelativeScripts(content, skillDir) {
  const skillRoot = resolveSkillRoot(skillDir);
  let normalized = content.replace(CWD_RELATIVE_SCRIPT_BACKTICK_RE, (match, scriptAndArgs) => {
    return `\`${buildAbsoluteSkillScriptCommand(skillRoot, scriptAndArgs)}\``;
  });
  normalized = normalized.replace(CWD_RELATIVE_SCRIPT_RE, (match, scriptAndArgs) => {
    return buildAbsoluteSkillScriptCommand(skillRoot, scriptAndArgs);
  });
  return normalized;
}

function listSkillAgentFacingRelPaths(skillDir) {
  const targetFiles = ["SKILL.md"];
  const refDir = path.join(skillDir, "reference");
  if (fs.existsSync(refDir)) {
    fs.readdirSync(refDir)
      .filter((f) => f.endsWith(".md"))
      .forEach((f) => targetFiles.push(path.join("reference", f)));
  }
  return targetFiles;
}

function listSkillPortabilityRelPaths(skillDir) {
  const targetFiles = ["SKILL.md"];
  const scriptDir = path.join(skillDir, "scripts");
  if (fs.existsSync(scriptDir)) {
    const scripts = fs.readdirSync(scriptDir).filter((f) => f.endsWith(".js") || f.endsWith(".mjs"));
    scripts.forEach((f) => targetFiles.push(path.join("scripts", f)));
  }
  return targetFiles;
}

function scanSkillForNonPortablePaths(skillDir, skillName) {
  const skillRoot = resolveSkillRoot(skillDir);
  const findings = [];
  for (const relPath of listSkillPortabilityRelPaths(skillRoot)) {
    const fullPath = path.join(skillRoot, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    const matches = findNonPortablePaths(content, skillName);
    if (matches.length) {
      findings.push({ relPath, matches, kind: "ide-anchor" });
    }
  }
  for (const relPath of listSkillAgentFacingRelPaths(skillRoot)) {
    const fullPath = path.join(skillRoot, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    const cwdMatches = findCwdRelativeScriptInvocations(content);
    if (cwdMatches.length) {
      findings.push({ relPath, matches: cwdMatches, kind: "cwd-relative-script" });
    }
  }
  return findings;
}

function processSkillPortability(skillDir, skillName) {
  const skillRoot = resolveSkillRoot(skillDir);
  if (!fs.existsSync(skillRoot)) return;

  for (const relPath of listSkillPortabilityRelPaths(skillRoot)) {
    const fullPath = path.join(skillRoot, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf8");
    const normalized = normalizeSkillPaths(content, skillName);
    if (content !== normalized) {
      fs.writeFileSync(fullPath, normalized, "utf8");
    }
  }

  for (const relPath of listSkillAgentFacingRelPaths(skillRoot)) {
    const fullPath = path.join(skillRoot, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf8");
    const normalized = normalizeCwdRelativeScripts(content, skillRoot);
    if (content !== normalized) {
      fs.writeFileSync(fullPath, normalized, "utf8");
    }
  }
}

function resolveLinkModeLabel({ forceCopy = false, forceSymlink = false, preferCopyOnWindows = true } = {}) {
  if (forceCopy) return "copy";
  if (process.platform === "win32" && preferCopyOnWindows && !forceSymlink) {
    return "copy (Windows default)";
  }
  if (process.platform === "win32" && forceSymlink) {
    return "junction symlink";
  }
  return "symlink";
}

function appendBackupToManifest(manifest, skillName, backup) {
  if (!backup) return;
  manifest.skills[skillName] = {
    ...(manifest.skills[skillName] || {}),
    backups: [
      ...((manifest.skills[skillName] || {}).backups || []),
      backup
    ]
      .filter(Boolean)
      .slice(-10)
  };
}

function readManifest() {
  const manifestPath = getManifestPath();
  if (!fs.existsSync(manifestPath)) {
    return {
      version: 1,
      updatedAt: null,
      skills: {},
      packs: {}
    };
  }
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return {
      version: 1,
      updatedAt: null,
      skills: {},
      packs: {}
    };
  }
}

function writeManifest(manifest) {
  const kenmarkHome = getKenmarkHome();
  fs.mkdirSync(kenmarkHome, { recursive: true });
  fs.mkdirSync(getStoreDir(), { recursive: true });
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(getManifestPath(), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function parseSkillFrontmatter(skillMdPath) {
  let raw = "";
  try {
    raw = fs.readFileSync(skillMdPath, "utf8");
  } catch {
    return {};
  }
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = raw.slice(3, end);
  const out = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let value = m[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function readSkillScope(skillMdPath) {
  const fm = parseSkillFrontmatter(skillMdPath);
  const scope = typeof fm.scope === "string" ? fm.scope.trim() : "";
  return scope || "universal";
}

function listKenmarkBundledSkillNames(sourceUserSkillsDir) {
  if (!fs.existsSync(sourceUserSkillsDir)) {
    return [];
  }
  return fs
    .readdirSync(sourceUserSkillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      const skillMd = path.join(sourceUserSkillsDir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillMd)) return false;
      return readSkillScope(skillMd) !== "project-specific";
    })
    .map((entry) => entry.name)
    .sort();
}

function readRecommendedCatalog(catalogPath) {
  if (!fs.existsSync(catalogPath)) {
    return { packs: [] };
  }
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

function skillNameFromEccPath(relativePath) {
  const norm = String(relativePath || "").replace(/\\/g, "/");
  const match = norm.match(/^skills\/([^/]+)/);
  return match ? match[1] : null;
}

function findEccManifestDirectory(homeDir = os.homedir()) {
  const candidates = [];

  const cacheRoot = path.join(
    homeDir,
    ".claude",
    "plugins",
    "cache",
    "everything-claude-code"
  );
  if (fs.existsSync(cacheRoot)) {
    const versions = fs
      .readdirSync(cacheRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .reverse();
    for (const ver of versions) {
      const manifestDir = path.join(cacheRoot, ver, "manifests");
      if (fs.existsSync(path.join(manifestDir, "install-modules.json"))) {
        candidates.push(manifestDir);
        break;
      }
    }
  }

  const marketplaceDir = path.join(
    homeDir,
    ".claude",
    "plugins",
    "marketplaces",
    "everything-claude-code",
    "manifests"
  );
  if (fs.existsSync(path.join(marketplaceDir, "install-modules.json"))) {
    candidates.push(marketplaceDir);
  }

  return candidates[0] || null;
}

function resolveEccSkillNamesFromManifests(manifestDir, profileId) {
  const profilesPath = path.join(manifestDir, "install-profiles.json");
  const modulesPath = path.join(manifestDir, "install-modules.json");
  if (!fs.existsSync(profilesPath) || !fs.existsSync(modulesPath)) {
    return [];
  }

  let profilesDoc;
  let modulesDoc;
  try {
    profilesDoc = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
    modulesDoc = JSON.parse(fs.readFileSync(modulesPath, "utf8"));
  } catch {
    return [];
  }

  const profile = profilesDoc.profiles?.[profileId];
  if (!profile?.modules?.length) {
    return [];
  }

  const moduleById = new Map();
  for (const mod of modulesDoc.modules || []) {
    moduleById.set(mod.id, mod);
  }

  const names = new Set();
  for (const moduleId of profile.modules) {
    const mod = moduleById.get(moduleId);
    if (!mod?.paths) continue;
    for (const relPath of mod.paths) {
      const skillName = skillNameFromEccPath(relPath);
      if (skillName) names.add(skillName);
    }
  }
  return [...names].sort();
}

function resolveEccAdoptSkillNames(catalog, { eccProfile, homeDir } = {}) {
  const eccPack = (catalog.packs || []).find((p) => p.id === "ecc");
  if (!eccPack) {
    return [];
  }

  if (Array.isArray(eccPack.adoptSkillNames) && eccPack.adoptSkillNames.length) {
    return [...eccPack.adoptSkillNames].sort();
  }

  const profileId =
    eccProfile ||
    catalog.defaults?.eccProfile ||
    eccPack.install?.defaultProfile ||
    "core";

  const manifestDir = findEccManifestDirectory(homeDir);
  if (!manifestDir) {
    return [];
  }

  return resolveEccSkillNamesFromManifests(manifestDir, profileId);
}

const SEO_PACK_IDS = new Set([
  "seo-geo-selected",
  "seo-geo-full",
  "seo-geo-claude-skills"
]);

function isSeoCatalogPack(pack) {
  return Boolean(pack && (pack.category === "seo" || SEO_PACK_IDS.has(pack.id)));
}

/** Packs that install a detectable SKILL.md (npx, git-sync, python CLI, etc.). */
function isCatalogSkillPack(pack) {
  if (!pack || pack.installStrategy === "manual" || isSeoCatalogPack(pack)) {
    return false;
  }
  if (pack.id === "ecc") {
    return true;
  }
  const verify =
    pack.install?.verify?.global || pack.install?.verify?.project || pack.install?.verify;
  return typeof verify === "string" && /SKILL\.md/.test(verify);
}

function resolvePackAdoptSkillNames(pack, catalog, options = {}) {
  if (!pack) return [];
  if (Array.isArray(pack.adoptSkillNames) && pack.adoptSkillNames.length) {
    return [...pack.adoptSkillNames];
  }
  if (pack.id === "ecc") {
    return resolveEccAdoptSkillNames(catalog, options);
  }
  if (isCatalogSkillPack(pack)) {
    return [pack.id];
  }
  return [];
}

function getAdoptableSkillNames(sourceUserSkillsDir, catalogPath, options = {}) {
  const names = new Set(listKenmarkBundledSkillNames(sourceUserSkillsDir));
  const catalog = readRecommendedCatalog(catalogPath);
  const homeDir = options.homeDir || os.homedir();
  const packIdFilter = options.packIds?.length ? new Set(options.packIds) : null;

  for (const pack of catalog.packs || []) {
    if (packIdFilter && !packIdFilter.has(pack.id)) continue;
    for (const name of resolvePackAdoptSkillNames(pack, catalog, {
      eccProfile: options.eccProfile,
      homeDir
    })) {
      names.add(name);
    }
  }

  if (options.seoSkills?.length) {
    for (const name of options.seoSkills) {
      names.add(name);
    }
  }

  return [...names].sort();
}

/** First-party kenmark-* skills shipped in this package (same as bundled list). */
function listKenmarkCoreSkillNames(sourceUserSkillsDir) {
  return listKenmarkBundledSkillNames(sourceUserSkillsDir);
}

/** Catalog / recommended pack skill folder names (adoptable minus kenmark core). */
function listRecommendedPackSkillNames(sourceUserSkillsDir, catalogPath, options = {}) {
  const core = new Set(listKenmarkBundledSkillNames(sourceUserSkillsDir));
  return getAdoptableSkillNames(sourceUserSkillsDir, catalogPath, options).filter(
    (name) => !core.has(name)
  );
}

/** Kenmark core + catalog pack skills (everything Kenmark can adopt/relink). */
function listAllManagedSkillNames(sourceUserSkillsDir, catalogPath, options = {}) {
  return getAdoptableSkillNames(sourceUserSkillsDir, catalogPath, options);
}

function newestMtime(dirPath) {
  const skillMd = path.join(dirPath, "SKILL.md");
  if (!fs.existsSync(skillMd)) return 0;
  let latest = fs.statSync(skillMd).mtimeMs;
  try {
    const walk = (d) => {
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.isFile()) {
          latest = Math.max(latest, fs.statSync(p).mtimeMs);
        }
      }
    };
    walk(dirPath);
  } catch {
    /* ignore */
  }
  return latest;
}

function findSkillInstances(skillName, scanRoots) {
  const instances = [];
  for (const root of scanRoots) {
    if (!fs.existsSync(root.path)) continue;
    const direct = path.join(root.path, skillName);
    const skillMd = path.join(direct, "SKILL.md");
    if (!fs.existsSync(skillMd)) continue;
    const rel = root.id === "kenmark-store" ? skillName : `${root.id}/${skillName}`;
    if (isVendoredMirror(rel)) continue;
    instances.push({
      rootId: root.id,
      skillDir: direct,
      realDir: safeRealpath(direct),
      mtime: newestMtime(direct)
    });
  }
  return instances;
}

function pickBestSourceInstance(instances) {
  if (!instances.length) return null;
  const sorted = [...instances].sort((a, b) => {
    const pa = IDE_SCAN_PRIORITY.indexOf(a.rootId);
    const pb = IDE_SCAN_PRIORITY.indexOf(b.rootId);
    const rankA = pa === -1 ? 99 : pa;
    const rankB = pb === -1 ? 99 : pb;
    if (rankA !== rankB) return rankA - rankB;
    return b.mtime - a.mtime;
  });
  return sorted[0];
}

function removePathIfExists(targetPath) {
  const stat = lstatIfExists(targetPath);
  if (!stat) return;

  if (stat.isSymbolicLink() || stat.isFile()) {
    fs.rmSync(targetPath, { force: true });
    return;
  }

  if (stat.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function isCorrectLink(ideSkillPath, storeSkillPath) {
  if (!fs.existsSync(ideSkillPath)) return false;
  const storeReal = safeRealpath(storeSkillPath);
  try {
    const ideStat = fs.lstatSync(ideSkillPath);
    if (ideStat.isSymbolicLink()) {
      return safeRealpath(ideSkillPath) === storeReal;
    }
    if (ideStat.isDirectory()) {
      return safeRealpath(ideSkillPath) === storeReal;
    }
  } catch {
    return false;
  }
  return false;
}

function linkSkillIntoIde(
  storeSkillPath,
  ideSkillPath,
  { forceCopy = false, forceSymlink = false, preferCopyOnWindows = true } = {}
) {
  const storeReal = safeRealpath(storeSkillPath);
  if (!fs.existsSync(storeReal)) {
    throw new Error(`Store skill missing: ${storeReal}`);
  }

  if (isCorrectLink(ideSkillPath, storeSkillPath) && !forceCopy) {
    return { mode: "unchanged", path: ideSkillPath };
  }

  removePathIfExists(ideSkillPath);
  fs.mkdirSync(path.dirname(ideSkillPath), { recursive: true });

  if (forceCopy) {
    fs.cpSync(storeReal, ideSkillPath, { recursive: true });
    return { mode: "copy", path: ideSkillPath };
  }

  if (process.platform === "win32" && preferCopyOnWindows && !forceSymlink) {
    fs.cpSync(storeReal, ideSkillPath, { recursive: true });
    return { mode: "copy", path: ideSkillPath, reason: "windows-default" };
  }

  if (process.platform === "win32") {
    try {
      fs.symlinkSync(storeReal, ideSkillPath, "junction");
      return { mode: "symlink", path: ideSkillPath };
    } catch {
      fs.cpSync(storeReal, ideSkillPath, { recursive: true });
      return { mode: "copy", path: ideSkillPath };
    }
  }

  try {
    fs.symlinkSync(storeReal, ideSkillPath, "dir");
    return { mode: "symlink", path: ideSkillPath };
  } catch (err) {
    fs.cpSync(storeReal, ideSkillPath, { recursive: true });
    return { mode: "copy", path: ideSkillPath, warning: err.message };
  }
}

function installKenmarkSkillsToStore(sourceUserSkillsDir, { force = false, dryRun = false } = {}) {
  const storeDir = getStoreDir();
  const names = listKenmarkBundledSkillNames(sourceUserSkillsDir);
  const manifest = readManifest();
  const results = [];

  if (!dryRun) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  for (const name of names) {
    const src = path.join(sourceUserSkillsDir, name);
    const dest = path.join(storeDir, name);
    const srcHash = hashDirectory(src);
    const destExists = fs.existsSync(dest);
    const destHash = destExists ? hashDirectory(dest) : null;
    const shouldWrite = force || !destExists || srcHash !== destHash;

    if (dryRun) {
      results.push({ name, action: shouldWrite ? "would-update-store" : "skip-store" });
      continue;
    }

    if (shouldWrite) {
      if (destExists) {
        const backup = backupSkillDir(name, dest, "kenmark-store-overwrite");
        appendBackupToManifest(manifest, name, backup);
      }
      removePathIfExists(dest);
      fs.cpSync(src, dest, { recursive: true });
      processSkillPortability(dest, name);
      manifest.skills[name] = {
        ...(manifest.skills[name] || {}),
        source: "kenmark-package",
        linkMode: "store",
        contentHash: srcHash,
        updatedAt: new Date().toISOString()
      };
      results.push({ name, action: "updated-store" });
    } else {
      results.push({ name, action: "skip-store" });
    }
  }

  if (!dryRun) {
    writeManifest(manifest);
  }

  return { names, results };
}

function installKenmarkSkillsToStoreWithLegacyCleanup(
  sourceUserSkillsDir,
  targetMap,
  options = {}
) {
  const { dryRun = false, force = false } = options;
  const cleanup = removeLegacyKenmarkInstalls(targetMap, {
    dryRun,
    includeStore: true
  });
  const install = installKenmarkSkillsToStore(sourceUserSkillsDir, {
    force,
    dryRun
  });
  let commandCleanup = [];
  if (targetMap?.claude) {
    const bundledNames = listKenmarkBundledSkillNames(sourceUserSkillsDir);
    commandCleanup = removeKenmarkClaudeCommandWrappers(targetMap.claude, bundledNames, {
      dryRun
    });
  }
  return { ...install, legacyCleanup: cleanup, legacyCommandCleanup: commandCleanup };
}

function relinkSkillsToIdes(
  skillNames,
  targetMap,
  {
    forceCopy = false,
    forceSymlink = false,
    preferCopyOnWindows = true,
    dryRun = false
  } = {}
) {
  const storeDir = getStoreDir();
  const manifest = readManifest();
  const results = [];

  // Pre-create IDE target directories so `setup --ide kiro` makes `~/.kiro/skills/`
  // even when no skills match. Marker distinguishes Kenmark-created paths from real IDE installs.
  if (!dryRun) {
    for (const [, targetPath] of Object.entries(targetMap)) {
      ensureKenmarkTargetPath(targetPath);
    }
  }

  for (const name of skillNames) {
    const storePath = path.join(storeDir, name);
    if (!fs.existsSync(storePath)) {
      results.push({ name, skipped: true, reason: "not-in-store" });
      continue;
    }

    for (const [, targetPath] of Object.entries(targetMap)) {
      const idePath = path.join(targetPath, name);
      if (dryRun) {
        results.push({ name, idePath, action: "would-link" });
        continue;
      }
      const linkResult = linkSkillIntoIde(storePath, idePath, {
        forceCopy,
        forceSymlink,
        preferCopyOnWindows
      });
      manifest.skills[name] = {
        ...(manifest.skills[name] || {}),
        linkMode: linkResult.mode,
        linkedAt: new Date().toISOString()
      };
      results.push({ name, idePath, ...linkResult });
    }
  }

  if (!dryRun) {
    writeManifest(manifest);
  }

  return results;
}

function summarizeAdoptResults(results) {
  const adopted = results.filter(
    (r) => r.action === "adopted" || r.action === "would-adopt-to-store"
  ).length;
  const portabilityRefreshed = results.filter(
    (r) => r.action === "store-current" || r.action === "store-ok"
  ).length;
  const reviewRequired = results.filter(
    (r) =>
      r.action === "review-required" || r.action === "would-review-required"
  ).length;
  const skipped = results.filter((r) => r.action === "skip").length;
  return {
    adopted,
    portabilityRefreshed,
    reviewRequired,
    skipped,
    total: results.length
  };
}

function formatAdoptPassSummary(results, { dryRun = false } = {}) {
  const counts = summarizeAdoptResults(results);
  const adoptedLabel = dryRun ? "would adopt" : "adopted";
  const refreshLabel = dryRun ? "would portability-refresh" : "portability-refreshed";
  const segments = [`${counts.adopted} ${adoptedLabel}`];
  if (counts.portabilityRefreshed > 0) {
    segments.push(`${counts.portabilityRefreshed} ${refreshLabel}`);
  }
  let line = `Adopt pass: ${segments.join(", ")} of ${counts.total} candidate(s)`;
  if (counts.skipped > 0) {
    line += ` (${counts.skipped} skipped)`;
  }
  return { ...counts, line };
}

function adoptCatalogSkills(options = {}) {
  const {
    sourceUserSkillsDir,
    catalogPath,
    targetMap,
    eccProfile = null,
    homeDir = os.homedir(),
    force = false,
    adoptOverwrite = false,
    forceCopy = false,
    forceSymlink = false,
    preferCopyOnWindows = true,
    dryRun = false
  } = options;

  const scanRoots = buildInventoryRoots(homeDir);
  const adoptNames = getAdoptableSkillNames(sourceUserSkillsDir, catalogPath, {
    eccProfile,
    homeDir,
    packIds: options.packIds,
    seoSkills: options.seoSkills
  });
  const storeDir = getStoreDir();
  const manifest = readManifest();
  const results = [];

  if (!dryRun) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  for (const name of adoptNames) {
    const storePath = path.join(storeDir, name);
    const instances = findSkillInstances(name, scanRoots);
    const storeInstance = instances.find((i) => i.rootId === "kenmark-store");
    const best = pickBestSourceInstance(
      instances.filter((i) => i.rootId !== "kenmark-store")
    );

    let sourceDir = null;
    if (best) {
      sourceDir = best.skillDir;
    } else if (storeInstance) {
      sourceDir = storeInstance.skillDir;
    } else {
      const bundled = path.join(sourceUserSkillsDir, name);
      if (fs.existsSync(path.join(bundled, "SKILL.md"))) {
        sourceDir = bundled;
      }
    }

    if (!sourceDir) {
      results.push({ name, action: "skip", reason: "no-source" });
      continue;
    }

    const sourceHash = hashDirectory(sourceDir);
    const storeExists = fs.existsSync(storePath);
    const storeHash = storeExists ? hashDirectory(storePath) : null;

    if (
      best &&
      storeExists &&
      sourceHash !== storeHash &&
      !force &&
      !adoptOverwrite
    ) {
      results.push({
        name,
        action: dryRun ? "would-review-required" : "review-required",
        reason: "store-and-source-differ",
        source: best.skillDir,
        store: storePath
      });
      continue;
    }

    const shouldCopy =
      force ||
      adoptOverwrite ||
      !storeExists ||
      sourceHash !== storeHash ||
      safeRealpath(sourceDir) !== safeRealpath(storePath);

    if (dryRun) {
      results.push({
        name,
        action: shouldCopy ? "would-adopt-to-store" : "store-ok",
        source: sourceDir
      });
      continue;
    }

    if (shouldCopy) {
      if (storeExists && sourceHash !== storeHash) {
        const backup = backupSkillDir(name, storePath, "adopt-overwrite");
        appendBackupToManifest(manifest, name, backup);
      }
      removePathIfExists(storePath);
      fs.cpSync(sourceDir, storePath, { recursive: true });
      processSkillPortability(storePath, name);
      manifest.skills[name] = {
        ...(manifest.skills[name] || {}),
        source: best ? `${best.rootId}:${best.skillDir}` : "kenmark-package",
        adoptedAt: new Date().toISOString(),
        linkMode: "store",
        contentHash: sourceHash
      };
      results.push({ name, action: "adopted", source: sourceDir });
    } else {
      processSkillPortability(storePath, name);
      results.push({ name, action: "store-current", source: storePath });
    }
  }

  if (!dryRun) {
    writeManifest(manifest);
    relinkSkillsToIdes(adoptNames, targetMap, {
      forceCopy,
      forceSymlink,
      preferCopyOnWindows,
      dryRun: false
    });
  } else {
    relinkSkillsToIdes(adoptNames, targetMap, {
      forceCopy,
      forceSymlink,
      preferCopyOnWindows,
      dryRun: true
    });
  }

  return { adoptNames, results };
}

function uninstallKenmarkFromIdes(skillNames, targetMap, { keepStore = true, dryRun = false } = {}) {
  const results = [];
  for (const name of skillNames) {
    for (const [, targetPath] of Object.entries(targetMap)) {
      const idePath = path.join(targetPath, name);
      if (!fs.existsSync(idePath)) continue;
      if (dryRun) {
        results.push({ name, idePath, action: "would-remove" });
        continue;
      }
      removePathIfExists(idePath);
      results.push({ name, idePath, action: "removed" });
    }
  }

  if (!keepStore && !dryRun) {
    const storeDir = getStoreDir();
    for (const name of skillNames) {
      removePathIfExists(path.join(storeDir, name));
    }
  }

  return results;
}

/**
 * Surgical cleanup of Kenmark-managed skill names from IDE dirs and optionally the store.
 * Only removes paths whose basename is in skillNames (never scans for arbitrary folders).
 */
function removeManagedSkillsForCleanup(
  skillNames,
  targetMap,
  { dryRun = false, includeStore = false } = {}
) {
  const storeDir = getStoreDir();
  const manifest = readManifest();
  const results = [];
  let manifestChanged = false;
  const names = [...new Set(skillNames || [])];

  for (const name of names) {
    for (const [ide, targetPath] of Object.entries(targetMap || {})) {
      if (!targetPath) continue;
      const idePath = path.join(targetPath, name);
      if (!pathEntryExists(idePath)) continue;

      if (dryRun) {
        results.push({ name, path: idePath, ide, action: "would-remove" });
        continue;
      }
      removePathIfExists(idePath);
      results.push({ name, path: idePath, ide, action: "removed" });
    }

    if (includeStore) {
      const storePath = path.join(storeDir, name);
      if (pathEntryExists(storePath)) {
        if (dryRun) {
          results.push({ name, path: storePath, ide: "store", action: "would-remove" });
        } else {
          removePathIfExists(storePath);
          results.push({ name, path: storePath, ide: "store", action: "removed" });
        }
      }
      if (manifest.skills?.[name]) {
        if (dryRun) {
          results.push({
            name,
            path: path.join(storeDir, name),
            ide: "manifest",
            action: "would-remove-manifest"
          });
        } else {
          delete manifest.skills[name];
          manifestChanged = true;
          results.push({
            name,
            path: path.join(storeDir, name),
            ide: "manifest",
            action: "removed-manifest"
          });
        }
      }
    }
  }

  if (!dryRun && includeStore && manifestChanged) {
    writeManifest(manifest);
  }

  return results;
}

function readMcpDocument(filePath) {
  if (!fs.existsSync(filePath)) {
    return { mcpServers: {} };
  }
  try {
    const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!doc || typeof doc !== "object") {
      return { mcpServers: {} };
    }
    if (!doc.mcpServers || typeof doc.mcpServers !== "object") {
      doc.mcpServers = {};
    }
    return doc;
  } catch {
    return { mcpServers: {} };
  }
}

function writeMcpDocument(filePath, doc) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function mergeMcpServerEntries(existing, incoming, { force = false } = {}) {
  const merged = { ...existing };
  const added = [];
  const updated = [];
  const skipped = [];

  for (const [name, config] of Object.entries(incoming)) {
    if (!merged[name] || force) {
      if (merged[name] && force) {
        updated.push(name);
      } else if (!merged[name]) {
        added.push(name);
      }
      merged[name] = config;
    } else {
      skipped.push(name);
    }
  }

  return { merged, added, updated, skipped };
}

function installMcpToStore(bundledMcpPath, { force = false, dryRun = false, mcpDoc = null, profile = null } = {}) {
  const bundled = mcpDoc || readMcpDocument(bundledMcpPath);
  const storePath = getMcpStorePath();
  const manifest = readManifest();
  const serverNames = Object.keys(bundled.mcpServers || {}).sort();
  const results = { storePath, serverNames, action: "unchanged" };

  if (!serverNames.length) {
    results.action = "empty-bundled";
    return results;
  }

  const storeExists = fs.existsSync(storePath);
  const shouldWrite =
    force ||
    !storeExists ||
    JSON.stringify(readMcpDocument(storePath).mcpServers) !==
      JSON.stringify(bundled.mcpServers);

  if (dryRun) {
    results.action = shouldWrite ? "would-update-store" : "skip-store";
    return results;
  }

  if (shouldWrite) {
    writeMcpDocument(storePath, bundled);
    results.action = "updated-store";
  }

  manifest.mcp = {
    ...(manifest.mcp || {}),
    source: "kenmark-package",
    profile: profile || manifest.mcp?.profile || null,
    servers: serverNames,
    storePath,
    updatedAt: new Date().toISOString()
  };
  writeManifest(manifest);
  return results;
}

function installMcpToIdes(mcpTargetMap, targetIdes, options = {}) {
  const { force = false, dryRun = false, repoRoot } = options;
  const storePath = getMcpStorePath();
  const storeDoc = readMcpDocument(storePath);
  const incoming = storeDoc.mcpServers || {};
  const serverNames = Object.keys(incoming);
  const manifest = readManifest();
  const results = [];

  const mcpIdes = targetIdes.filter((ide) => mcpTargetMap[ide]);
  if (!serverNames.length) {
    return { results, serverNames, warning: "no-mcp-in-store" };
  }

  for (const ide of mcpIdes) {
    const targetPath = mcpTargetMap[ide];
    if (dryRun) {
      results.push({ ide, targetPath, action: "would-merge" });
      continue;
    }

    if (ide === "claude" && targetPath.endsWith(".claude.json")) {
      const claudeDoc = fs.existsSync(targetPath)
        ? JSON.parse(fs.readFileSync(targetPath, "utf8"))
        : {};
      if (!claudeDoc.mcpServers || typeof claudeDoc.mcpServers !== "object") {
        claudeDoc.mcpServers = {};
      }
      const { merged, added, updated, skipped } = mergeMcpServerEntries(
        claudeDoc.mcpServers,
        incoming,
        { force }
      );
      claudeDoc.mcpServers = merged;
      fs.writeFileSync(targetPath, `${JSON.stringify(claudeDoc, null, 2)}\n`, "utf8");
      results.push({
        ide,
        targetPath,
        action: "merged",
        added,
        updated,
        skipped
      });
      continue;
    }

    const existingDoc = readMcpDocument(targetPath);
    const { merged, added, updated, skipped } = mergeMcpServerEntries(
      existingDoc.mcpServers,
      incoming,
      { force }
    );
    existingDoc.mcpServers = merged;
    writeMcpDocument(targetPath, existingDoc);
    results.push({
      ide,
      targetPath,
      action: "merged",
      added,
      updated,
      skipped
    });
  }

  if (!dryRun) {
    manifest.mcp = {
      ...(manifest.mcp || {}),
      source: manifest.mcp?.source || "kenmark-package",
      profile: manifest.mcp?.profile || null,
      servers: serverNames,
      storePath,
      targets: Object.fromEntries(
        mcpIdes.map((ide) => [ide, mcpTargetMap[ide]])
      ),
      linkedAt: new Date().toISOString()
    };
    writeManifest(manifest);
  }

  return { results, serverNames, repoRoot };
}

function uninstallMcpFromIdes(mcpTargetMap, targetIdes, options = {}) {
  const { dryRun = false } = options;
  const manifest = readManifest();
  const storeDoc = readMcpDocument(getMcpStorePath());
  const serverNames = manifest.mcp?.servers?.length
    ? manifest.mcp.servers
    : Object.keys(storeDoc.mcpServers || {});
  const results = [];
  const mcpIdes = targetIdes.filter((ide) => mcpTargetMap[ide]);

  if (!serverNames.length) {
    return { results, serverNames };
  }

  for (const ide of mcpIdes) {
    const targetPath = mcpTargetMap[ide];
    if (!fs.existsSync(targetPath)) continue;

    if (dryRun) {
      results.push({ ide, targetPath, action: "would-remove-servers" });
      continue;
    }

    if (ide === "claude" && targetPath.endsWith(".claude.json")) {
      let claudeDoc;
      try {
        claudeDoc = JSON.parse(fs.readFileSync(targetPath, "utf8"));
      } catch {
        continue;
      }
      if (!claudeDoc.mcpServers) continue;
      for (const name of serverNames) {
        delete claudeDoc.mcpServers[name];
      }
      fs.writeFileSync(targetPath, `${JSON.stringify(claudeDoc, null, 2)}\n`, "utf8");
      results.push({ ide, targetPath, action: "removed-servers" });
      continue;
    }

    const doc = readMcpDocument(targetPath);
    for (const name of serverNames) {
      delete doc.mcpServers[name];
    }
    writeMcpDocument(targetPath, doc);
    results.push({ ide, targetPath, action: "removed-servers" });
  }

  if (!dryRun) {
    delete manifest.mcp;
    writeManifest(manifest);
    const storePath = getMcpStorePath();
    if (fs.existsSync(storePath)) {
      fs.rmSync(storePath, { force: true });
    }
  }

  return { results, serverNames };
}

function countSkillsInDir(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let count = 0;
  for (const ent of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, ent.name);
    if (ent.name === KENMARK_MANAGED_MARKER) continue;

    const skillMd = path.join(full, "SKILL.md");
    if (fs.existsSync(skillMd)) {
      count += 1;
    }
  }
  return count;
}

function findBrokenSymlinks(rootPath) {
  const broken = [];
  if (!fs.existsSync(rootPath)) return broken;

  for (const ent of fs.readdirSync(rootPath, { withFileTypes: true })) {
    if (!ent.isSymbolicLink()) continue;
    const fullPath = path.join(rootPath, ent.name);
    try {
      fs.realpathSync(fullPath);
    } catch {
      broken.push(fullPath);
    }
  }
  return broken;
}

function countBackupDirs() {
  const backupsDir = getBackupsDir();
  if (!fs.existsSync(backupsDir)) return 0;
  let count = 0;
  for (const ts of fs.readdirSync(backupsDir, { withFileTypes: true })) {
    if (!ts.isDirectory()) continue;
    const tsPath = path.join(backupsDir, ts.name);
    count += fs.readdirSync(tsPath, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
  }
  return count;
}

const MCP_DOCTOR_COMMANDS = ["npx", "uvx"];

function commandOnPath(cmd) {
  const lookup = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(lookup, [cmd], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  });
  return result.status === 0;
}

function listKenmarkServersInMcpConfig(targetPath, serverNames, ide) {
  if (!fs.existsSync(targetPath) || !serverNames.length) {
    return [];
  }
  try {
    if (ide === "claude" && targetPath.endsWith(".claude.json")) {
      const doc = JSON.parse(fs.readFileSync(targetPath, "utf8"));
      const mcp = doc.mcpServers || {};
      return serverNames.filter((name) => Boolean(mcp[name]));
    }
    const doc = readMcpDocument(targetPath);
    return serverNames.filter((name) => Boolean(doc.mcpServers[name]));
  } catch {
    return [];
  }
}

function inspectMcpForDoctor({ homeDir, manifest }) {
  const mcpStorePath = getMcpStorePath();
  const mcpStoreExists = fs.existsSync(mcpStorePath);
  const storeDoc = mcpStoreExists ? readMcpDocument(mcpStorePath) : { mcpServers: {} };
  const mcpMeta = manifest?.mcp || null;
  const profile = mcpMeta?.profile || null;
  const serversFromManifest = Array.isArray(mcpMeta?.servers) ? mcpMeta.servers : [];
  const serversFromStore = Object.keys(storeDoc.mcpServers || {}).sort();
  const servers = (serversFromManifest.length ? serversFromManifest : serversFromStore).slice().sort();
  const installed = Boolean(mcpMeta) || mcpStoreExists || servers.length > 0;

  const targetMap =
    mcpMeta?.targets && typeof mcpMeta.targets === "object"
      ? mcpMeta.targets
      : buildMcpGlobalTargets(homeDir);

  const targets = [];
  for (const [ide, targetPath] of Object.entries(targetMap)) {
    const configExists = fs.existsSync(targetPath);
    const serversPresent = listKenmarkServersInMcpConfig(targetPath, servers, ide);
    targets.push({
      ide,
      path: targetPath,
      configExists,
      touched: configExists && serversPresent.length > 0,
      serversPresent
    });
  }

  const commandsNeeded = new Set();
  for (const name of servers) {
    const cfg = storeDoc.mcpServers[name];
    if (cfg?.command) {
      commandsNeeded.add(String(cfg.command).trim());
    }
  }

  const commandsOnPath = {};
  for (const cmd of MCP_DOCTOR_COMMANDS) {
    commandsOnPath[cmd] = commandOnPath(cmd);
  }

  const missingCommands = MCP_DOCTOR_COMMANDS.filter(
    (cmd) => commandsNeeded.has(cmd) && !commandsOnPath[cmd]
  );

  const warnings = [];
  const mcpIssues = [];

  if (mcpMeta?.servers?.length && !mcpStoreExists) {
    mcpIssues.push("MCP manifest lists servers but ~/.kenmark/store/mcp.json is missing");
  }

  if (servers.includes("fetch")) {
    const fetchCmd = String(storeDoc.mcpServers?.fetch?.command || "uvx").trim();
    if (fetchCmd === "uvx" && !commandsOnPath.uvx) {
      warnings.push("fetch MCP uses uvx, but uvx was not found in PATH");
    }
  }

  for (const cmd of missingCommands) {
    const affected = servers.filter((n) => {
      const serverCmd = String(storeDoc.mcpServers[n]?.command || "").trim();
      return serverCmd === cmd;
    });
    if (!affected.length) continue;
    if (cmd === "uvx" && warnings.some((w) => w.includes("fetch MCP uses uvx"))) {
      continue;
    }
    mcpIssues.push(
      `MCP server(s) ${affected.join(", ")} use ${cmd}, but ${cmd} was not found in PATH`
    );
  }

  return {
    installed,
    mcpStorePath,
    mcpStoreExists,
    profile,
    servers,
    targets,
    commandsNeeded: [...commandsNeeded].sort(),
    commandsOnPath,
    missingCommands,
    warnings,
    issues: mcpIssues
  };
}

function isRunningInWsl() {
  return (
    process.platform === "linux" &&
    Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP)
  );
}

function runDoctor(options = {}) {
  const {
    repoRoot = path.resolve(__dirname, ".."),
    homeDir = os.homedir(),
    jsonPath = null,
    soft = false
  } = options;

  const storeDir = getStoreDir();
  const manifestPath = getManifestPath();
  const targetMap = buildGlobalTargets(homeDir);
  const issues = [];
  const warnings = [];
  const runningInWsl = isRunningInWsl();

  if (runningInWsl) {
    warnings.push(
      "Running inside WSL. Native Windows IDEs will not see skills installed under the WSL home directory. Run setup from PowerShell/CMD, or install into the Windows user profile explicitly."
    );
  }

  function recordProblem(msg) {
    if (soft) {
      warnings.push(msg);
    } else {
      issues.push(msg);
    }
  }

  let packageVersion = null;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
    packageVersion = pkg.version;
  } catch {
    /* informational only — repo health is `kenmark-skills validate` */
  }

  const nodeOk = process.version;
  const nodeMajor = parseInt(process.version.slice(1).split(".")[0], 10);
  if (nodeMajor < 18) {
    recordProblem(`Node ${nodeOk} is below required >=18`);
  }

  const storeExists = fs.existsSync(storeDir);
  if (!storeExists) {
    recordProblem("Kenmark store directory missing (~/.kenmark/store/skills)");
  }

  let manifest = null;
  let manifestReadable = false;
  try {
    manifest = readManifest();
    manifestReadable = fs.existsSync(manifestPath);
  } catch (err) {
    recordProblem(`Manifest unreadable: ${err.message}`);
  }

  const installedIdeRoots = detectInstalledIdes(targetMap);
  const managedIdeRoots = detectManagedIdes(targetMap);
  const idesForHashCheck = [
    ...new Set([...installedIdeRoots, ...managedIdeRoots])
  ];
  const skillCountsByIde = {};
  const brokenSymlinksByIde = {};
  const hashMismatches = [];

  for (const [ide, idePath] of Object.entries(targetMap)) {
    skillCountsByIde[ide] = countSkillsInDir(idePath);
    brokenSymlinksByIde[ide] = findBrokenSymlinks(idePath);
    if (brokenSymlinksByIde[ide].length) {
      recordProblem(`Broken symlinks in ${ide}: ${brokenSymlinksByIde[ide].length}`);
    }
  }

  const storeSkillNames = storeExists
    ? fs
        .readdirSync(storeDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  for (const name of storeSkillNames) {
    const storePath = path.join(storeDir, name);
    const storeHash = hashDirectory(storePath);
    const storeReal = safeRealpath(storePath);

    for (const finding of scanSkillForNonPortablePaths(storePath, name)) {
      const kindLabel =
        finding.kind === "cwd-relative-script"
          ? "cwd-relative script invocations"
          : "non-portable hardcoded paths";
      recordProblem(
        `Skill '${name}' in store contains ${kindLabel} in ${finding.relPath}`
      );
    }

    for (const ide of idesForHashCheck) {
      const idePath = path.join(targetMap[ide], name);
      if (!fs.existsSync(idePath)) continue;

      const ideReal = safeRealpath(idePath);
      if (ideReal !== storeReal) {
        for (const finding of scanSkillForNonPortablePaths(idePath, name)) {
          const kindLabel =
            finding.kind === "cwd-relative-script"
              ? "cwd-relative script invocations"
              : "non-portable hardcoded paths";
          recordProblem(
            `Skill '${name}' in ${ide} contains ${kindLabel} in ${finding.relPath}`
          );
        }
      }

      const ideHash = hashDirectory(idePath);
      if (ideHash !== storeHash) {
        hashMismatches.push({ skill: name, ide, storePath, idePath });
      }
    }
  }
  if (hashMismatches.length) {
    recordProblem(`Store/IDE content hash mismatches: ${hashMismatches.length}`);
  }

  const backupCount = countBackupDirs();

  const mcp = inspectMcpForDoctor({ homeDir, manifest });
  for (const w of mcp.warnings) {
    warnings.push(w);
  }
  for (const issue of mcp.issues) {
    recordProblem(issue);
  }

  const report = {
    ok: issues.length === 0,
    soft,
    issues,
    warnings,
    node: nodeOk,
    platform: process.platform,
    homeDir,
    runningInWsl,
    packageVersion,
    kenmarkHome: getKenmarkHome(),
    storeDir,
    storeExists,
    storeSkillCount: storeSkillNames.length,
    manifestPath,
    manifestReadable,
    manifestSkillCount: manifest ? Object.keys(manifest.skills || {}).length : 0,
    installedIdeRoots,
    managedIdeRoots,
    skillCountsByIde,
    brokenSymlinksByIde,
    hashMismatches,
    backupCount,
    mcp,
    checkedAt: new Date().toISOString()
  };

  if (jsonPath) {
    fs.mkdirSync(path.dirname(path.resolve(jsonPath)), { recursive: true });
    fs.writeFileSync(path.resolve(jsonPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  return report;
}

module.exports = {
  DEFAULT_AGENT_IDES,
  VENDORED_PREFIXES,
  AGENT_VENDORED_PREFIXES,
  AGENT_IDE_SCAN_PRIORITY,
  getKenmarkHome,
  getStoreDir,
  getMcpStorePath,
  getBundledMcpPath,
  getMcpProfilesPath,
  readMcpProfiles,
  listMcpProfileNames,
  listMcpProfilesForPrompt,
  MCP_PROFILE_DESCRIPTIONS,
  MCP_SERVER_DESCRIPTIONS,
  listBundledMcpServerNames,
  listMcpServersForPrompt,
  parseMcpServersArg,
  resolveMcpServerNames,
  buildMcpDocumentForServers,
  formatMcpPlanLine,
  resolveMcpInstall,
  resolveMcpProfileName,
  buildMcpDocumentForProfile,
  shouldInstallMcp,
  buildMcpGlobalTargets,
  buildMcpProjectTargets,
  getAgentStoreDir,
  getManifestPath,
  getAgentManifestPath,
  buildGlobalTargets,
  buildProjectTargets,
  buildInventoryRoots,
  buildAgentInventoryRoots,
  isVendoredMirror,
  isVendoredAgent,
  safeRealpath,
  pathEntryExists,
  lstatIfExists,
  isBrokenSymlink,
  hashDirectory,
  hashFile,
  getBackupsDir,
  backupSkillDir,
  KENMARK_MANAGED_MARKER,
  LEGACY_SKILL_RENAMES,
  kenmarkClaudeCommandBasename,
  listLegacyKenmarkSkillPaths,
  collectKenmarkLegacyOwnershipProofs,
  isProvenKenmarkLegacyPath,
  removeLegacyKenmarkInstalls,
  removeLegacyClaudeCommandWrappers,
  removeKenmarkClaudeCommandWrappers,
  installKenmarkSkillsToStoreWithLegacyCleanup,
  detectInstalledIdes,
  detectManagedIdes,
  resolveExplicitTargetIdes,
  buildTargetMapForIdes,
  ensureKenmarkTargetPath,
  resolveFallbackTargetIdes,
  resolveSkillRoot,
  findNonPortablePaths,
  findCwdRelativeScriptInvocations,
  normalizeSkillPaths,
  normalizeCwdRelativeScripts,
  listSkillPortabilityRelPaths,
  listSkillAgentFacingRelPaths,
  scanSkillForNonPortablePaths,
  processSkillPortability,
  resolveLinkModeLabel,
  readManifest,
  writeManifest,
  listKenmarkBundledSkillNames,
  listKenmarkCoreSkillNames,
  listRecommendedPackSkillNames,
  listAllManagedSkillNames,
  getAdoptableSkillNames,
  resolvePackAdoptSkillNames,
  isCatalogSkillPack,
  findEccManifestDirectory,
  resolveEccAdoptSkillNames,
  resolveEccSkillNamesFromManifests,
  findSkillInstances,
  linkSkillIntoIde,
  installKenmarkSkillsToStore,
  relinkSkillsToIdes,
  summarizeAdoptResults,
  formatAdoptPassSummary,
  adoptCatalogSkills,
  uninstallKenmarkFromIdes,
  removeManagedSkillsForCleanup,
  readMcpDocument,
  installMcpToStore,
  installMcpToIdes,
  uninstallMcpFromIdes,
  findBrokenSymlinks,
  removePathIfExists,
  runDoctor
};
