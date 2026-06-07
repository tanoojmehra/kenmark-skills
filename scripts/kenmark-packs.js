#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");
const os = require("os");
const {
  wantsInteractive,
  promptScope,
  promptSelectOptionalPacks,
  promptEccProfile,
  confirmPlan,
  banner
} = require("./interactive");
const {
  loadCatalog,
  getPack,
  resolvePresetPlan,
  resolveProfilePlan,
  resolveInstallCommands,
  formatInstallPlanLine,
  resolveVerifyCommand,
  runGitSyncInstall,
  listPresets,
  defaultSelectedIds,
  planFromPackIds,
  resolvePresetPackRefs,
  printSuggest,
  explainPack,
  printOptionalList,
  suggestPacks,
  weightLabel
} = require("./recommended-catalog");
const {
  buildGlobalTargets,
  buildProjectTargets,
  adoptCatalogSkills,
  resolveExplicitTargetIdes,
  buildTargetMapForIdes
} = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "skills", "user-skills");
const catalogPath = path.join(sourceDir, "recommended-catalog.json");

function printUsage() {
  console.log("Usage: node scripts/kenmark-packs.js [options]");
  console.log("");
  console.log("Interactive: checklist of optional installs with repo-aware suggestions.");
  console.log("Agents: pass --ids or --preset (or --profile alias) + -y.");
  console.log("");
  console.log("Runs each pack's install command, then adopts into ~/.kenmark/store and relinks IDEs.");
  console.log("Use --skip-adopt to disable the consolidation pass.");
  console.log("");
  console.log("Options:");
  console.log("  --list              List all optional installs with metadata");
  console.log("  --suggest           Print repo-aware recommendations (no install)");
  console.log("  --explain [id]      Detailed explain for one pack or entire catalog");
  console.log("  --list-profiles     List presets (legacy alias; same as --list-presets)");
  console.log("  --list-presets      List advanced presets (CI / power users)");
  console.log("  --preset <id>       Install a preset (lean, core-next, growth-seo, …)");
  console.log("  --profile <id>      Alias for --preset (backward compatible)");
  console.log("  --all               Install every pack (legacy)");
  console.log("  --ids a,b           Install specific pack ids");
  console.log("  --global            Install to user home (default)");
  console.log("  --project           Install into current project directory");
  console.log("  --scope global|project");
  console.log("  --ecc-profile <id>  Override ECC profile (minimal, core, full)");
  console.log("  --ide <target>      Limit adopt/relink: cursor, cursor,codex,claude, all, …");
  console.log("  --skip-adopt        Skip post-install catalog adoption");
  console.log("  --copy              Copy into IDE paths instead of symlinks (adopt relink)");
  console.log("  --symlink           Force symlinks on Windows instead of copy (adopt relink)");
  console.log("  --prefer-copy-on-windows     Copy on Windows during adopt relink (default)");
  console.log("  --no-prefer-copy-on-windows  Symlink/junction on Windows during adopt relink");
  console.log("  --force             Re-run pack installers even when verify passes");
  console.log("  --adopt-overwrite   Overwrite store when IDE copy differs");
  console.log("  --dry-run           Show commands without running");
  console.log("  -y, --yes           Skip confirmation prompts");
  console.log("  -h, --help          Show help");
}

function parseArgs(argv) {
  const args = {
    yes: false,
    dryRun: false,
    scope: null,
    eccProfile: null,
    preset: null,
    profile: null,
    ide: null,
    explicitIde: false,
    skipAdopt: false,
    forceCopy: false,
    forceSymlink: false,
    preferCopyOnWindows: true,
    force: false,
    adoptOverwrite: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === "-h" || t === "--help") {
      args.help = true;
      continue;
    }
    if (t === "--list") {
      args.list = true;
      continue;
    }
    if (t === "--suggest") {
      args.suggest = true;
      continue;
    }
    if (t === "--explain") {
      const next = (argv[i + 1] || "").trim();
      if (next && !next.startsWith("-")) {
        args.explain = next;
        i += 1;
      } else {
        args.explain = true;
      }
      continue;
    }
    if (t === "--list-profiles" || t === "--list-presets") {
      args.listPresets = true;
      continue;
    }
    if (t === "--preset" || t === "--profile") {
      const id = (argv[i + 1] || "").trim();
      args.preset = id;
      args.profile = id;
      i += 1;
      continue;
    }
    if (t === "--all") {
      args.all = true;
      continue;
    }
    if (t === "--ids") {
      args.ids = (argv[i + 1] || "").split(",").map((s) => s.trim()).filter(Boolean);
      i += 1;
      continue;
    }
    if (t === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (t === "-y" || t === "--yes") {
      args.yes = true;
      continue;
    }
    if (t === "--global") {
      args.scope = "global";
      continue;
    }
    if (t === "--project") {
      args.scope = "project";
      continue;
    }
    if (t === "--scope") {
      args.scope = (argv[i + 1] || "").trim().toLowerCase();
      i += 1;
      continue;
    }
    if (t === "--ecc-profile") {
      args.eccProfile = (argv[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (t === "--ide") {
      args.ide = (argv[i + 1] || "").trim().toLowerCase() || null;
      args.explicitIde = true;
      i += 1;
      continue;
    }
    if (t === "--skip-adopt") {
      args.skipAdopt = true;
      continue;
    }
    if (t === "--copy") {
      args.forceCopy = true;
      continue;
    }
    if (t === "--symlink") {
      args.forceSymlink = true;
      continue;
    }
    if (t === "--prefer-copy-on-windows") {
      args.preferCopyOnWindows = true;
      continue;
    }
    if (t === "--no-prefer-copy-on-windows") {
      args.preferCopyOnWindows = false;
      continue;
    }
    if (t === "--force") {
      args.force = true;
      continue;
    }
    if (t === "--adopt-overwrite") {
      args.adoptOverwrite = true;
      continue;
    }
  }
  return args;
}

function printPresets(catalog) {
  const presets = listPresets(catalog);
  console.log(
    `Presets — advanced / CI shortcuts (catalog v${catalog.version}; not the primary UX)\n`
  );
  for (const p of presets) {
    const refs = resolvePresetPackRefs(p.id, catalog) || [];
    console.log(`  ${p.id}`);
    console.log(`    ${p.name}`);
    console.log(`    ${p.description || ""}`);
    console.log(`    packs: ${refs.map((r) => r.id).join(", ")}`);
    if (p.extends) console.log(`    extends: ${p.extends}`);
    if (p.requiresConfirmation) console.log("    ⚠ requires confirmation (high bloat)");
    console.log("");
  }
  console.log("Install: npx kenmark-skills install-recommended --preset <id> --global -y");
}

function applyEccOverride(installPlan, eccProfileOverride) {
  if (!eccProfileOverride) return installPlan;
  return installPlan.map((entry) =>
    entry.pack?.id === "ecc" ? { ...entry, eccProfile: eccProfileOverride } : entry
  );
}

function runShell(command, dryRun, cwd) {
  const prefix = cwd ? `(cwd: ${cwd}) ` : "";
  console.log(`\n$ ${prefix}${command}`);
  if (dryRun) return { status: 0 };
  return spawnSync(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
    cwd: cwd || process.cwd()
  });
}

function runInstallCommand(cmdEntry, dryRun, packId) {
  if (cmdEntry.strategy === "manual") {
    const msg =
      cmdEntry.message ||
      `Manual install required for ${packId || "pack"}`;
    console.log(`Manual install: ${msg}`);
    if (cmdEntry.manualSteps?.length) {
      console.log("Steps:");
      for (const step of cmdEntry.manualSteps) {
        console.log(`  ${step}`);
      }
    }
    return { status: 0 };
  }
  if (cmdEntry.strategy === "git-sync") {
    return runGitSyncInstall({
      repoUrl: cmdEntry.repoUrl,
      targetPath: cmdEntry.targetPath,
      cwd: cmdEntry.cwd,
      dryRun
    });
  }
  return runShell(cmdEntry.command, dryRun, cmdEntry.cwd);
}

function verifyPack(pack, scope, entry) {
  const cmd = resolveVerifyCommand(pack, scope, entry);
  if (!cmd) return null;
  const cwd = scope === "project" ? process.cwd() : undefined;
  const home = process.env.HOME || os.homedir();
  const result = spawnSync(cmd, {
    shell: true,
    encoding: "utf8",
    stdio: "pipe",
    cwd: cwd || process.cwd(),
    env: { ...process.env, HOME: home }
  });
  return result.status === 0;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const catalog = loadCatalog();
  const packs = catalog.packs || [];

  if (args.list) {
    printOptionalList(catalog);
    process.exit(0);
  }

  if (args.suggest) {
    printSuggest(catalog, process.cwd());
    process.exit(0);
  }

  if (args.explain) {
    if (args.explain === true) {
      for (const pack of packs) {
        explainPack(pack, catalog, process.cwd());
        console.log("");
      }
    } else {
      const pack = getPack(catalog, args.explain);
      if (!pack) {
        console.error(`Unknown pack id: ${args.explain}`);
        process.exit(1);
      }
      explainPack(pack, catalog, process.cwd());
    }
    process.exit(0);
  }

  if (args.listPresets) {
    printPresets(catalog);
    process.exit(0);
  }

  let scope = args.scope;
  if (scope && scope !== "global" && scope !== "project") {
    console.error('Invalid --scope (use "global" or "project")');
    process.exit(1);
  }

  let resolved = null;
  let selectedIds = args.ids || [];

  const requestedPresetId = args.preset || args.profile;
  if (requestedPresetId) {
    resolved =
      resolvePresetPlan(requestedPresetId, catalog) ||
      resolveProfilePlan(requestedPresetId, catalog);
    if (!resolved) {
      console.error(`Unknown preset: ${requestedPresetId}`);
      console.error(
        `Use --list-presets. Available: ${listPresets(catalog).map((p) => p.id).join(", ")}`
      );
      process.exit(1);
    }
    const preset = resolved.preset || resolved.profile;
    if (preset?.requiresConfirmation && !args.yes) {
      const { promptHighBloatConfirm } = require("./interactive");
      const ok = await promptHighBloatConfirm();
      if (!ok) process.exit(0);
    }
  } else if (args.all) {
    selectedIds = packs.map((p) => p.id);
    resolved = planFromPackIds(selectedIds, catalog, args.eccProfile);
  }

  const interactive =
    wantsInteractive(args) &&
    !requestedPresetId &&
    selectedIds.length === 0 &&
    !args.all;

  if (interactive) {
    banner(
      "kenmark-skills install-recommended",
      "Optional third-party installs — select what you want"
    );
    scope = await promptScope(catalog.defaults?.scope || "global", { required: true });
    const suggestions = suggestPacks(catalog, process.cwd());
    selectedIds = await promptSelectOptionalPacks(packs, suggestions, {
      defaultIds: defaultSelectedIds(catalog)
    });
    if (selectedIds.length === 0) {
      console.log("No packs selected. Exiting.");
      process.exit(0);
    }
    resolved = planFromPackIds(selectedIds, catalog, null);
    const w = weightLabel(resolved.installPlan);
    console.log(`\nSelected ${selectedIds.length} pack(s) · estimated weight: ${w.label} (bloat ${w.total})`);
  } else if (!scope) {
    scope = catalog.defaults?.scope || "global";
  }

  if (!resolved && selectedIds.length > 0) {
    resolved = planFromPackIds(selectedIds, catalog, args.eccProfile);
  }

  if (!resolved) {
    console.log("No packs selected. Use --ids, --preset, --suggest, or run interactively.");
    process.exit(0);
  }

  let { installPlan, preset, profile } = resolved;
  const presetMeta = preset || profile;
  installPlan = applyEccOverride(installPlan, args.eccProfile);

  const missing = installPlan.filter((e) => e.missing);
  if (missing.length) {
    console.error(`Unknown pack ids in plan: ${missing.map((e) => e.packId).join(", ")}`);
    process.exit(1);
  }

  const eccEntry = installPlan.find((e) => e.pack?.id === "ecc");
  let eccProfile = eccEntry?.eccProfile || args.eccProfile || "minimal";
  if (eccEntry && interactive && !args.eccProfile) {
    eccProfile = await promptEccProfile(eccEntry.pack, eccProfile, { required: true });
    installPlan = installPlan.map((e) =>
      e.pack?.id === "ecc" ? { ...e, eccProfile } : e
    );
  }

  const fullTargetMap =
    scope === "project" ? buildProjectTargets(process.cwd()) : buildGlobalTargets(os.homedir());
  let targetMap = fullTargetMap;
  if (args.explicitIde && args.ide) {
    try {
      const targetIdes = resolveExplicitTargetIdes(args.ide, fullTargetMap);
      targetMap = buildTargetMapForIdes(fullTargetMap, targetIdes);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  }
  const adoptIdes = Object.keys(targetMap);

  const packLabels = installPlan.map((e) => {
    let label = e.packId;
    if (e.eccProfile) label += `@${e.eccProfile}`;
    if (e.seoSkills?.length) label += `+${e.seoSkills.length}seo`;
    return label;
  });

  const presetId = resolved.presetId || resolved.profileId;
  const planLines = [
    presetId
      ? `Preset "${presetId}" (${presetMeta?.name || presetId}) · scope ${scope}`
      : `Selected packs · scope ${scope}`,
    `Packs: ${packLabels.join(", ")}`,
    ...installPlan.flatMap((entry) =>
      resolveInstallCommands(entry, scope, catalog).map((c) =>
        formatInstallPlanLine(c, entry.packId)
      )
    )
  ];
  if (!args.skipAdopt) {
    planLines.push(
      `Adopt into ~/.kenmark/store + relink → ${adoptIdes.join(", ")}`
    );
  }

  const ok =
    args.yes ||
    (await confirmPlan(
      planLines,
      args.dryRun,
      interactive ? { requiredConfirm: true } : {}
    ));
  if (!ok) {
    console.log("Cancelled.");
    process.exit(0);
  }

  console.log(
    `\nInstalling ${installPlan.length} pack(s) · scope "${scope}"${presetId ? ` · preset ${presetId}` : ""}`
  );
  if (eccEntry) console.log(`ECC profile: ${eccProfile}`);
  if (scope === "project") {
    console.log(`Project directory: ${process.cwd()}`);
  }
  if (args.dryRun) console.log("(dry-run — commands only)\n");

  for (const entry of installPlan) {
    const pack = entry.pack;
    console.log(`\n━━━ ${pack.name} (${pack.id}) ━━━`);
    if (pack.warning) {
      console.log(`Warning: ${pack.warning}`);
    }

    const hasVerify = resolveVerifyCommand(pack, scope, entry);
    const alreadyInstalled =
      hasVerify &&
      !args.force &&
      !args.dryRun &&
      verifyPack(pack, scope, entry);

    if (alreadyInstalled) {
      console.log(
        `Already installed: ${pack.id} — skipping install. Use --force to reinstall.`
      );
      continue;
    }

    const commands = resolveInstallCommands(entry, scope, catalog);
    if (!commands.length) {
      console.error(`No ${scope} install command defined for ${pack.id}.`);
      continue;
    }
    for (let skillIndex = 0; skillIndex < commands.length; skillIndex += 1) {
      const cmdEntry = commands[skillIndex];
      if (entry.seoSkills?.length) {
        if (cmdEntry.batch) {
          console.log(
            `Installing SEO/GEO selected skills (${cmdEntry.skillCount} in one run): ${cmdEntry.label}`
          );
        } else if (commands.length > 1) {
          console.log(
            `Installing SEO/GEO selected skills: ${skillIndex + 1}/${commands.length} ${cmdEntry.label}`
          );
        } else if (cmdEntry.label) {
          console.log(`Installing SEO/GEO selected skill: ${cmdEntry.label}`);
        }
      } else if (cmdEntry.label) {
        console.log(`Skill: ${cmdEntry.label}`);
      }
      const result = runInstallCommand(cmdEntry, args.dryRun, pack.id);
      if (!args.dryRun && result.status !== 0) {
        console.error(`Install failed for ${pack.id} (exit ${result.status})`);
        if (pack.install?.alternatives?.length) {
          console.log("Alternatives:");
          for (const alt of pack.install.alternatives) {
            console.log(`  ${alt}`);
          }
        }
        break;
      }
    }
    if (!args.dryRun && hasVerify) {
      const okVerify = verifyPack(pack, scope, entry);
      const verifyHint =
        entry.seoSkills?.length > 1
          ? ` (${entry.seoSkills.length} SEO/GEO skills)`
          : entry.seoSkills?.length === 1
            ? ` (${entry.seoSkills[0]})`
            : "";
      console.log(
        okVerify
          ? `Verify: OK${verifyHint}`
          : `Verify: not detected${verifyHint} — check install manually`
      );
    }
  }

  if (!args.skipAdopt) {
    if (args.dryRun) {
      console.log("\n[dry-run] would adopt catalog skills into store + relink IDEs");
    } else {
      console.log("\n━━━ Adopt catalog skills ━━━");
      const adoptResult = adoptCatalogSkills({
        sourceUserSkillsDir: sourceDir,
        catalogPath,
        targetMap,
        eccProfile,
        homeDir: os.homedir(),
        packIds: installPlan.map((entry) => entry.packId),
        seoSkills: installPlan.flatMap((entry) => entry.seoSkills || []),
        force: args.force,
        adoptOverwrite: args.adoptOverwrite,
        forceCopy: args.forceCopy,
        forceSymlink: args.forceSymlink,
        preferCopyOnWindows: args.preferCopyOnWindows,
        dryRun: false
      });
      const adopted = adoptResult.results.filter(
        (r) => r.action === "adopted"
      ).length;
      const reviewRequired = adoptResult.results.filter(
        (r) => r.action === "review-required"
      ).length;
      const total = adoptResult.results.length;
      console.log(
        `Adopt pass: ${adopted} adopted/updated of ${total} candidate(s)`
      );
      if (reviewRequired) {
        console.log(
          `  ${reviewRequired} skill(s) need review (store differs from IDE copy). Re-run with --adopt-overwrite to overwrite.`
        );
      }
    }
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
