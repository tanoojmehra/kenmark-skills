#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");

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

function detectInstalledIdes(targetMap) {
  const detected = [];
  for (const [ide, targetPath] of Object.entries(targetMap)) {
    const parent = path.dirname(targetPath);
    if (fs.existsSync(parent)) {
      detected.push(ide);
    }
  }
  return detected;
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

function getAdoptableSkillNames(sourceUserSkillsDir, catalogPath, options = {}) {
  const names = new Set(listKenmarkBundledSkillNames(sourceUserSkillsDir));
  const catalog = readRecommendedCatalog(catalogPath);
  const homeDir = options.homeDir || os.homedir();

  for (const pack of catalog.packs || []) {
    if (pack.id === "impeccable") {
      names.add("impeccable");
    }
    if (pack.id === "ecc") {
      for (const n of resolveEccAdoptSkillNames(catalog, {
        eccProfile: options.eccProfile,
        homeDir
      })) {
        names.add(n);
      }
    }
  }
  return [...names].sort();
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
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.lstatSync(targetPath);
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
  // even when no skills match. Cheap; recursive mkdir is idempotent.
  if (!dryRun) {
    for (const [, targetPath] of Object.entries(targetMap)) {
      fs.mkdirSync(targetPath, { recursive: true });
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
    homeDir
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
      manifest.skills[name] = {
        ...(manifest.skills[name] || {}),
        source: best ? `${best.rootId}:${best.skillDir}` : "kenmark-package",
        adoptedAt: new Date().toISOString(),
        linkMode: "store",
        contentHash: sourceHash
      };
      results.push({ name, action: "adopted", source: sourceDir });
    } else {
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

function installMcpToStore(bundledMcpPath, { force = false, dryRun = false } = {}) {
  const bundled = readMcpDocument(bundledMcpPath);
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
  const serverNames = manifest.mcp?.servers || [];
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
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => fs.existsSync(path.join(dirPath, e.name, "SKILL.md")))
    .length;
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

function runDoctor(options = {}) {
  const {
    repoRoot = path.resolve(__dirname, ".."),
    homeDir = os.homedir(),
    jsonPath = null
  } = options;

  const catalogPath = path.join(repoRoot, "skills", "user-skills", "recommended-catalog.json");
  const storeDir = getStoreDir();
  const manifestPath = getManifestPath();
  const targetMap = buildGlobalTargets(homeDir);
  const issues = [];

  let packageVersion = null;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
    packageVersion = pkg.version;
  } catch {
    issues.push("Could not read package.json version");
  }

  const nodeOk = process.version;
  const nodeMajor = parseInt(process.version.slice(1).split(".")[0], 10);
  if (nodeMajor < 18) {
    issues.push(`Node ${nodeOk} is below required >=18`);
  }

  const storeExists = fs.existsSync(storeDir);
  if (!storeExists) {
    issues.push("Kenmark store directory missing (~/.kenmark/store/skills)");
  }

  let manifest = null;
  let manifestReadable = false;
  try {
    manifest = readManifest();
    manifestReadable = fs.existsSync(manifestPath);
  } catch (err) {
    issues.push(`Manifest unreadable: ${err.message}`);
  }

  const installedIdeRoots = detectInstalledIdes(targetMap);
  const skillCountsByIde = {};
  const brokenSymlinksByIde = {};
  const hashMismatches = [];

  for (const [ide, idePath] of Object.entries(targetMap)) {
    skillCountsByIde[ide] = countSkillsInDir(idePath);
    brokenSymlinksByIde[ide] = findBrokenSymlinks(idePath);
    if (brokenSymlinksByIde[ide].length) {
      issues.push(`Broken symlinks in ${ide}: ${brokenSymlinksByIde[ide].length}`);
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
    for (const ide of installedIdeRoots) {
      const idePath = path.join(targetMap[ide], name);
      if (!fs.existsSync(idePath)) continue;
      const ideHash = hashDirectory(idePath);
      if (ideHash !== storeHash) {
        hashMismatches.push({ skill: name, ide, storePath, idePath });
      }
    }
  }
  if (hashMismatches.length) {
    issues.push(`Store/IDE content hash mismatches: ${hashMismatches.length}`);
  }

  let catalogReadable = false;
  try {
    if (fs.existsSync(catalogPath)) {
      readRecommendedCatalog(catalogPath);
      catalogReadable = true;
    } else {
      issues.push("Recommended catalog missing");
    }
  } catch (err) {
    issues.push(`Recommended catalog unreadable: ${err.message}`);
  }

  const backupCount = countBackupDirs();

  const report = {
    ok: issues.length === 0,
    issues,
    node: nodeOk,
    platform: process.platform,
    packageVersion,
    kenmarkHome: getKenmarkHome(),
    storeDir,
    storeExists,
    storeSkillCount: storeSkillNames.length,
    manifestPath,
    manifestReadable,
    manifestSkillCount: manifest ? Object.keys(manifest.skills || {}).length : 0,
    installedIdeRoots,
    skillCountsByIde,
    brokenSymlinksByIde,
    hashMismatches,
    backupCount,
    catalogPath,
    catalogReadable,
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
  hashDirectory,
  hashFile,
  getBackupsDir,
  backupSkillDir,
  detectInstalledIdes,
  resolveFallbackTargetIdes,
  resolveLinkModeLabel,
  readManifest,
  writeManifest,
  listKenmarkBundledSkillNames,
  getAdoptableSkillNames,
  findEccManifestDirectory,
  resolveEccAdoptSkillNames,
  resolveEccSkillNamesFromManifests,
  findSkillInstances,
  linkSkillIntoIde,
  installKenmarkSkillsToStore,
  relinkSkillsToIdes,
  adoptCatalogSkills,
  uninstallKenmarkFromIdes,
  readMcpDocument,
  installMcpToStore,
  installMcpToIdes,
  uninstallMcpFromIdes,
  runDoctor
};
