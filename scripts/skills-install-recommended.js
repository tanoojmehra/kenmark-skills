#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");
const os = require("os");
const {
  wantsInteractive,
  promptScope,
  promptSelectPacks,
  promptSelectProfile,
  printProfileSummary,
  promptHighBloatConfirm,
  promptEccProfile,
  confirmPlan,
  banner
} = require("./interactive");
const {
  loadCatalog,
  getPack,
  resolveProfilePlan,
  summarizeProfile,
  resolveInstallCommands,
  runGitSyncInstall,
  listProfiles,
  defaultProfileId
} = require("./recommended-catalog");
const {
  buildGlobalTargets,
  buildProjectTargets,
  adoptCatalogSkills
} = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "skills", "user-skills");
const catalogPath = path.join(sourceDir, "recommended-catalog.json");

function printUsage() {
  console.log("Usage: node scripts/skills-install-recommended.js [options]");
  console.log("");
  console.log("Interactive by default in a terminal. Agents: pass --profile or --ids + -y.");
  console.log("");
  console.log("Runs each pack's install command, then adopts into ~/.kenmark/store and relinks IDEs.");
  console.log("Use --skip-adopt to disable the consolidation pass.");
  console.log("");
  console.log("Options:");
  console.log("  --list              Print catalog packs and exit");
  console.log("  --list-profiles     Print setup profiles and exit");
  console.log("  --profile <id>      Install a catalog profile (lean, core-next, growth-seo, …)");
  console.log("  --all               Install every pack in the catalog (legacy; prefer --profile)");
  console.log("  --ids a,b           Install specific pack ids (custom selection)");
  console.log("  --global            Install to user home (default)");
  console.log("  --project           Install into current project directory");
  console.log("  --scope global|project");
  console.log("  --ecc-profile <id>  Override ECC profile (minimal, core, full)");
  console.log("  --ide <target>      Limit adopt/relink to one IDE: cursor, claude, all, …");
  console.log("  --skip-adopt        Skip post-install catalog adoption");
  console.log("  --copy              Copy into IDE paths instead of symlinks (adopt relink)");
  console.log("  --symlink           Force symlinks on Windows instead of copy (adopt relink)");
  console.log("  --prefer-copy-on-windows     Copy on Windows during adopt relink (default)");
  console.log("  --no-prefer-copy-on-windows  Symlink/junction on Windows during adopt relink");
  console.log("  --adopt-overwrite   Overwrite store when IDE copy differs (--force alias)");
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
    if (t === "--list-profiles") {
      args.listProfiles = true;
      continue;
    }
    if (t === "--profile") {
      args.profile = (argv[i + 1] || "").trim();
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
    if (t === "--force" || t === "--adopt-overwrite") {
      args.force = true;
      args.adoptOverwrite = true;
      continue;
    }
  }
  return args;
}

function printCatalog(catalog) {
  const defaultScope = catalog.defaults?.scope || "global";
  const defaultProfile = defaultProfileId(catalog);
  console.log(
    `Recommended skill packs (catalog v${catalog.version}, default scope: ${defaultScope}, default profile: ${defaultProfile})\n`
  );
  if (catalog.installRules?.guidance) {
    console.log(`Install rule: ${catalog.installRules.guidance}\n`);
  }
  for (const pack of catalog.packs) {
    console.log(`  ${pack.id}`);
    console.log(`    ${pack.name} — ${pack.category} (weight: ${pack.weight || "?"}, bloat: ${pack.bloatScore ?? "?"})`);
    console.log(`    ${pack.description}`);
    console.log(`    ${pack.url}`);
    if (pack.bestFor?.length) {
      console.log(`    best for: ${pack.bestFor.join(", ")}`);
    }
    if (pack.avoidWhen?.length) {
      console.log(`    avoid when: ${pack.avoidWhen.join(", ")}`);
    }
    if (pack.install?.global?.command) {
      console.log(`    global:  ${pack.install.global.command}`);
    }
    if (pack.install?.profiles?.length) {
      const names = pack.install.profiles.map((p) => p.id).join(", ");
      console.log(`    ECC profiles: ${names} (recommended: ${pack.recommendedProfile || pack.install.defaultProfile})`);
    }
    if (pack.installModes?.length) {
      console.log(`    install modes: ${pack.installModes.join(", ")} (default: ${pack.defaultMode})`);
    }
    if (pack.warning) {
      console.log(`    ⚠ ${pack.warning}`);
    }
    console.log("");
  }
}

function printProfiles(catalog) {
  const defaultProfile = defaultProfileId(catalog);
  console.log(`Setup profiles (catalog v${catalog.version}, default: ${defaultProfile})\n`);
  for (const p of listProfiles(catalog)) {
    const tags = [];
    if (p.id === defaultProfile || p.default) tags.push("default");
    if (p.kenmarkRecommended) tags.push("Kenmark stack");
    console.log(`  ${p.id}`);
    console.log(`    ${p.name}`);
    console.log(`    ${p.description}`);
    if (p.recommendedFor?.length) {
      console.log(`    for: ${p.recommendedFor.join(", ")}`);
    }
    const summary = summarizeProfile(p.id, catalog);
    if (summary?.installLines?.length) {
      console.log(`    installs: ${summary.installLines.join(", ")}`);
      console.log(`    weight: ${summary.weight} · bloat risk: ${summary.bloatRisk}`);
    }
    if (p.extends) console.log(`    extends: ${p.extends}`);
    if (p.requiresConfirmation) console.log("    ⚠ requires confirmation (high bloat)");
    console.log("");
  }
  console.log("Install: npx kenmark-skills install-recommended --profile <id> --global -y");
}

function planFromPackIds(packIds, catalog, eccProfileOverride) {
  const refs = packIds.map((id) => ({ id }));
  const installPlan = refs.map((ref) => {
    const pack = getPack(catalog, ref.id);
    if (!pack) return { packId: ref.id, missing: true, ref };
    const eccProfile =
      ref.id === "ecc"
        ? eccProfileOverride ||
          pack.recommendedProfile ||
          pack.install?.defaultProfile ||
          "minimal"
        : null;
    return {
      packId: ref.id,
      pack,
      ref,
      eccProfile,
      seoSkills: null,
      seoMode: ref.id === "seo-geo-claude-skills" ? pack.defaultMode || "full" : null
    };
  });
  return { profileId: null, profile: null, packRefs: refs, installPlan };
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

function runInstallCommand(cmdEntry, dryRun) {
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

function verifyPack(pack, scope) {
  const cmd = pack.install?.verify?.[scope] || pack.install?.verify;
  if (!cmd || typeof cmd !== "string") return null;
  const cwd = scope === "project" ? process.cwd() : undefined;
  const result = spawnSync(cmd, {
    shell: true,
    encoding: "utf8",
    cwd: cwd || process.cwd()
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
    printCatalog(catalog);
    process.exit(0);
  }

  if (args.listProfiles) {
    printProfiles(catalog);
    process.exit(0);
  }

  let scope = args.scope;
  if (scope && scope !== "global" && scope !== "project") {
    console.error('Invalid --scope (use "global" or "project")');
    process.exit(1);
  }

  let resolved = null;
  let selectedIds = args.ids || [];

  if (args.profile) {
    resolved = resolveProfilePlan(args.profile, catalog);
    if (!resolved) {
      console.error(`Unknown profile: ${args.profile}`);
      console.error(`Use --list-profiles. Available: ${listProfiles(catalog).map((p) => p.id).join(", ")}`);
      process.exit(1);
    }
  } else if (args.all) {
    selectedIds = packs.map((p) => p.id);
    resolved = planFromPackIds(selectedIds, catalog, args.eccProfile);
  }

  const interactive =
    wantsInteractive(args) &&
    !args.profile &&
    selectedIds.length === 0 &&
    !args.all;

  if (interactive) {
    banner("kenmark-skills install-recommended", "Curated packs by profile — lean default");
    scope = await promptScope(catalog.defaults?.scope || "global", { required: true });
    const profiles = listProfiles(catalog);
    const choice = await promptSelectProfile(
      profiles,
      defaultProfileId(catalog)
    );
    if (!choice) {
      console.log("Cancelled.");
      process.exit(0);
    }
    if (choice === "custom") {
      selectedIds = await promptSelectPacks(packs, { noDefaults: true });
      if (selectedIds.length === 0) {
        console.log("No packs selected. Exiting.");
        process.exit(0);
      }
      resolved = planFromPackIds(selectedIds, catalog, null);
    } else {
      resolved = resolveProfilePlan(choice, catalog);
      const summary = summarizeProfile(choice, catalog);
      printProfileSummary(summary);
    }
  } else if (!scope) {
    scope = catalog.defaults?.scope || "global";
  }

  if (!resolved && selectedIds.length > 0) {
    resolved = planFromPackIds(selectedIds, catalog, args.eccProfile);
  }

  if (!resolved) {
    console.log("No profile or packs selected. Use --profile, --ids, or run interactively.");
    process.exit(0);
  }

  let { installPlan, profile } = resolved;
  installPlan = applyEccOverride(installPlan, args.eccProfile);

  const missing = installPlan.filter((e) => e.missing);
  if (missing.length) {
    console.error(`Unknown pack ids in plan: ${missing.map((e) => e.packId).join(", ")}`);
    process.exit(1);
  }

  if (profile?.requiresConfirmation && !args.yes) {
    const okBloat = await promptHighBloatConfirm();
    if (!okBloat) {
      console.log("Cancelled.");
      process.exit(0);
    }
  }

  const eccEntry = installPlan.find((e) => e.pack?.id === "ecc");
  let eccProfile = eccEntry?.eccProfile || args.eccProfile || "minimal";
  if (eccEntry && interactive && !args.eccProfile && !resolved.profileId) {
    eccProfile = await promptEccProfile(eccEntry.pack, eccProfile, { required: true });
    installPlan = installPlan.map((e) =>
      e.pack?.id === "ecc" ? { ...e, eccProfile } : e
    );
  }

  const fullTargetMap =
    scope === "project" ? buildProjectTargets(process.cwd()) : buildGlobalTargets(os.homedir());
  let targetMap = fullTargetMap;
  if (args.explicitIde && args.ide) {
    if (args.ide === "all") {
      // keep full map
    } else if (fullTargetMap[args.ide]) {
      targetMap = { [args.ide]: fullTargetMap[args.ide] };
    } else {
      console.error(`Unknown --ide value: ${args.ide}`);
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

  const planLines = [
    resolved.profileId
      ? `Profile "${resolved.profileId}" (${profile?.name || resolved.profileId}) · scope ${scope}`
      : `Custom packs · scope ${scope}`,
    `Packs: ${packLabels.join(", ")}`,
    ...installPlan.flatMap((entry) =>
      resolveInstallCommands(entry, scope, catalog).map((c) => c.command)
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
    `\nInstalling ${installPlan.length} pack(s) · scope "${scope}"${resolved.profileId ? ` · profile ${resolved.profileId}` : ""}`
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
      const result = runInstallCommand(cmdEntry, args.dryRun);
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
    if (!args.dryRun && pack.install?.verify) {
      const okVerify = verifyPack(pack, scope);
      console.log(
        okVerify ? "Verify: OK" : "Verify: not detected — check install manually"
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
