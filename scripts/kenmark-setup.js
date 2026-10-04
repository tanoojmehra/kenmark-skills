#!/usr/bin/env node

const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const {
  wantsInteractive,
  assertInteractiveStdin,
  promptIde,
  promptYesNo,
  promptSelectOptionalPacks,
  promptEccProfile,
  promptMcpServers,
  confirmPlan,
  banner,
  rejectProjectScopeInArgv,
  normalizeCliArgv
} = require("./interactive");
const {
  loadCatalog,
  defaultSelectedIds,
  suggestPacks,
  weightLabel,
  planFromPackIds
} = require("./recommended-catalog");
const {
  buildGlobalTargets,
  detectInstalledIdes,
  detectManagedIdes,
  listMcpServersForPrompt,
  formatMcpPlanLine,
  resolveMcpInstall
} = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const setupScript = path.join(__dirname, "setup-skills.js");
const recommendedScript = path.join(__dirname, "kenmark-packs.js");
const {
  readLocalPackageVersion,
  fetchNpmLatestVersion,
  semverLt,
  globalKenmarkInstalled,
  globalKenmarkSetupScriptPath,
  runningFromGlobalPackage,
  readGlobalPackageVersion,
  runNpmInstallLatest,
  formatStaleCliHint
} = require("./cli-package");

function printUsage() {
  console.log("Usage: node scripts/kenmark-setup.js [options]");
  console.log("");
  console.log("Interactive first-time setup: Kenmark skills + optional recommended packs.");
  console.log("");
  console.log("Options:");
  console.log("  --ide <target>        IDE: cursor, claude, all, …");
  console.log("  --skip-recommended    Only install Kenmark skills (non-interactive)");
  console.log("  --recommended-only    Only install recommended packs (non-interactive)");
  console.log("  --profile <id>        Preset shortcut (lean, core-next, growth-seo, … — advanced)");
  console.log("  --suggest             Show repo-aware recommendations only (no install)");
  console.log("  --ids a,b             Recommended pack ids — custom (non-interactive)");
  console.log("  --all                 Install all catalog packs (legacy)");
  console.log("  --dry-run             Show steps without running");
  console.log("  --mcp-profile <name>  MCP profile: none, web, research, deep, all");
  console.log("  --mcp-servers <list>  MCP servers by name (e.g. playwright,context7,fetch)");
  console.log("  --with-mcp            Install all bundled MCP servers (profile: all)");
  console.log("  --skip-mcp            Skip MCP even when --mcp-profile / --with-mcp is set");
  console.log("  --skip-npm            Skip CLI version check and global package upgrade");
  console.log("  --upgrade-cli         Non-interactive: upgrade global kenmark-skills@latest before init");
  console.log("  -y, --yes             Skip prompts (agent mode; pass explicit flags)");
  console.log("  -h, --help            Show help");
}

function parseArgs(argv) {
  const args = {
    yes: false,
    dryRun: false,
    scope: null,
    ide: null,
    ids: null,
    all: false,
    skipMcp: false,
    withMcp: false,
    mcpProfile: null,
    mcpServers: null,
    skipNpm: false,
    upgradeCli: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === "-h" || t === "--help") {
      args.help = true;
      continue;
    }
    if (t === "-y" || t === "--yes") {
      args.yes = true;
      continue;
    }
    if (t === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (t === "--project") {
      args.scope = "project";
      continue;
    }
    if (t === "--ide") {
      args.ide = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (t === "--ids") {
      args.ids = (argv[i + 1] || "").split(",").map((s) => s.trim()).filter(Boolean);
      i += 1;
      continue;
    }
    if (t === "--all") {
      args.all = true;
      continue;
    }
    if (t === "--profile") {
      args.profile = (argv[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (t === "--suggest") {
      args.suggest = true;
      continue;
    }
    if (t === "--skip-recommended") {
      args.skipRecommended = true;
      continue;
    }
    if (t === "--recommended-only") {
      args.recommendedOnly = true;
      continue;
    }
    if (t === "--skip-mcp") {
      args.skipMcp = true;
      continue;
    }
    if (t === "--with-mcp") {
      args.withMcp = true;
      continue;
    }
    if (t === "--mcp-profile") {
      args.mcpProfile = (argv[i + 1] || "").trim() || null;
      i += 1;
      continue;
    }
    if (t === "--mcp-servers") {
      args.mcpServers = (argv[i + 1] || "").trim() || null;
      i += 1;
      continue;
    }
    if (t === "--skip-npm") {
      args.skipNpm = true;
      continue;
    }
    if (t === "--upgrade-cli") {
      args.upgradeCli = true;
      continue;
    }
  }
  return args;
}

function runNode(scriptPath, scriptArgs, dryRun, label) {
  const cmd = `${process.execPath} ${scriptPath} ${scriptArgs.join(" ")}`.trim();
  console.log(`\n━━━ ${label} ━━━`);
  console.log(`$ ${cmd}`);
  if (dryRun) return { status: 0 };
  return spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd()
  });
}

async function maybeUpgradeCliBeforeInit(args) {
  const localVersion = readLocalPackageVersion(repoRoot);
  console.log(`Running kenmark-skills v${localVersion}`);

  if (args.skipNpm || args.dryRun) return;

  const latestVersion = fetchNpmLatestVersion();
  if (!latestVersion || !semverLt(localVersion, latestVersion)) return;

  const fromGlobal = runningFromGlobalPackage(__filename);
  const globalInstalled = globalKenmarkInstalled();

  if (!fromGlobal) {
    if (!args.yes) {
      console.warn(formatStaleCliHint(localVersion, latestVersion, { globalInstalled }));
    }
    return;
  }

  let shouldUpgrade = false;
  if (args.upgradeCli) {
    shouldUpgrade = true;
  } else if (wantsInteractive(args)) {
    shouldUpgrade = await promptYesNo(
      `CLI is outdated (v${localVersion} → npm latest v${latestVersion}). Upgrade global package before installing skills?`,
      true
    );
  } else {
    console.warn(formatStaleCliHint(localVersion, latestVersion, { globalInstalled: true }));
    return;
  }

  if (!shouldUpgrade) return;

  const npmResult = runNpmInstallLatest(false);
  if (npmResult.status !== 0) {
    console.error("npm install failed; continuing with current CLI version.");
    return;
  }

  const upgradedVersion = readGlobalPackageVersion();
  if (!upgradedVersion || semverLt(upgradedVersion, latestVersion)) {
    console.warn(
      upgradedVersion
        ? `Global CLI is v${upgradedVersion} (npm latest v${latestVersion}); continuing without re-exec.`
        : "Could not read upgraded global package version; continuing without re-exec."
    );
    return;
  }

  const newSetupScript = globalKenmarkSetupScriptPath();
  if (!newSetupScript || path.resolve(newSetupScript) === path.resolve(__filename)) {
    return;
  }

  console.log(`\nRe-running init with upgraded CLI (v${upgradedVersion})…\n`);
  const result = spawnSync(process.execPath, [newSetupScript, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd()
  });
  process.exit(result.status === null ? 1 : result.status);
}

async function run() {
  rejectProjectScopeInArgv(process.argv.slice(2));
  const args = parseArgs(normalizeCliArgv(process.argv.slice(2)));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (wantsInteractive(args)) {
    await assertInteractiveStdin();
  }

  banner(
    "kenmark-skills init",
    "Interactive setup — every choice is explicit · use flags + -y for agents"
  );

  await maybeUpgradeCliBeforeInit(args);

  const interactive = wantsInteractive(args);
  let scope = "global";
  let ideArg = args.ide;
  let installKenmark = false;
  let installRecommended = false;
  let selectedPreset = null;
  let selectedPacks = [];
  let eccProfile = null;
  let mcpProfile = args.mcpProfile;
  let mcpServers = args.mcpServers;

  if (interactive) {
    installKenmark = await promptYesNo(
      "Install Kenmark skills (kenmark-init, kenmark-commit, issues, …)?",
      false
    );
    installRecommended = await promptYesNo(
      "Install optional recommended third-party packs (you choose which)?",
      false
    );
    if (installRecommended) {
      const catalog = loadCatalog();
      const packs = catalog.packs || [];
      if (packs.length === 0) {
        console.log("No optional installs in catalog; skipping recommended step.");
        installRecommended = false;
      } else {
        const suggestions = suggestPacks(catalog, process.cwd());
        selectedPacks = await promptSelectOptionalPacks(packs, suggestions, {
          defaultIds: defaultSelectedIds(catalog)
        });
        if (selectedPacks.length === 0) {
          console.log("No packs chosen; skipping recommended step.");
          installRecommended = false;
        } else {
          const plan = planFromPackIds(selectedPacks, catalog, null);
          const w = weightLabel(plan.installPlan);
          console.log(
            `\nSelected ${selectedPacks.length} pack(s) · estimated weight: ${w.label} (bloat ${w.total})`
          );
          const eccPack = packs.find((p) => p.id === "ecc");
          if (eccPack && selectedPacks.includes("ecc")) {
            eccProfile = await promptEccProfile(eccPack, null, { required: true });
          }
        }
      }
    }
    if (installKenmark && !ideArg) {
      const targetMap = buildGlobalTargets(os.homedir());
      const targetKeys = Object.keys(targetMap);
      const detected = detectInstalledIdes(targetMap);
      const managed = detectManagedIdes(targetMap);
      const ides = await promptIde(targetKeys, detected, {
        required: true,
        managedIdes: managed
      });
      ideArg = ides.length === targetKeys.length ? "all" : ides.join(",");
    }
    if (
      installKenmark &&
      !args.skipMcp &&
      !args.withMcp &&
      !args.mcpProfile &&
      !args.mcpServers
    ) {
      const picked = await promptMcpServers(listMcpServersForPrompt(repoRoot));
      if (picked.length) {
        mcpServers = picked.join(",");
      }
    }
  } else {
    if (args.recommendedOnly && args.skipRecommended) {
      console.error("Cannot use --recommended-only and --skip-recommended together.");
      process.exit(1);
    }
    installKenmark = !args.recommendedOnly;
    installRecommended =
      Boolean(args.recommendedOnly) ||
      Boolean(args.all) ||
      Boolean(args.ids?.length) ||
      Boolean(args.profile);
    if (args.skipRecommended) {
      installRecommended = false;
    }
    if (!mcpProfile && !mcpServers && args.withMcp) {
      mcpProfile = "all";
    }
    if (args.suggest) {
      const { printSuggest } = require("./recommended-catalog");
      printSuggest(loadCatalog(), process.cwd());
      process.exit(0);
    }
    if (installRecommended) {
      if (args.profile) {
        selectedPreset = args.profile;
      } else if (args.all) {
        selectedPacks = (loadCatalog().packs || []).map((p) => p.id);
      } else if (args.ids?.length) {
        selectedPacks = args.ids;
      } else {
        console.error(
          "Non-interactive recommended install requires --ids, --profile (preset), or --all (or use interactive init)."
        );
        process.exit(1);
      }
    }
    scope = "global";
  }

  const plan = [];
  if (installKenmark) {
    const ideLabel = ideArg || "auto-detect";
    plan.push(`Kenmark skills → ${scope} (${ideLabel})`);
    const mcpInstall = resolveMcpInstall({
      skipMcp: args.skipMcp,
      withMcp: args.withMcp,
      mcpProfile,
      mcpServers,
      repoRoot
    });
    if (mcpInstall.enabled) {
      plan.push(formatMcpPlanLine(mcpInstall.serverNames));
    }
  }
  if (installRecommended) {
    if (selectedPreset) {
      plan.push(`Recommended preset → ${scope}: ${selectedPreset}`);
    } else {
      plan.push(`Recommended packs → ${scope}: ${selectedPacks.join(", ")}`);
      if (eccProfile) plan.push(`  ECC profile: ${eccProfile}`);
    }
  }
  plan.push("Tip: run kenmark-init in your agent chat to bootstrap brain/ in a repo");

  if (!installKenmark && !installRecommended) {
    console.log("Nothing selected to install.");
    process.exit(0);
  }

  if (args.dryRun) {
    console.log("\nPlanned steps:");
    for (const line of plan) {
      console.log(`  • ${line}`);
    }
  }

  const ok =
    args.yes ||
    (await confirmPlan(plan, args.dryRun, interactive ? { requiredConfirm: true } : {}));
  if (!ok) {
    console.log("Cancelled.");
    process.exit(0);
  }

  if (args.dryRun) console.log("\n(dry-run — commands only)\n");

  if (installKenmark) {
    const setupArgs = ["--install", "-y"];
    if (ideArg) setupArgs.push("--ide", ideArg);
    if (args.skipMcp) setupArgs.push("--skip-mcp");
    if (args.withMcp) setupArgs.push("--with-mcp");
    if (mcpServers) {
      setupArgs.push("--mcp-servers", mcpServers);
    } else if (mcpProfile && mcpProfile !== "none") {
      setupArgs.push("--mcp-profile", mcpProfile);
    } else if (args.mcpProfile && args.mcpProfile !== "none") {
      setupArgs.push("--mcp-profile", args.mcpProfile);
    } else if (args.mcpServers) {
      setupArgs.push("--mcp-servers", args.mcpServers);
    }
    const result = runNode(setupScript, setupArgs, args.dryRun, "Kenmark skills");
    if (!args.dryRun && result.status !== 0) process.exit(result.status || 1);
  }

  if (installRecommended) {
    const recArgs = [];
    if (selectedPreset) {
      recArgs.push("--profile", selectedPreset);
    } else {
      recArgs.push("--ids", selectedPacks.join(","));
      if (eccProfile) recArgs.push("--ecc-profile", eccProfile);
    }
    if (ideArg) recArgs.push("--ide", ideArg);
    if (args.dryRun) recArgs.push("--dry-run");
    recArgs.push("-y");
    const result = runNode(recommendedScript, recArgs, args.dryRun, "Recommended packs");
    if (!args.dryRun && result.status !== 0) process.exit(result.status || 1);
  }

  console.log("\n✓ Init complete.");
  console.log("Next: open your IDE, start a new agent chat, and try /kenmark-router or kenmark-init.");
  console.log("Restart the IDE if skills do not appear immediately.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
