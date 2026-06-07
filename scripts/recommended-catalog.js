#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const catalogPath = path.join(
  path.resolve(__dirname, ".."),
  "skills",
  "user-skills",
  "recommended-catalog.json"
);

const SEO_PACK_IDS = new Set([
  "seo-geo-selected",
  "seo-geo-full",
  "seo-geo-claude-skills"
]);

const LEGACY_PACK_ALIASES = {
  "seo-geo-claude-skills": "seo-geo-selected"
};

function normalizeCatalog(catalog) {
  if (!catalog || typeof catalog !== "object") return catalog;
  if (!catalog.presets && catalog.profiles) {
    catalog.presets = catalog.profiles;
  }
  for (const preset of catalog.presets || []) {
    if (!preset.packIds && preset.packs) {
      preset.packIds = preset.packs;
    }
  }
  return catalog;
}

function loadCatalog() {
  if (!fs.existsSync(catalogPath)) {
    return { version: 0, mode: "selectable", packs: [], presets: [] };
  }
  return normalizeCatalog(JSON.parse(fs.readFileSync(catalogPath, "utf8")));
}

function resolvePackId(packId) {
  return LEGACY_PACK_ALIASES[packId] || packId;
}

function getPack(catalog, packId) {
  const id = resolvePackId(packId);
  return (catalog.packs || []).find((p) => p.id === id) || null;
}

function getPreset(catalog, presetId) {
  const presets = catalog.presets || catalog.profiles || [];
  return presets.find((p) => p.id === presetId) || null;
}

/** @deprecated use getPreset */
function getProfile(catalog, profileId) {
  return getPreset(catalog, profileId);
}

function isSeoPack(pack) {
  if (!pack) return false;
  return pack.category === "seo" || SEO_PACK_IDS.has(pack.id);
}

function presetPackRefs(preset) {
  return preset.packIds || preset.packs || [];
}

/**
 * Flatten preset inheritance (extends) into ordered pack refs.
 */
function resolvePresetPackRefs(presetId, catalog) {
  const preset = getPreset(catalog, presetId);
  if (!preset) return null;

  let refs = [];
  if (preset.extends) {
    const parentRefs = resolvePresetPackRefs(preset.extends, catalog);
    if (!parentRefs) return null;
    refs = [...parentRefs];
  }
  refs = refs.concat(
    presetPackRefs(preset).map((ref) =>
      typeof ref === "string" ? { id: resolvePackId(ref) } : { ...ref, id: resolvePackId(ref.id) }
    )
  );
  return mergePackRefs(refs);
}

/** @deprecated use resolvePresetPackRefs */
function resolveProfilePackRefs(profileId, catalog) {
  return resolvePresetPackRefs(profileId, catalog);
}

function mergePackRefs(refs) {
  const map = new Map();
  for (const ref of refs) {
    const id = resolvePackId(ref.id);
    if (!map.has(id)) {
      map.set(id, { ...ref, id });
      continue;
    }
    const existing = map.get(id);
    const skills = [
      ...new Set([...(existing.skills || []), ...(ref.skills || [])])
    ];
    map.set(id, {
      ...existing,
      ...ref,
      id,
      skills: skills.length ? skills : undefined,
      profile: ref.profile ?? existing.profile,
      mode: ref.mode ?? existing.mode
    });
  }
  return [...map.values()];
}

function seoSkillsForEntry(pack, ref) {
  if (ref.skills?.length) return ref.skills;
  if (pack.defaultSeoSkills?.length) return pack.defaultSeoSkills;
  return null;
}

function seoModeForEntry(pack, ref) {
  if (ref.mode) return ref.mode;
  if (pack.seoMode) return pack.seoMode;
  if (ref.skills?.length || pack.defaultSeoSkills?.length) return "selected-skills";
  return "full";
}

/**
 * Build install plan entries from pack refs.
 */
function buildInstallPlan(packRefs, catalog) {
  const plan = [];
  for (const ref of packRefs) {
    const pack = getPack(catalog, ref.id);
    if (!pack) {
      plan.push({ packId: ref.id, missing: true, ref });
      continue;
    }
    const eccProfile =
      ref.profile ||
      pack.recommendedProfile ||
      pack.defaultProfile ||
      pack.install?.defaultProfile ||
      "minimal";
    const seoMode = isSeoPack(pack) ? seoModeForEntry(pack, ref) : null;
    const seoSkills = isSeoPack(pack) ? seoSkillsForEntry(pack, ref) : null;
    plan.push({
      packId: pack.id,
      pack,
      ref,
      eccProfile: pack.id === "ecc" ? eccProfile : null,
      seoSkills,
      seoMode
    });
  }
  return plan;
}

function resolvePresetPlan(presetId, catalog) {
  const refs = resolvePresetPackRefs(presetId, catalog);
  if (!refs) return null;
  const preset = getPreset(catalog, presetId);
  return {
    presetId,
    profileId: presetId,
    preset,
    profile: preset,
    packRefs: refs,
    installPlan: buildInstallPlan(refs, catalog)
  };
}

/** @deprecated use resolvePresetPlan */
function resolveProfilePlan(profileId, catalog) {
  return resolvePresetPlan(profileId, catalog);
}

function packBloatContribution(entry) {
  const pack = entry.pack;
  if (!pack) return 1;

  if (isSeoPack(pack)) {
    const mode =
      entry.seoMode ||
      (entry.seoSkills?.length ? "selected-skills" : null) ||
      pack.seoMode ||
      "full";
    const useSelected =
      mode === "selected-skills" ||
      (entry.seoSkills?.length > 0 && mode !== "full");
    if (useSelected && pack.selectedBloatScore != null) {
      return pack.selectedBloatScore;
    }
  }

  return pack.bloatScore ?? 1;
}

function weightLabel(plan) {
  const scores = plan
    .filter((e) => !e.missing && e.pack)
    .map((e) => packBloatContribution(e));
  const total = scores.reduce((a, b) => a + b, 0);
  if (total <= 3) return { label: "Low", total };
  if (total <= 6) return { label: "Medium", total };
  if (total <= 9) return { label: "Medium–High", total };
  return { label: "High", total };
}

function formatWeightBloat(pack) {
  const weight =
    pack.weight === "light"
      ? "Light"
      : pack.weight === "medium"
        ? "Medium"
        : pack.weight === "heavy"
          ? "Heavy"
          : pack.weight === "heavy-variable"
            ? "Heavy (varies)"
            : pack.weight || "?";
  const bloat = pack.bloatScore ?? "?";
  return { weight, bloat };
}

function summarizePreset(presetId, catalog) {
  const resolved = resolvePresetPlan(presetId, catalog);
  if (!resolved) return null;
  const { preset, installPlan } = resolved;
  const weight = weightLabel(installPlan);
  const lines = installPlan
    .filter((e) => !e.missing)
    .map((e) => {
      let suffix = "";
      if (e.eccProfile) suffix = ` (${e.eccProfile})`;
      if (e.seoSkills?.length) {
        suffix = ` (${e.seoSkills.length} SEO/GEO skills)`;
      } else if (e.seoMode === "full") {
        suffix = " (full SEO/GEO pack)";
      }
      return `${e.pack.name}${suffix}`;
    });
  return {
    presetId,
    profileId: presetId,
    name: preset.name,
    description: preset.description,
    recommendedFor: preset.recommendedFor || [],
    requiresConfirmation: Boolean(preset.requiresConfirmation),
    risk: preset.risk,
    installLines: lines,
    weight: weight.label,
    bloatTotal: weight.total,
    bloatRisk:
      preset.risk === "high-bloat"
        ? "High"
        : weight.label === "High"
          ? "Medium"
          : weight.label === "Medium–High"
            ? "Medium"
            : "Low"
  };
}

/** @deprecated use summarizePreset */
function summarizeProfile(profileId, catalog) {
  return summarizePreset(profileId, catalog);
}

function expandInstallPath(rawPath) {
  if (!rawPath || typeof rawPath !== "string") return rawPath;
  const home = os.homedir();
  return rawPath.replace(/\$HOME\b/g, home).replace(/^~(?=\/|$)/, home);
}

function resolveInstallTarget(rawTarget, cwd) {
  const expanded = expandInstallPath(rawTarget);
  return cwd ? path.resolve(cwd, expanded) : path.resolve(expanded);
}

function formatGitSyncCommand(repoUrl, rawTarget) {
  return `git-sync ${repoUrl} → ${rawTarget}`;
}

function runGitSyncInstall({ repoUrl, targetPath, cwd, dryRun }) {
  const target = resolveInstallTarget(targetPath, cwd);
  const display = formatGitSyncCommand(repoUrl, target);
  console.log(`\n$ ${display}`);
  if (dryRun) return { status: 0 };

  const gitDir = path.join(target, ".git");
  const parent = path.dirname(target);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }

  if (fs.existsSync(gitDir)) {
    return spawnSync("git", ["-C", target, "pull", "--ff-only"], {
      stdio: "inherit",
      env: process.env
    });
  }

  if (fs.existsSync(target)) {
    console.error(`Target exists but is not a git repo: ${target}`);
    return { status: 1 };
  }

  return spawnSync("git", ["clone", repoUrl, target], {
    stdio: "inherit",
    env: process.env
  });
}

function commandExists(cmd) {
  const result = spawnSync(`command -v ${cmd}`, {
    shell: true,
    encoding: "utf8",
    stdio: "ignore"
  });
  return result.status === 0;
}

function preferLocalSkillsCli(command) {
  if (!command || !/\bnpx\b.*\bskills\b/.test(command)) return command;
  if (!commandExists("skills")) return command;
  return command.replace(/\bnpx\s+(--yes\s+)?skills\b/, "skills");
}

function resolveInstallCommands(entry, scope, catalog) {
  const pack = entry.pack;
  if (!pack) return [];

  const installStrategy = pack.installStrategy || pack.install?.strategy;
  if (installStrategy === "manual") {
    const block = pack.install?.[scope];
    return [
      {
        strategy: "manual",
        message:
          pack.warning ||
          block?.summary ||
          `Manual install required for ${pack.id}`,
        manualSteps: pack.install?.alternatives || []
      }
    ];
  }
  if (installStrategy === "git-sync") {
    const block = pack.install?.[scope];
    const repoUrl = pack.install?.repoUrl;
    if (!repoUrl || !block?.target) return [];
    const cwd = block.cwd === "project" ? process.cwd() : undefined;
    const command = formatGitSyncCommand(repoUrl, block.target);
    return [
      {
        strategy: "git-sync",
        command,
        repoUrl,
        targetPath: block.target,
        cwd
      }
    ];
  }

  if (isSeoPack(pack) && entry.seoSkills?.length) {
    const skillsArgv = entry.seoSkills.join(" ");
    const batchBlock = pack.install?.batchSkillInstall?.[scope];
    if (entry.seoSkills.length > 1 && batchBlock?.command) {
      const cwd =
        batchBlock.cwd === "project" ? process.cwd() : undefined;
      const cmd = preferLocalSkillsCli(
        batchBlock.command.replace(/\{\{skills\}\}/g, skillsArgv)
      );
      return [
        {
          command: cmd,
          cwd,
          batch: true,
          skillCount: entry.seoSkills.length,
          label: entry.seoSkills.join(", ")
        }
      ];
    }
    const skillBlock = pack.install?.skillInstall?.[scope];
    const cwd =
      skillBlock?.cwd === "project" ? process.cwd() : undefined;
    return entry.seoSkills.map((skill) => {
      let cmd =
        skillBlock?.command ||
        `npx --yes skills add aaron-he-zhu/seo-geo-claude-skills ${scope === "global" ? "-g " : ""}-y -s {{skill}}`;
      cmd = preferLocalSkillsCli(cmd.replace(/\{\{skill\}\}/g, skill));
      return { command: cmd, cwd, label: skill, seoSelected: true };
    });
  }

  const block = pack.install?.[scope];
  if (!block?.command) return [];

  let cmd = block.command;
  if (pack.id === "ecc" && cmd.includes("{{profile}}")) {
    const profile =
      entry.eccProfile ||
      pack.recommendedProfile ||
      pack.install?.defaultProfile ||
      "minimal";
    cmd = cmd.replace(/\{\{profile\}\}/g, profile);
  }
  const cwd = block.cwd === "project" ? process.cwd() : undefined;
  return [{ command: preferLocalSkillsCli(cmd), cwd }];
}

function formatInstallPlanLine(cmdEntry, packId) {
  const id = packId || "pack";
  if (cmdEntry?.strategy === "manual") {
    const msg =
      cmdEntry.message || `Manual install required for ${id}`;
    return `Manual install: ${msg}`;
  }
  if (cmdEntry?.command) return cmdEntry.command;
  if (cmdEntry?.message) return cmdEntry.message;
  return `Manual install: ${id}`;
}

function seoSkillVerifyClause(skill, scope) {
  const agents =
    scope === "global"
      ? `"$HOME/.agents/skills/${skill}/SKILL.md"`
      : `".agents/skills/${skill}/SKILL.md"`;
  const claude =
    scope === "global"
      ? `"$HOME/.claude/skills/${skill}/SKILL.md"`
      : `".claude/skills/${skill}/SKILL.md"`;
  return `(test -f ${agents} || test -f ${claude})`;
}

function buildSeoSkillsVerifyCommand(seoSkills, scope) {
  if (!seoSkills?.length) return null;
  return seoSkills.map((skill) => seoSkillVerifyClause(skill, scope)).join(" && ");
}

function resolveVerifyCommand(pack, scope, entry) {
  if (isSeoPack(pack) && entry?.seoSkills?.length) {
    return buildSeoSkillsVerifyCommand(entry.seoSkills, scope);
  }
  const cmd = pack?.install?.verify?.[scope] || pack?.install?.verify;
  return typeof cmd === "string" ? cmd : null;
}

function listPresets(catalog) {
  return catalog.presets || catalog.profiles || [];
}

/** @deprecated use listPresets */
function listProfiles(catalog) {
  return listPresets(catalog);
}

function defaultSelectedIds(catalog) {
  if (catalog.defaults?.selectedIds?.length) {
    return catalog.defaults.selectedIds.map(resolvePackId);
  }
  return (catalog.packs || [])
    .filter((p) => p.defaultSelected)
    .map((p) => p.id);
}

/** Legacy preset default; selectable mode has no default preset. */
function defaultPresetId(catalog) {
  if (catalog.mode === "selectable") return null;
  return (
    catalog.defaults?.profile ||
    listPresets(catalog).find((p) => p.default)?.id ||
    "lean"
  );
}

/** @deprecated */
function defaultProfileId(catalog) {
  return defaultPresetId(catalog);
}

function planFromPackIds(packIds, catalog, eccProfileOverride) {
  const refs = packIds.map((id) => ({ id: resolvePackId(id) }));
  const installPlan = buildInstallPlan(refs, catalog);
  if (eccProfileOverride) {
    for (const entry of installPlan) {
      if (entry.pack?.id === "ecc") entry.eccProfile = eccProfileOverride;
    }
  }
  return {
    presetId: null,
    profileId: null,
    preset: null,
    profile: null,
    packRefs: refs,
    installPlan
  };
}

// --- Repo signal detection ---

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "vendor",
  ".turbo",
  ".cache"
]);

function fileExistsInTree(root, names, maxDepth = 4) {
  const targets = new Set(names);
  let found = false;

  function walk(dir, depth) {
    if (found || depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (found) break;
      if (ent.name.startsWith(".") && ent.name !== ".github") continue;
      const full = path.join(dir, ent.name);
      if (ent.isFile() && targets.has(ent.name)) {
        found = true;
        break;
      }
      if (ent.isDirectory() && !SKIP_DIRS.has(ent.name)) {
        walk(full, depth + 1);
      }
    }
  }

  walk(root, 0);
  return found;
}

function countSourceFiles(root, maxDepth = 6, limit = 2500) {
  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".vue", ".svelte"]);
  let count = 0;

  function walk(dir, depth) {
    if (count >= limit || depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (count >= limit) break;
      if (SKIP_DIRS.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isFile()) {
        if (exts.has(path.extname(ent.name))) count += 1;
      } else if (ent.isDirectory()) {
        walk(full, depth + 1);
      }
    }
  }

  walk(root, 0);
  return count;
}

function readPackageJson(root) {
  const pkgPath = path.join(root, "package.json");
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return null;
  }
}

function detectRepoSignals(cwd = process.cwd()) {
  const root = path.resolve(cwd);
  const pkg = readPackageJson(root);
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };
  const scripts = pkg?.scripts || {};
  const allDepNames = Object.keys(deps || {}).join(" ").toLowerCase();
  const scriptText = Object.values(scripts).join(" ").toLowerCase();

  const fileCount = countSourceFiles(root);

  const signals = {
    "next.config": fileExistsInTree(root, [
      "next.config.js",
      "next.config.mjs",
      "next.config.ts"
    ]),
    "tailwind.config": fileExistsInTree(root, [
      "tailwind.config.js",
      "tailwind.config.ts",
      "tailwind.config.mjs"
    ]),
    "ui-app-router": fs.existsSync(path.join(root, "app")),
    "ui-src-components":
      fs.existsSync(path.join(root, "src", "components")) ||
      fs.existsSync(path.join(root, "components")),
    "ui-pages-dir": fs.existsSync(path.join(root, "pages")),
    "css-modules": fileExistsInTree(root, [], 3) && false,
    "git-repo": fs.existsSync(path.join(root, ".git")),
    "typescript-project":
      fs.existsSync(path.join(root, "tsconfig.json")) ||
      allDepNames.includes("typescript"),
    "multi-language-src": fileCount > 30,
    "repo-file-count-high": fileCount >= 120,
    "monorepo-workspace":
      fs.existsSync(path.join(root, "pnpm-workspace.yaml")) ||
      (pkg?.workspaces != null &&
        (Array.isArray(pkg.workspaces) || typeof pkg.workspaces === "object")),
    "seo-marketing-deps":
      /next-seo|@vercel\/analytics|sitemap|schema-dts|gatsby-plugin-sitemap/.test(
        allDepNames
      ),
    "public-static-site":
      fs.existsSync(path.join(root, "public")) &&
      (fs.existsSync(path.join(root, "pages")) ||
        fs.existsSync(path.join(root, "app"))),
    "sitemap-or-robots":
      fs.existsSync(path.join(root, "public", "sitemap.xml")) ||
      fs.existsSync(path.join(root, "public", "robots.txt")) ||
      fs.existsSync(path.join(root, "sitemap.xml")),
    "seo-heavy-package-scripts":
      /sitemap|seo|lighthouse|pagespeed/.test(scriptText),
    "shadcn-ui":
      fs.existsSync(path.join(root, "components.json")) ||
      fileExistsInTree(root, ["components.json"], 3),
    "claude-project-config":
      fs.existsSync(path.join(root, ".claude")) ||
      fs.existsSync(path.join(root, "CLAUDE.md")),
    "ecc-already-present": (() => {
      const agentsDir = path.join(root, ".claude", "agents");
      if (!fs.existsSync(agentsDir)) return false;
      try {
        return fs.readdirSync(agentsDir).some((n) => n.startsWith("ecc-"));
      } catch {
        return false;
      }
    })()
  };

  if (fileExistsInTree(root, [], 0)) {
    /* css-modules: any .module.css in shallow scan */
  }
  try {
    const walkCss = (dir, depth) => {
      if (depth > 3 || signals["css-modules"]) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (signals["css-modules"]) break;
        if (SKIP_DIRS.has(ent.name)) continue;
        const full = path.join(dir, ent.name);
        if (ent.isFile() && ent.name.endsWith(".module.css")) {
          signals["css-modules"] = true;
        } else if (ent.isDirectory()) walkCss(full, depth + 1);
      }
    };
    walkCss(root, 0);
  } catch {
    /* ignore */
  }

  return { cwd: root, signals, fileCount, packageName: pkg?.name };
}

function countMatchedSignals(test, signals) {
  const list = test.signals || [];
  const matched = list.filter((s) => signals[s]);
  return { matched, count: matched.length, total: list.length };
}

function evaluateRecommendWhen(test, matchedCount) {
  const when = (test.recommendWhen || "any").trim();
  if (when === "any") return matchedCount >= 1;
  const geMatch = when.match(/^>=\s*(\d+)$/);
  if (geMatch) return matchedCount >= parseInt(geMatch[1], 10);
  if (when === "all") {
    const total = test.signals?.length || 0;
    return total > 0 && matchedCount >= total;
  }
  if (when === "ecc-already-present") {
    return matchedCount >= 1;
  }
  return matchedCount >= 1;
}

const SIGNAL_LABELS = {
  "next.config": "Next.js",
  "tailwind.config": "Tailwind",
  "shadcn-ui": "ShadCN",
  "ui-app-router": "App Router",
  "ui-src-components": "components/",
  "ui-pages-dir": "pages/",
  "css-modules": "CSS modules",
  "git-repo": "git",
  "typescript-project": "TypeScript",
  "multi-language-src": "multi-language source",
  "repo-file-count-high": "large codebase",
  "monorepo-workspace": "monorepo",
  "seo-marketing-deps": "SEO/marketing deps",
  "public-static-site": "public static site",
  "sitemap-or-robots": "sitemap/robots",
  "seo-heavy-package-scripts": "SEO CI scripts",
  "claude-project-config": "Claude project config",
  "ecc-already-present": "ECC already installed"
};

const UI_STACK_SIGNALS = new Set([
  "next.config",
  "tailwind.config",
  "shadcn-ui",
  "ui-app-router",
  "ui-src-components",
  "ui-pages-dir",
  "css-modules"
]);

function formatMatchedSignals(matched) {
  const uiHits = matched.filter((s) => UI_STACK_SIGNALS.has(s));
  if (uiHits.length) {
    const labels = [...new Set(uiHits.map((s) => SIGNAL_LABELS[s] || s))];
    return `UI framework detected: ${labels.join("/")}`;
  }
  const labels = matched.map((s) => SIGNAL_LABELS[s] || s);
  return `${labels.join(", ")} detected in this repo`;
}

function buildWhyLine(pack, matched, tier) {
  if (matched.length) {
    return formatMatchedSignals(matched);
  }
  if (tier === "avoid") {
    return pack.avoidWhen?.[0] || "Usually not needed for this project type";
  }
  if (pack.defaultSelected) {
    return "Included in Kenmark defaults for most projects";
  }
  return pack.helpsWith?.[0] || pack.description || "Optional add-on";
}

function suggestPack(pack, ctx) {
  const test = pack.suggestiveTest;
  const tier = pack.defaultSelected
    ? "recommended"
    : test?.recommendation || "optional";

  if (!test) {
    return {
      packId: pack.id,
      tier: pack.defaultSelected ? "recommended" : "optional",
      matchedSignals: [],
      why: buildWhyLine(pack, [], tier),
      question: null
    };
  }

  const { matched, count } = countMatchedSignals(test, ctx.signals);
  const hits = evaluateRecommendWhen(test, count);
  let resolvedTier = test.recommendation || "optional";
  if (!hits && resolvedTier === "recommended") {
    resolvedTier = "optional";
  }
  if (hits && resolvedTier === "optional" && pack.recommended) {
    resolvedTier = "recommended";
  }
  if (pack.defaultSelected) resolvedTier = "recommended";

  return {
    packId: pack.id,
    tier: resolvedTier,
    matchedSignals: matched,
    why: buildWhyLine(pack, matched, resolvedTier),
    question: test.question
  };
}

function suggestPacks(catalog, cwd = process.cwd()) {
  const ctx = detectRepoSignals(cwd);
  return (catalog.packs || []).map((pack) => suggestPack(pack, ctx));
}

function tierSymbol(tier) {
  if (tier === "recommended") return "✓";
  if (tier === "avoid") return "✗";
  return "○";
}

function printSuggest(catalog, cwd = process.cwd()) {
  const suggestions = suggestPacks(catalog, cwd);
  const ctx = detectRepoSignals(cwd);
  console.log(
    `Optional recommended installs (catalog v${catalog.version}, mode: ${catalog.mode || "selectable"})\n`
  );
  console.log(`Repo: ${ctx.cwd}`);
  if (ctx.fileCount) console.log(`Source files (approx): ${ctx.fileCount}`);
  console.log("");

  console.log("All optional installs:\n");
  for (const pack of catalog.packs || []) {
    const sug = suggestions.find((s) => s.packId === pack.id);
    const { weight, bloat } = formatWeightBloat(pack);
    const helps = (pack.helpsWith || pack.bestFor || []).join(", ");
    const mark = pack.defaultSelected ? "[x]" : "[ ]";
    console.log(
      `${mark} ${pack.name} — helps with: ${helps || "—"} · Weight: ${weight} · Bloat: ${bloat}`
    );
    if (sug?.question) console.log(`    Q: ${sug.question}`);
    console.log("");
  }

  const recommended = suggestions.filter((s) => s.tier === "recommended");
  const optional = suggestions.filter(
    (s) => s.tier === "optional" && s.matchedSignals.length
  );
  const avoid = suggestions.filter(
    (s) => s.tier === "avoid" && s.matchedSignals.length
  );

  console.log("Recommended based on this repo:\n");
  if (!recommended.length && !optional.length && !avoid.length) {
    console.log("  (no strong signals — use defaults or --list for full catalog)\n");
  }
  for (const s of [...recommended, ...optional, ...avoid]) {
    const pack = getPack(catalog, s.packId);
    const { weight, bloat } = formatWeightBloat(pack || {});
    console.log(
      `${tierSymbol(s.tier)} ${pack?.name || s.packId}`
    );
    console.log(`    Why: ${s.why}`);
    if (pack?.helpsWith?.length) {
      console.log(`    Helps: ${pack.helpsWith.join(", ")}`);
    }
    console.log(`    Bloat risk: ${weight} (score ${bloat})`);
    if (s.matchedSignals.length) {
      console.log(`    Signals: ${s.matchedSignals.join(", ")}`);
    }
    console.log("");
  }

  const defaults = defaultSelectedIds(catalog);
  console.log(`Default selection (if you press Enter): ${defaults.join(", ")}`);
  console.log("\nInstall: npx kenmark-skills install-recommended --ids <id,...> --global -y");
  console.log("Presets (advanced): npx kenmark-skills install-recommended --profile core-next --global -y");
}

function explainPack(pack, catalog, cwd = process.cwd()) {
  if (!pack) return;
  const sug = suggestPack(pack, detectRepoSignals(cwd));
  const { weight, bloat } = formatWeightBloat(pack);
  console.log(`${pack.name} (${pack.id})\n`);
  console.log(pack.description);
  console.log(`\nCategory: ${pack.category}`);
  console.log(`Weight: ${weight} · Bloat score: ${bloat}`);
  if (pack.helpsWith?.length) console.log(`Helps with: ${pack.helpsWith.join(", ")}`);
  if (pack.bestFor?.length) console.log(`Best for: ${pack.bestFor.join(", ")}`);
  if (pack.avoidWhen?.length) console.log(`Avoid when: ${pack.avoidWhen.join(", ")}`);
  if (pack.suggestiveTest?.question) {
    console.log(`\nSuggestive test: ${pack.suggestiveTest.question}`);
    console.log(`Signals: ${(pack.suggestiveTest.signals || []).join(", ")}`);
    console.log(`Recommend when: ${pack.suggestiveTest.recommendWhen}`);
  }
  console.log(`\nSuggestion tier: ${sug.tier} — ${sug.why}`);
  if (sug.matchedSignals.length) {
    console.log(`Matched signals: ${sug.matchedSignals.join(", ")}`);
  }
  console.log(`Default selected: ${pack.defaultSelected ? "yes" : "no"}`);
  console.log(`URL: ${pack.url || "—"}`);
  if (pack.warning) console.log(`\n⚠ ${pack.warning}`);
}

function printOptionalList(catalog) {
  const defaultScope = catalog.defaults?.scope || "global";
  console.log(
    `Optional recommended installs (catalog v${catalog.version}, mode: ${catalog.mode || "selectable"}, default scope: ${defaultScope})\n`
  );
  if (catalog.installRules?.guidance) {
    console.log(`Note: ${catalog.installRules.guidance}\n`);
  }
  for (const pack of catalog.packs || []) {
    const { weight, bloat } = formatWeightBloat(pack);
    const def = pack.defaultSelected ? " · default-on" : "";
    const aliasNote =
      pack.aliases?.length ? ` (alias: ${pack.aliases.join(", ")})` : "";
    console.log(`  ${pack.id}${aliasNote}`);
    console.log(
      `    ${pack.name} — ${pack.category} · Weight: ${weight} · Bloat: ${bloat}${def}`
    );
    if (pack.helpsWith?.length) {
      console.log(`    Helps with: ${pack.helpsWith.join(", ")}`);
    }
    if (pack.bestFor?.length) {
      console.log(`    Best for: ${pack.bestFor.join(", ")}`);
    }
    if (pack.avoidWhen?.length) {
      console.log(`    Avoid when: ${pack.avoidWhen.join(", ")}`);
    }
    console.log(`    ${pack.description}`);
    console.log(`    ${pack.url || ""}`);
    if (pack.installStrategy === "manual") {
      console.log(`    Install: manual (${pack.install?.global?.summary || "see docs"})`);
    } else if (pack.install?.global?.command) {
      console.log(`    global: ${pack.install.global.command}`);
    }
    if (pack.warning) console.log(`    ⚠ ${pack.warning}`);
    console.log("");
  }
  const presets = listPresets(catalog);
  if (presets.length) {
    console.log("Presets (advanced / CI — not the primary UX):\n");
    for (const p of presets) {
      const refs = resolvePresetPackRefs(p.id, catalog) || [];
      console.log(`  ${p.id} — ${p.name}`);
      console.log(`    ${p.description || ""}`);
      console.log(`    packs: ${refs.map((r) => r.id).join(", ")}`);
      console.log("");
    }
  }
}

/** Compact catalog listing for `kenmark-skills update` interactive pack selection. */
function printUpdatePackChoices(catalog) {
  const packs = catalog.packs || [];
  const defaults = defaultSelectedIds(catalog);
  console.log(
    "\nRecommended packs to refresh (comma-separated ids, 'defaults', 'all', or empty=defaults):\n"
  );
  for (const pack of packs) {
    const mark = defaults.includes(pack.id) ? " [default]" : "";
    console.log(`  ${pack.id}${mark} — ${pack.name}`);
  }
  console.log(
    `\n  Enter or 'defaults' → ${defaults.join(", ") || "(none)"} · 'all' → all ${packs.length} catalog packs`
  );
}

module.exports = {
  catalogPath,
  loadCatalog,
  normalizeCatalog,
  getPack,
  getPreset,
  getProfile,
  resolvePackId,
  resolvePresetPackRefs,
  resolveProfilePackRefs,
  mergePackRefs,
  buildInstallPlan,
  resolvePresetPlan,
  resolveProfilePlan,
  summarizePreset,
  summarizeProfile,
  packBloatContribution,
  weightLabel,
  formatWeightBloat,
  resolveInstallCommands,
  formatInstallPlanLine,
  resolveVerifyCommand,
  buildSeoSkillsVerifyCommand,
  runGitSyncInstall,
  expandInstallPath,
  resolveInstallTarget,
  listPresets,
  listProfiles,
  defaultSelectedIds,
  defaultPresetId,
  defaultProfileId,
  planFromPackIds,
  detectRepoSignals,
  suggestPacks,
  suggestPack,
  printSuggest,
  explainPack,
  printOptionalList,
  printUpdatePackChoices,
  isSeoPack
};
