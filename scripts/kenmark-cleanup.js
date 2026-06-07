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
  resolveExplicitTargetIdes,
  buildTargetMapForIdes,
  findBrokenSymlinks,
  removePathIfExists,
  removeLegacyKenmarkInstalls,
  removeKenmarkClaudeCommandWrappers,
  listKenmarkBundledSkillNames,
  resolveFallbackTargetIdes
} = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "skills", "user-skills");

function printUsage() {
  console.log("Usage: kenmark-skills cleanup [options]");
  console.log("");
  console.log(
    "Remove broken skill symlinks and proven legacy Kenmark paths from IDE skill dirs."
  );
  console.log("Safer than uninstall — does not remove working Kenmark links or the store.");
  console.log("");
  console.log("Options:");
  console.log("  --global | --project      Scope (default: global when non-interactive)");
  console.log("  --ide <target>            cursor, claude, codex, auto, all, …");
  console.log("  --broken-only             Remove dangling symlinks only (default)");
  console.log("  --legacy-only             Remove proven legacy Kenmark skill names only");
  console.log("  --all                     Broken symlinks + legacy paths");
  console.log("  --dry-run                 List what would be removed");
  console.log("  -y, --yes                 Skip confirmation prompts");
  console.log("  -h, --help                Show help");
  console.log("");
  console.log("Examples:");
  console.log("  npx kenmark-skills cleanup --global --ide auto");
  console.log("  npx kenmark-skills cleanup --global --ide cursor,claude --dry-run -y");
  console.log("  npx kenmark-skills cleanup --global --all -y");
  console.log("  npx kenmark-skills cleanup --legacy-only --global --ide all -y");
}

function parseArgs(argv) {
  const args = {
    ide: null,
    mode: null,
    yes: false,
    dryRun: false,
    modeCleanup: "broken-only",
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
      args.modeCleanup = "broken-only";
      continue;
    }
    if (token === "--legacy-only") {
      args.modeCleanup = "legacy-only";
      continue;
    }
    if (token === "--all") {
      args.modeCleanup = "all";
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

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const interactive = wantsInteractive(args);
  if (interactive && !args.yes) {
    banner("kenmark-skills cleanup", "Remove broken links and legacy Kenmark paths");
  }

  let mode = args.mode || "global";
  if (interactive && !args.explicitMode) {
    mode = await promptScope(mode);
  }

  const homeDir = os.homedir();
  const fullTargetMap =
    mode === "project" ? buildProjectTargets(process.cwd()) : buildGlobalTargets(homeDir);
  const targetIdes = resolveTargetIdes(args, fullTargetMap);
  const targetMap = buildTargetMapForIdes(fullTargetMap, targetIdes);

  const doBroken = args.modeCleanup === "broken-only" || args.modeCleanup === "all";
  const doLegacy = args.modeCleanup === "legacy-only" || args.modeCleanup === "all";

  const brokenItems = doBroken ? collectBrokenSymlinks(targetMap) : [];

  let legacyPreview = [];
  let commandPreview = [];
  if (doLegacy) {
    legacyPreview = removeLegacyKenmarkInstalls(targetMap, {
      dryRun: true,
      includeStore: true
    });
    if (targetMap.claude) {
      const bundledNames = listKenmarkBundledSkillNames(sourceDir);
      commandPreview = removeKenmarkClaudeCommandWrappers(targetMap.claude, bundledNames, {
        dryRun: true
      });
    }
  }

  const plan = [];
  if (doBroken) {
    plan.push(
      `Remove ${brokenItems.length} broken symlink(s) in ${targetIdes.join(", ")}`
    );
  }
  if (doLegacy) {
    const legacyCount = legacyPreview.filter((r) => r.action === "would-remove").length;
    const commandCount = commandPreview.filter((r) => r.action === "would-remove").length;
    plan.push(
      `Remove ${legacyCount} proven legacy skill path(s) (+ store when applicable)`
    );
    if (commandCount) {
      plan.push(`Remove ${commandCount} legacy Claude command wrapper(s)`);
    }
  }
  if (!plan.length) {
    plan.push("Nothing to clean (no modes selected)");
  }
  plan.push(`Scope: ${mode} · mode: ${args.modeCleanup}`);

  if (brokenItems.length && (args.dryRun || interactive)) {
    console.log("\nBroken symlinks:");
    for (const item of brokenItems) {
      console.log(`  • ${item.ide}: ${item.path}`);
    }
  }

  if (doLegacy && legacyPreview.length && (args.dryRun || interactive)) {
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

  const ok = args.yes || args.dryRun || (await confirmPlan(plan, args.dryRun));
  if (!ok) {
    console.log("Cancelled.");
    process.exit(0);
  }

  let brokenRemoved = 0;
  let legacyRemoved = 0;
  let legacyReview = 0;
  let commandsRemoved = 0;

  if (doBroken) {
    const brokenResults = removeBrokenSymlinks(brokenItems, { dryRun: args.dryRun });
    brokenRemoved = brokenResults.filter(
      (r) => r.action === "removed" || r.action === "would-remove"
    ).length;
  }

  if (doLegacy) {
    const legacyResults = removeLegacyKenmarkInstalls(targetMap, {
      dryRun: args.dryRun,
      includeStore: true
    });
    let commandResults = [];
    if (targetMap.claude) {
      const bundledNames = listKenmarkBundledSkillNames(sourceDir);
      commandResults = removeKenmarkClaudeCommandWrappers(targetMap.claude, bundledNames, {
        dryRun: args.dryRun
      });
    }
    const summary = summarizeLegacyResults(legacyResults, commandResults);
    legacyRemoved =
      (args.dryRun ? summary.wouldRemove : summary.removed).length +
      (args.dryRun ? summary.commandsWould : summary.commandsRemoved).length;
    legacyReview = summary.review.length + summary.commandsReview.length;
  }

  const prefix = args.dryRun ? "Would remove" : "Removed";
  console.log("");
  if (doBroken) {
    console.log(`${prefix} ${brokenRemoved} broken symlink(s)`);
  }
  if (doLegacy) {
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
  if (!brokenRemoved && !legacyRemoved && !legacyReview) {
    console.log("Nothing to clean.");
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
