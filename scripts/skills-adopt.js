#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  wantsInteractive,
  promptScope,
  confirmPlan,
  banner
} = require("./interactive");
const {
  buildGlobalTargets,
  buildProjectTargets,
  getStoreDir,
  adoptCatalogSkills,
  formatAdoptPassSummary,
  resolveExplicitTargetIdes,
  buildTargetMapForIdes,
  dedupeAliasTargetIdes,
  formatAliasTargetNote,
  removeAliasDuplicateLinks
} = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "skills", "user-skills");
const catalogPath = path.join(sourceDir, "recommended-catalog.json");

function printUsage() {
  console.log("Usage: kenmark-skills adopt [options]");
  console.log("");
  console.log("Adopt Kenmark + recommended-catalog skills into ~/.kenmark/store and relink IDEs.");
  console.log("");
  console.log("Options:");
  console.log("  --global | --project      Scope (default: global)");
  console.log("  --ide <target>            cursor, claude, codex, antigravity-cli, antigravity, all, …");
  console.log("  --copy                    Copy into IDE paths instead of symlinks");
  console.log("  --symlink                 Force symlinks (Windows: junction) instead of copy");
  console.log("  --force                   Overwrite store when source differs (--adopt-overwrite alias)");
  console.log("  --adopt-overwrite         Overwrite existing store skills from IDE copies");
  console.log("  --ecc-profile core        ECC profile for adopt skill list (core, developer, …)");
  console.log("  --dry-run                 Show plan only");
  console.log("  -y, --yes                 Skip prompts");
  console.log("  -h, --help                Show help");
}

function parseArgs(argv) {
  const args = {
    ide: null,
    mode: null,
    yes: false,
    dryRun: false,
    forceCopy: false,
    forceSymlink: false,
    preferCopyOnWindows: true,
    force: false,
    adoptOverwrite: false,
    eccProfile: null,
    explicitMode: false,
    explicitIde: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }
    if (token === "--ide") {
      args.ide = argv[i + 1] || null;
      args.explicitIde = true;
      i += 1;
      continue;
    }
    if (token === "--project") {
      args.mode = "project";
      args.explicitMode = true;
      continue;
    }
    if (token === "--global") {
      args.mode = "global";
      args.explicitMode = true;
      continue;
    }
    if (token === "--copy") {
      args.forceCopy = true;
      continue;
    }
    if (token === "--symlink") {
      args.forceSymlink = true;
      continue;
    }
    if (token === "--force" || token === "--adopt-overwrite") {
      args.force = true;
      args.adoptOverwrite = true;
      continue;
    }
    if (token === "--ecc-profile") {
      args.eccProfile = (argv[i + 1] || "").trim() || null;
      i += 1;
      continue;
    }
    if (token === "-y" || token === "--yes") {
      args.yes = true;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
  }
  return args;
}

function resolveTargetIdes(args, targetMap) {
  if (args.explicitIde && args.ide) {
    return resolveExplicitTargetIdes(args.ide, targetMap);
  }
  return Object.keys(targetMap);
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const interactive = wantsInteractive(args);
  if (interactive && !args.yes) {
    banner("kenmark-skills adopt", "Consolidate catalog skills into ~/.kenmark/store");
  }

  let mode = args.mode || "global";
  if (interactive && !args.explicitMode) {
    mode = await promptScope(mode);
  }

  const fullTargetMap =
    mode === "project" ? buildProjectTargets(process.cwd()) : buildGlobalTargets(os.homedir());
  const requestedTargetIdes = resolveTargetIdes(args, fullTargetMap);
  const linkTargetIdes = dedupeAliasTargetIdes(requestedTargetIdes);
  const targetMap = buildTargetMapForIdes(fullTargetMap, linkTargetIdes);
  const aliasNote = formatAliasTargetNote(requestedTargetIdes, fullTargetMap);

  const plan = [
    `Adopt catalog skills into ${getStoreDir()}`,
    `Relink → ${linkTargetIdes.join(", ")}`
  ];
  if (aliasNote) {
    plan.push(aliasNote);
  }

  const ok = args.yes || args.dryRun || (await confirmPlan(plan, args.dryRun));
  if (!ok) {
    console.log("Cancelled.");
    process.exit(0);
  }

  const { adoptNames, results } = adoptCatalogSkills({
    sourceUserSkillsDir: sourceDir,
    catalogPath,
    targetMap,
    eccProfile: args.eccProfile,
    homeDir: os.homedir(),
    force: args.force,
    adoptOverwrite: args.adoptOverwrite,
    forceCopy: args.forceCopy,
    forceSymlink: args.forceSymlink,
    preferCopyOnWindows: args.preferCopyOnWindows,
    dryRun: args.dryRun,
    projectDir: mode === "project" ? process.cwd() : null
  });

  console.log(`Adoptable names (${adoptNames.length}): ${adoptNames.join(", ")}`);
  const adoptSummary = formatAdoptPassSummary(results, { dryRun: args.dryRun });
  console.log(adoptSummary.line);
  const reviewRequired = results.filter(
    (r) => r.action === "review-required" || r.action === "would-review-required"
  );
  if (reviewRequired.length) {
    console.log(
      `Review required: ${reviewRequired.length} skill(s) differ between store and IDE copy.`
    );
    console.log("  Run with --adopt-overwrite to overwrite store from IDE copies.");
    for (const r of reviewRequired) {
      console.log(`  • ${r.name}: ${r.reason}`);
    }
  }
  if (args.dryRun) {
    console.log("(dry-run — no files changed)");
  } else {
    console.log(`Store: ${getStoreDir()}`);
    const dedupeResult = removeAliasDuplicateLinks(fullTargetMap);
    if (dedupeResult.removed > 0) {
      console.log(
        `Removed shared-path duplicate skill links (${dedupeResult.removed}) from ${fullTargetMap.gemini}`
      );
    }
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
