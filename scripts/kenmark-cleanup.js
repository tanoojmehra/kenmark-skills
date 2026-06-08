#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  wantsInteractive,
  promptScope,
  promptCleanupCategories,
  parseCleanupCategoryChoice,
  confirmPlan,
  banner
} = require("./interactive");
const {
  buildGlobalTargets,
  buildProjectTargets,
  resolveExplicitTargetIdes,
  buildTargetMapForIdes,
  findBrokenSymlinks,
  removePathIfExists,
  removeLegacyKenmarkInstalls,
  removeKenmarkClaudeCommandWrappers,
  listKenmarkCoreSkillNames,
  listRecommendedPackSkillNames,
  removeManagedSkillsForCleanup,
  resolveFallbackTargetIdes
} = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "skills", "user-skills");
const catalogPath = path.join(sourceDir, "recommended-catalog.json");

function printUsage() {
  console.log("Usage: kenmark-skills cleanup [options]");
  console.log("");
  console.log(
    "Surgical removal by category: broken symlinks, legacy Kenmark paths, kenmark-* skills, or catalog packs."
  );
  console.log("Safer than uninstall for hygiene — opt in to each category. Does not remove MCP configs.");
  console.log("");
  console.log("Categories (combine flags as needed; default: broken only):");
  console.log("  --broken-only             Dangling symlinks only [default when no category flags]");
  console.log("  --legacy-only             Proven unprefixed Kenmark folder names");
  console.log("  --all                     Broken symlinks + legacy paths (hygiene preset)");
  console.log("  --kenmark                 kenmark-* bundled skills from IDE dirs");
  console.log("  --recommended, --packs    Catalog pack skills (impeccable, graphify, ECC, …)");
  console.log("  --all-managed             kenmark + recommended packs");
  console.log("  --full                    broken + legacy + all managed skills");
  console.log("");
  console.log("Scope:");
  console.log("  --global | --project      Scope (default: global when non-interactive)");
  console.log("  --ide <target>            cursor, claude, codex, antigravity-cli, antigravity, auto, all, …");
  console.log("  --include-store           Also remove matching entries from ~/.kenmark/store (+ manifest)");
  console.log("  --dry-run                 List what would be removed");
  console.log("  -y, --yes                 Skip confirmation prompts");
  console.log("  -h, --help                Show help");
  console.log("");
  console.log("vs uninstall: uninstall removes all kenmark-* bundled skills from IDEs (keep-store default).");
  console.log("cleanup lets you pick categories — e.g. recommended packs only, or broken links only.");
  console.log("");
  console.log("Examples:");
  console.log("  npx kenmark-skills cleanup --global --ide auto");
  console.log("  npx kenmark-skills cleanup --global --kenmark --dry-run -y");
  console.log("  npx kenmark-skills cleanup --global --recommended --include-store -y");
  console.log("  npx kenmark-skills cleanup --global --all-managed --ide cursor,claude -y");
  console.log("  npx kenmark-skills cleanup --global --all -y    # broken + legacy hygiene");
  console.log("  npx kenmark-skills cleanup --full --global --ide auto --dry-run -y");
}

function parseArgs(argv) {
  const args = {
    ide: null,
    mode: null,
    yes: false,
    dryRun: false,
    includeStore: false,
    broken: false,
    legacy: false,
    kenmark: false,
    recommended: false,
    allManaged: false,
    full: false,
    explicitCategory: false,
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
    if (token === "--broken-only") {
      args.broken = true;
      args.explicitCategory = true;
      continue;
    }
    if (token === "--legacy-only") {
      args.legacy = true;
      args.explicitCategory = true;
      continue;
    }
    if (token === "--all") {
      args.broken = true;
      args.legacy = true;
      args.explicitCategory = true;
      continue;
    }
    if (token === "--kenmark") {
      args.kenmark = true;
      args.explicitCategory = true;
      continue;
    }
    if (token === "--recommended" || token === "--packs") {
      args.recommended = true;
      args.explicitCategory = true;
      continue;
    }
    if (token === "--all-managed") {
      args.allManaged = true;
      args.explicitCategory = true;
      continue;
    }
    if (token === "--full") {
      args.full = true;
      args.explicitCategory = true;
      continue;
    }
    if (token === "--include-store") {
      args.includeStore = true;
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

function resolveCleanupCategories(args) {
  if (args.full) {
    return { broken: true, legacy: true, kenmark: true, recommended: true };
  }
  if (args.allManaged) {
    return {
      broken: args.broken,
      legacy: args.legacy,
      kenmark: true,
      recommended: true
    };
  }

  const categories = {
    broken: args.broken,
    legacy: args.legacy,
    kenmark: args.kenmark,
    recommended: args.recommended
  };

  if (!args.explicitCategory) {
    categories.broken = true;
  }

  if (!categories.broken && !categories.legacy && !categories.kenmark && !categories.recommended) {
    categories.broken = true;
  }

  return categories;
}

function describeCategories(categories) {
  const parts = [];
  if (categories.broken) parts.push("broken");
  if (categories.legacy) parts.push("legacy");
  if (categories.kenmark) parts.push("kenmark");
  if (categories.recommended) parts.push("recommended");
  return parts.join("+") || "broken";
}

function collectBrokenSymlinks(targetMap) {
  const items = [];
  for (const [ide, rootPath] of Object.entries(targetMap)) {
    if (!fs.existsSync(rootPath)) continue;
    for (const symlinkPath of findBrokenSymlinks(rootPath)) {
      items.push({ ide, path: symlinkPath, name: path.basename(symlinkPath) });
    }
  }
  return items;
}

function removeBrokenSymlinks(items, { dryRun = false } = {}) {
  const results = [];
  for (const item of items) {
    if (dryRun) {
      results.push({ ...item, action: "would-remove" });
      continue;
    }
    removePathIfExists(item.path);
    results.push({ ...item, action: "removed" });
  }
  return results;
}

function resolveTargetIdes(args, fullTargetMap) {
  if (args.explicitIde && args.ide) {
    return resolveExplicitTargetIdes(args.ide, fullTargetMap);
  }
  const fallback = resolveFallbackTargetIdes({
    targetMap: fullTargetMap,
    strictTargets: false,
    mode: args.mode || "global"
  });
  if (fallback.message) {
    console.log(fallback.message);
  }
  return fallback.targetIdes;
}

function summarizeLegacyResults(legacyResults, commandResults) {
  const removed = legacyResults.filter((r) => r.action === "removed");
  const wouldRemove = legacyResults.filter((r) => r.action === "would-remove");
  const review = legacyResults.filter((r) => r.action === "legacy-candidate-review-required");
  const commandsRemoved = commandResults.filter((r) => r.action === "removed");
  const commandsWould = commandResults.filter((r) => r.action === "would-remove");
  const commandsReview = commandResults.filter(
    (r) => r.action === "legacy-candidate-review-required"
  );
  return {
    removed,
    wouldRemove,
    review,
    commandsRemoved,
    commandsWould,
    commandsReview
  };
}

function countManagedResults(results, dryRun) {
  const action = dryRun ? "would-remove" : "removed";
  const manifestAction = dryRun ? "would-remove-manifest" : "removed-manifest";
  return results.filter((r) => r.action === action || r.action === manifestAction).length;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const interactive = wantsInteractive(args);
  if (interactive && !args.yes) {
    banner("kenmark-skills cleanup", "Surgical removal by category — broken, legacy, kenmark, packs");
  }

  let mode = args.mode || "global";
  if (interactive && !args.explicitMode) {
    mode = await promptScope(mode, { purpose: "cleanup" });
  }

  let categories = resolveCleanupCategories(args);
  if (interactive && !args.explicitCategory && !args.yes) {
    categories = await promptCleanupCategories();
  }

  const homeDir = os.homedir();
  const fullTargetMap =
    mode === "project" ? buildProjectTargets(process.cwd()) : buildGlobalTargets(homeDir);
  const targetIdes = resolveTargetIdes(args, fullTargetMap);
  const targetMap = buildTargetMapForIdes(fullTargetMap, targetIdes);

  const kenmarkNames = listKenmarkCoreSkillNames(sourceDir);
  const recommendedNames = listRecommendedPackSkillNames(sourceDir, catalogPath, { homeDir });

  const brokenItems = categories.broken ? collectBrokenSymlinks(targetMap) : [];

  let legacyPreview = [];
  let commandPreview = [];
  if (categories.legacy) {
    legacyPreview = removeLegacyKenmarkInstalls(targetMap, {
      dryRun: true,
      includeStore: true
    });
    if (targetMap.claude) {
      commandPreview = removeKenmarkClaudeCommandWrappers(targetMap.claude, kenmarkNames, {
        dryRun: true
      });
    }
  }

  let kenmarkPreview = [];
  let recommendedPreview = [];
  if (categories.kenmark) {
    kenmarkPreview = removeManagedSkillsForCleanup(kenmarkNames, targetMap, {
      dryRun: true,
      includeStore: args.includeStore
    });
  }
  if (categories.recommended) {
    recommendedPreview = removeManagedSkillsForCleanup(recommendedNames, targetMap, {
      dryRun: true,
      includeStore: args.includeStore
    });
  }

  const categoryLabel = describeCategories(categories);
  const plan = [];
  if (categories.broken) {
    plan.push(`Remove ${brokenItems.length} broken symlink(s) in ${targetIdes.join(", ")}`);
  }
  if (categories.legacy) {
    const legacyCount = legacyPreview.filter((r) => r.action === "would-remove").length;
    const commandCount = commandPreview.filter((r) => r.action === "would-remove").length;
    plan.push(`Remove ${legacyCount} proven legacy skill path(s) (+ store when applicable)`);
    if (commandCount) {
      plan.push(`Remove ${commandCount} legacy Claude command wrapper(s)`);
    }
  }
  if (categories.kenmark) {
    plan.push(
      `Remove ${countManagedResults(kenmarkPreview, true)} kenmark-* skill path(s) (${kenmarkNames.length} known names)`
    );
  }
  if (categories.recommended) {
    plan.push(
      `Remove ${countManagedResults(recommendedPreview, true)} catalog pack skill path(s) (${recommendedNames.length} known names)`
    );
  }
  if (args.includeStore && (categories.kenmark || categories.recommended)) {
    plan.push("Include ~/.kenmark/store entries + manifest for managed skills");
  }
  if (!plan.length) {
    plan.push("Nothing to clean (no categories selected)");
  }
  plan.push(`Scope: ${mode} · categories: ${categoryLabel}`);

  if (brokenItems.length && (args.dryRun || interactive)) {
    console.log("\nBroken symlinks:");
    for (const item of brokenItems) {
      console.log(`  • ${item.ide}: ${item.path}`);
    }
  }

  if (categories.legacy && legacyPreview.length && (args.dryRun || interactive)) {
    const wouldRemove = legacyPreview.filter((r) => r.action === "would-remove");
    const review = legacyPreview.filter((r) => r.action === "legacy-candidate-review-required");
    if (wouldRemove.length) {
      console.log("\nLegacy paths (proven Kenmark ownership):");
      for (const r of wouldRemove) {
        console.log(`  • ${r.path}`);
      }
    }
    if (review.length) {
      console.log("\nLegacy candidates skipped (ownership unclear):");
      for (const r of review) {
        console.log(`  • ${r.path}`);
      }
    }
  }

  if (categories.kenmark && kenmarkPreview.length && (args.dryRun || interactive)) {
    console.log("\nKenmark bundled skills:");
    for (const r of kenmarkPreview) {
      console.log(`  • ${r.ide}: ${r.path}`);
    }
  }

  if (categories.recommended && recommendedPreview.length && (args.dryRun || interactive)) {
    console.log("\nCatalog pack skills:");
    for (const r of recommendedPreview) {
      console.log(`  • ${r.ide}: ${r.path}`);
    }
  }

  const ok = args.yes || args.dryRun || (await confirmPlan(plan, args.dryRun));
  if (!ok) {
    console.log("Cancelled.");
    process.exit(0);
  }

  let brokenRemoved = 0;
  let legacyRemoved = 0;
  let legacyReview = 0;
  let kenmarkRemoved = 0;
  let recommendedRemoved = 0;
  let commandsRemoved = 0;

  if (categories.broken) {
    const brokenResults = removeBrokenSymlinks(brokenItems, { dryRun: args.dryRun });
    brokenRemoved = brokenResults.filter(
      (r) => r.action === "removed" || r.action === "would-remove"
    ).length;
  }

  if (categories.legacy) {
    const legacyResults = removeLegacyKenmarkInstalls(targetMap, {
      dryRun: args.dryRun,
      includeStore: true
    });
    let commandResults = [];
    if (targetMap.claude) {
      commandResults = removeKenmarkClaudeCommandWrappers(targetMap.claude, kenmarkNames, {
        dryRun: args.dryRun
      });
    }
    const summary = summarizeLegacyResults(legacyResults, commandResults);
    legacyRemoved =
      (args.dryRun ? summary.wouldRemove : summary.removed).length +
      (args.dryRun ? summary.commandsWould : summary.commandsRemoved).length;
    legacyReview = summary.review.length + summary.commandsReview.length;
    commandsRemoved = (args.dryRun ? summary.commandsWould : summary.commandsRemoved).length;
  }

  if (categories.kenmark) {
    const kenmarkResults = removeManagedSkillsForCleanup(kenmarkNames, targetMap, {
      dryRun: args.dryRun,
      includeStore: args.includeStore
    });
    kenmarkRemoved = countManagedResults(kenmarkResults, args.dryRun);
    if (targetMap.claude && !categories.legacy) {
      const commandResults = removeKenmarkClaudeCommandWrappers(targetMap.claude, kenmarkNames, {
        dryRun: args.dryRun
      });
      const action = args.dryRun ? "would-remove" : "removed";
      commandsRemoved += commandResults.filter((r) => r.action === action).length;
    }
  }

  if (categories.recommended) {
    const recommendedResults = removeManagedSkillsForCleanup(recommendedNames, targetMap, {
      dryRun: args.dryRun,
      includeStore: args.includeStore
    });
    recommendedRemoved = countManagedResults(recommendedResults, args.dryRun);
  }

  const prefix = args.dryRun ? "Would remove" : "Removed";
  console.log("");
  if (categories.broken) {
    console.log(`${prefix} ${brokenRemoved} broken symlink(s)`);
  }
  if (categories.legacy) {
    console.log(
      `${prefix} ${legacyRemoved} legacy path(s)${
        args.dryRun ? "" : " (proven removals backed up under ~/.kenmark/backups/legacy-cleanup/)"
      }`
    );
    if (legacyReview) {
      console.log(
        `Skipped ${legacyReview} legacy candidate(s) — ownership unclear (left in place)`
      );
    }
  }
  if (categories.kenmark) {
    console.log(`${prefix} ${kenmarkRemoved} kenmark-* skill path(s)`);
  }
  if (commandsRemoved) {
    console.log(`${prefix} ${commandsRemoved} Claude command wrapper(s)`);
  }
  if (categories.recommended) {
    console.log(`${prefix} ${recommendedRemoved} catalog pack skill path(s)`);
  }
  if (
    !brokenRemoved &&
    !legacyRemoved &&
    !legacyReview &&
    !kenmarkRemoved &&
    !recommendedRemoved
  ) {
    console.log("Nothing to clean.");
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
