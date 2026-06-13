#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  wantsInteractive,
  promptAction,
  promptIde,
  promptMcpServers,
  confirmPlan,
  banner,
  rejectProjectScopeInArgv,
  normalizeCliArgv
} = require("./interactive");
const {
  buildGlobalTargets,
  buildMcpGlobalTargets,
  getStoreDir,
  getMcpStorePath,
  getBundledMcpPath,
  listKenmarkBundledSkillNames,
  installKenmarkSkillsToStoreWithLegacyCleanup,
  removeKenmarkClaudeCommandWrappers,
  relinkSkillsToIdes,
  adoptCatalogSkills,
  formatAdoptPassSummary,
  uninstallKenmarkFromIdes,
  installMcpToStore,
  installMcpToIdes,
  uninstallMcpFromIdes,
  resolveMcpInstall,
  resolveMcpProfileName,
  resolveMcpServerNames,
  buildMcpDocumentForServers,
  formatMcpPlanLine,
  listMcpServersForPrompt,
  listMcpProfileNames,
  listBundledMcpServerNames,
  detectInstalledIdes,
  detectManagedIdes,
  resolveExplicitTargetIdes,
  buildTargetMapForIdes,
  ensureKenmarkTargetPath,
  resolveFallbackTargetIdes,
  resolveLinkModeLabel,
  dedupeAliasTargetIdes,
  formatAliasTargetNote,
  removeAliasDuplicateLinks,
  getExtraProjectSkillPaths,
  shouldForceCopyForIde,
  MCP_CAPABLE_IDES
} = require("./kenmark-hub");

const homeDir = os.homedir();
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "skills", "user-skills");
const catalogPath = path.join(sourceDir, "recommended-catalog.json");

const globalTargets = buildGlobalTargets(homeDir);
const globalMcpTargets = buildMcpGlobalTargets(homeDir);
const bundledMcpPath = getBundledMcpPath(repoRoot);

const MCP_CAPABLE_IDE_SET = new Set(MCP_CAPABLE_IDES);

function printUsage() {
  console.log("Usage: kenmark-skills setup [options]");
  console.log("");
  console.log("Interactive by default in a terminal. Agents: pass flags + -y.");
  console.log("");
  console.log("Kenmark skills install to ~/.kenmark/store/skills, then link into each IDE.");
  console.log("Claude: namespaced kenmark-* skills only (no slash-command wrappers created).");
  console.log("After install, catalog skills already present in any IDE root are adopted");
  console.log("into ~/.kenmark/store and relinked (use --skip-adopt to disable).");
  console.log("MCP is opt-in. Pass --with-mcp, --mcp-profile <name>, or --mcp-servers <list>");
  console.log(
    `into ~/.kenmark/store/mcp.json and merge into IDE MCP configs (${MCP_CAPABLE_IDES.join(", ")}).`
  );
  console.log(`Profiles: ${listMcpProfileNames(repoRoot).join(", ")} (default: none).`);
  console.log(`Servers: ${listBundledMcpServerNames(repoRoot).join(", ")}.`);
  console.log("");
  console.log("Options:");
  console.log("  --install | --uninstall   Action (default: install)");
  console.log("  --ide <target>            cursor, claude, codex, antigravity-cli, antigravity, antigravity-ide, all, …");
  console.log("  --copy                    Copy into IDE paths instead of symlinks");
  console.log("  --symlink                 Force symlinks (Windows: junction) instead of copy");
  console.log("  --prefer-copy-on-windows  Copy on Windows (default: on)");
  console.log("  --strict-targets          Fail if no IDE is detected and --ide is missing");
  console.log("  --force                   Overwrite store even if present");
  console.log("  --keep-store              On uninstall, leave ~/.kenmark/store intact");
  console.log("  --skip-adopt              Skip post-install catalog adoption (advanced)");
  console.log("  --with-mcp                Install all bundled MCP servers (profile: all)");
  console.log("  --mcp-profile <name>      MCP profile: none, web, research, deep, all");
  console.log("  --mcp-servers <list>      MCP servers by name (e.g. playwright,context7,fetch)");
  console.log("  --skip-mcp                Skip MCP even if --with-mcp / --mcp-profile is set");
  console.log("  --mcp-only                Uninstall only Kenmark MCP (IDE configs + mcp store); keep skills");
  console.log("  --ecc-profile core        ECC profile (core, developer, …) when adopting");
  console.log("  --dry-run                 Show plan only");
  console.log("  -y, --yes                 Skip prompts");
  console.log("  -h, --help                Show help");
  console.log("");
  console.log("Examples:");
  console.log("  npx kenmark-skills setup");
  console.log("  npx kenmark-skills setup -y");
  console.log("  npx kenmark-skills setup --ide cursor,claude,codex -y");
  console.log("  npx kenmark-skills setup --skip-adopt --ide cursor -y");
  console.log("  npx kenmark-skills setup --mcp-profile web --ide cursor -y");
  console.log("  npx kenmark-skills setup --mcp-servers playwright,context7 --ide cursor -y");
  console.log("  npx kenmark-skills setup --with-mcp --ide cursor,claude,codex -y");
  console.log("  npx kenmark-skills uninstall --ide claude");
  console.log("  npx kenmark-skills uninstall --mcp-only --ide cursor -y");
  console.log("  npx kenmark-skills mcp uninstall --ide cursor -y");
  console.log("  npx kenmark-skills setup --ide all -y   # advanced: every detected IDE path");
}

function parseArgs(argv) {
  const args = {
    ide: null,
    mode: null,
    action: null,
    yes: false,
    dryRun: false,
    forceCopy: false,
    forceSymlink: false,
    preferCopyOnWindows: true,
    strictTargets: false,
    force: false,
    keepStore: true,
    skipAdopt: false,
    skipMcp: false,
    mcpOnly: false,
    withMcp: false,
    mcpProfile: null,
    mcpServers: null,
    eccProfile: null,
    explicitMode: false,
    explicitAction: false,
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
    if (token === "--uninstall") {
      args.action = "uninstall";
      args.explicitAction = true;
      continue;
    }
    if (token === "--install") {
      args.action = "install";
      args.explicitAction = true;
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
    if (token === "--prefer-copy-on-windows") {
      args.preferCopyOnWindows = true;
      continue;
    }
    if (token === "--no-prefer-copy-on-windows") {
      args.preferCopyOnWindows = false;
      continue;
    }
    if (token === "--strict-targets") {
      args.strictTargets = true;
      continue;
    }
    if (token === "--force") {
      args.force = true;
      continue;
    }
    if (token === "--keep-store") {
      args.keepStore = true;
      continue;
    }
    if (token === "--no-keep-store") {
      args.keepStore = false;
      continue;
    }
    if (token === "--skip-adopt") {
      args.skipAdopt = true;
      continue;
    }
    if (token === "--skip-mcp") {
      args.skipMcp = true;
      continue;
    }
    if (token === "--mcp-only") {
      args.mcpOnly = true;
      continue;
    }
    if (token === "--with-mcp") {
      args.withMcp = true;
      continue;
    }
    if (token === "--mcp-profile") {
      args.mcpProfile = (argv[i + 1] || "").trim() || null;
      i += 1;
      continue;
    }
    if (token === "--mcp-servers") {
      args.mcpServers = (argv[i + 1] || "").trim() || null;
      i += 1;
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
  return null;
}

function filterMcpIdes(targetIdes) {
  return targetIdes.filter((ide) => MCP_CAPABLE_IDE_SET.has(ide));
}

function executeInstall(targetMap, requestedTargetIdes, action, options) {
  const {
    dryRun,
    forceCopy,
    forceSymlink,
    preferCopyOnWindows,
    force,
    keepStore,
    skipAdopt,
    mcpInstall,
    mcpOnly,
    eccProfile,
    mcpTargetMap,
    projectDir = null
  } = options;
  const targetIdes = dedupeAliasTargetIdes(requestedTargetIdes);
  const aliasNote = formatAliasTargetNote(requestedTargetIdes, targetMap);
  const mcpIdes = filterMcpIdes(requestedTargetIdes);
  const installMcp = mcpInstall.enabled;
  const mcpServerNames = mcpInstall.serverNames || [];
  const mcpProfile = mcpInstall.profile;
  const skillNames = listKenmarkBundledSkillNames(sourceDir);
  const storeDir = getStoreDir();
  const linkMode = resolveLinkModeLabel({ forceCopy, forceSymlink, preferCopyOnWindows });
  const selectedTargetMap = buildTargetMapForIdes(targetMap, targetIdes);

  const plan = [];
  if (action === "install") {
    plan.push(`Populate Kenmark store → ${storeDir}`);
    if (aliasNote) {
      plan.push(aliasNote);
    }
    for (const ide of targetIdes) {
      const copyNote =
        shouldForceCopyForIde(ide, { forceSymlink }) && !forceCopy ? " (copy — IDE symlinks not discovered)" : "";
      plan.push(`Link Kenmark skills (${linkMode})${copyNote} → ${ide}: ${targetMap[ide]}`);
      if (projectDir) {
        for (const extraPath of getExtraProjectSkillPaths(ide, projectDir)) {
          plan.push(
            `Link Kenmark skills (copy) → ${ide} also: ${extraPath}`
          );
        }
      }
    }
    if (targetIdes.includes("claude")) {
      plan.push(
        `Remove stale Claude command wrappers → ${path.join(path.dirname(targetMap.claude), "commands")}`
      );
    }
    if (!skipAdopt) {
      plan.push("Adopt catalog skills found in selected IDE root(s) → store + relink");
    }
    if (installMcp && mcpIdes.length && fs.existsSync(bundledMcpPath)) {
      plan.push(
        `${formatMcpPlanLine(mcpServerNames)} → ${mcpIdes.join(", ")} (${getMcpStorePath()})`
      );
    }
  } else if (mcpOnly) {
    if (!mcpIdes.length) {
      plan.push(
        `No MCP-capable IDE in target list (use --ide ${MCP_CAPABLE_IDES.join(", ")}, or all)`
      );
    } else {
      for (const ide of mcpIdes) {
        plan.push(`Remove Kenmark MCP entries (if installed) → ${ide}: ${mcpTargetMap[ide]}`);
      }
      plan.push(`Remove Kenmark MCP store → ${getMcpStorePath()}`);
    }
  } else {
    for (const ide of targetIdes) {
      plan.push(`Remove Kenmark skill links → ${ide}: ${targetMap[ide]}`);
    }
    if (!keepStore) {
      plan.push(`Remove Kenmark store → ${storeDir}`);
    }
    if (mcpIdes.length) {
      for (const ide of mcpIdes) {
        plan.push(`Remove Kenmark MCP entries (if installed) → ${ide}: ${mcpTargetMap[ide]}`);
      }
    }
  }

  return {
    plan,
    run: () => {
      if (action === "install") {
        const storeResult = installKenmarkSkillsToStoreWithLegacyCleanup(
          sourceDir,
          selectedTargetMap,
          { force, dryRun }
        );
        if (!dryRun) {
          console.log(`Kenmark store: ${storeDir}`);
          for (const r of storeResult.results) {
            if (r.action === "updated-store") {
              console.log(`  store: ${r.name} (updated)`);
            }
          }
        } else {
          console.log(`[dry-run] would populate store at ${storeDir}`);
        }

        const legacyRemoved =
          storeResult.legacyCleanup?.filter((r) => r.action === "removed") || [];
        const legacyReview =
          storeResult.legacyCleanup?.filter(
            (r) => r.action === "legacy-candidate-review-required"
          ) || [];
        if (!dryRun && legacyRemoved.length) {
          console.log(
            `Removed legacy Kenmark skill paths (${legacyRemoved.length}) (backed up under ~/.kenmark/backups/legacy-cleanup/)`
          );
        }
        if (!dryRun && legacyReview.length) {
          console.log(
            `Legacy skill name(s) left in place — ownership unclear (${legacyReview.length}). Review paths or remove manually.`
          );
          for (const r of legacyReview) {
            console.log(`  review: ${r.path}`);
          }
        }

        if (!dryRun && targetIdes.includes("claude")) {
          const commandRemoved =
            storeResult.legacyCommandCleanup?.filter((r) => r.action === "removed") ||
            [];
          const commandReview =
            storeResult.legacyCommandCleanup?.filter(
              (r) => r.action === "legacy-candidate-review-required"
            ) || [];
          if (commandRemoved.length) {
            const commandsDir = path.join(path.dirname(targetMap.claude), "commands");
            console.log(
              `Removed stale Claude command wrappers (${commandRemoved.length}): ${commandsDir}`
            );
          }
          if (commandReview.length) {
            console.log(
              `Claude command file(s) left in place — ownership unclear (${commandReview.length})`
            );
            for (const r of commandReview) {
              console.log(`  review: ${r.path}`);
            }
          }
        }

        let loggedAntigravityCopyNote = false;
        for (const ide of targetIdes) {
          const targetPath = targetMap[ide];
          if (dryRun) {
            console.log(
              `[dry-run] would link ${skillNames.length} skills to ${targetPath}`
            );
            for (const extraPath of getExtraProjectSkillPaths(ide, projectDir)) {
              console.log(
                `[dry-run] would also link ${skillNames.length} skills to ${extraPath}`
              );
            }
            continue;
          }
          ensureKenmarkTargetPath(targetPath);
          for (const extraPath of getExtraProjectSkillPaths(ide, projectDir)) {
            ensureKenmarkTargetPath(extraPath);
          }
          if (
            shouldForceCopyForIde(ide, { forceSymlink }) &&
            !forceCopy &&
            !loggedAntigravityCopyNote
          ) {
            console.log(
              "Antigravity: using copy (symlinks not discovered by Antigravity CLI/IDE)"
            );
            loggedAntigravityCopyNote = true;
          }
          const linkResults = relinkSkillsToIdes(skillNames, { [ide]: targetPath }, {
            forceCopy,
            forceSymlink,
            preferCopyOnWindows,
            dryRun: false,
            projectDir
          });
          console.log(`Linked skills for ${ide}: ${targetPath}`);
          const modes = [...new Set(linkResults.map((r) => r.mode).filter(Boolean))];
          if (modes.length) {
            console.log(`  link mode(s): ${modes.join(", ")}`);
          }
        }

        if (!skipAdopt) {
          if (dryRun) {
            console.log("\n[dry-run] would adopt catalog skills into store + relink IDEs");
          } else {
            console.log("\n━━━ Adopt catalog skills ━━━");
            const adoptResult = adoptCatalogSkills({
              sourceUserSkillsDir: sourceDir,
              catalogPath,
              targetMap: selectedTargetMap,
              eccProfile,
              homeDir,
              force: false,
              forceCopy,
              forceSymlink,
              preferCopyOnWindows,
              dryRun: false,
              projectDir
            });
            const adoptSummary = formatAdoptPassSummary(adoptResult.results);
            console.log(adoptSummary.line);
            if (adoptSummary.reviewRequired) {
              console.log(
                `  ${adoptSummary.reviewRequired} skill(s) need review (store differs from IDE copy). Run adopt --adopt-overwrite to overwrite.`
              );
            }
          }
        }

        if (installMcp && mcpIdes.length && fs.existsSync(bundledMcpPath)) {
          const { doc, serverNames } = buildMcpDocumentForServers(repoRoot, mcpServerNames);
          if (dryRun) {
            console.log(
              `\n[dry-run] would install MCP servers (${serverNames.join(", ")})`
            );
          } else {
            console.log("\n━━━ MCP servers ━━━");
            if (mcpProfile) {
              console.log(`Profile: ${mcpProfile}`);
            }
            console.log(`Servers: ${serverNames.join(", ")}`);
            const storeMcp = installMcpToStore(bundledMcpPath, {
              force,
              dryRun: false,
              mcpDoc: doc,
              profile: mcpProfile
            });
            console.log(`MCP store: ${getMcpStorePath()} (${storeMcp.action})`);
            const mcpResults = installMcpToIdes(mcpTargetMap, mcpIdes, {
              force,
              dryRun: false,
              repoRoot
            });
            for (const r of mcpResults.results) {
              const added = r.added?.length ? r.added.join(", ") : "none";
              const skipped = r.skipped?.length ? r.skipped.join(", ") : "none";
              console.log(`  ${r.ide}: ${r.targetPath}`);
              console.log(`    added: ${added}; skipped (already present): ${skipped}`);
            }
            console.log(
              "Restart your IDE or agent CLI if MCP tools do not appear immediately."
            );
          }
        }

        if (!dryRun) {
          const dedupeResult = removeAliasDuplicateLinks(targetMap);
          if (dedupeResult.removed > 0) {
            console.log(
              `Removed shared-path duplicate skill links (${dedupeResult.removed}) from ${targetMap.gemini}`
            );
          }
        }

        console.log("Done.");
        return;
      }

      if (mcpIdes.length) {
        if (dryRun) {
          console.log("[dry-run] would remove Kenmark MCP server entries from IDE configs");
        } else {
          console.log("\n━━━ MCP uninstall ━━━");
          const mcpUninstall = uninstallMcpFromIdes(mcpTargetMap, mcpIdes, {
            dryRun: false
          });
          if (mcpUninstall.serverNames.length) {
            console.log(
              `Removed Kenmark MCP servers (${mcpUninstall.serverNames.join(", ")}) from IDE configs.`
            );
            for (const r of mcpUninstall.results) {
              if (r.action === "removed-servers") {
                console.log(`  ${r.ide}: ${r.targetPath}`);
              }
            }
          } else {
            console.log(
              "No Kenmark MCP installation found (manifest has no MCP servers). Skills were not changed."
            );
          }
        }
      } else if (mcpOnly) {
        console.log(
          `No MCP-capable IDE in target list. Use --ide ${MCP_CAPABLE_IDES.join(", ")}, or all.`
        );
      }

      if (mcpOnly) {
        if (dryRun) {
          console.log("[dry-run] MCP uninstall complete (no files changed)");
        } else {
          console.log("Done (MCP only — Kenmark skills unchanged).");
        }
        return;
      }

      const uninstallResults = uninstallKenmarkFromIdes(skillNames, selectedTargetMap, {
        keepStore,
        dryRun
      });
      if (dryRun) {
        console.log("[dry-run] uninstall complete (no files changed)");
        return;
      }

      let removedCount = 0;
      for (const r of uninstallResults) {
        if (r.action === "removed") removedCount += 1;
      }
      console.log(`Removed ${removedCount} Kenmark skill path(s) from IDE directories.`);

      if (targetIdes.includes("claude")) {
        const claudePath = targetMap.claude;
        const commandResults = removeKenmarkClaudeCommandWrappers(
          claudePath,
          skillNames,
          { dryRun: false }
        );
        const removed = commandResults.filter((r) => r.action === "removed").length;
        const commandsDir = path.join(path.dirname(claudePath), "commands");
        if (removed) {
          console.log(
            `Removed Claude command wrappers (${removed}): ${commandsDir}`
          );
        }
        const review = commandResults.filter(
          (r) => r.action === "legacy-candidate-review-required"
        );
        if (review.length) {
          console.log(
            `Claude command file(s) left in place — ownership unclear (${review.length})`
          );
          for (const r of review) {
            console.log(`  review: ${r.path}`);
          }
        }
      }

      if (!keepStore) {
        console.log(`Cleared Kenmark store entries for bundled skills under ${storeDir}`);
      } else {
        console.log(`Kenmark store preserved at ${storeDir} (--keep-store default)`);
      }
      console.log("Done.");
    }
  };
}

async function run() {
  rejectProjectScopeInArgv(process.argv.slice(2));
  const args = parseArgs(normalizeCliArgv(process.argv.slice(2)));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!fs.existsSync(sourceDir)) {
    console.error(`Source skills directory missing: ${sourceDir}`);
    process.exit(1);
  }

  const interactive = wantsInteractive(args);

  if (interactive && !args.yes) {
    banner("kenmark-skills setup", "Interactive · flags + -y for agents");
  }

  let mode = "global";
  let action = args.action;
  let targetIdes = resolveTargetIdes(args, globalTargets);

  if (interactive) {
    if (!args.explicitAction) {
      action = await promptAction(action || "install");
    }
    if (!args.explicitIde) {
      const detected = detectInstalledIdes(globalTargets);
      const managed = detectManagedIdes(globalTargets);
      targetIdes = await promptIde(Object.keys(globalTargets), detected, {
        managedIdes: managed
      });
    }
    if (
      (action || "install") === "install" &&
      !args.skipMcp &&
      !args.withMcp &&
      !args.mcpProfile &&
      !args.mcpServers
    ) {
      const picked = await promptMcpServers(listMcpServersForPrompt(repoRoot));
      if (picked.length) {
        args.mcpServers = picked.join(",");
      }
    }
  }

  action = action || "install";

  if (args.mcpOnly && action !== "uninstall") {
    console.error("--mcp-only is only valid with uninstall (e.g. npx kenmark-skills mcp uninstall -y)");
    process.exit(1);
  }
  if (args.mcpOnly) {
    action = "uninstall";
  }

  const targetMap = globalTargets;
  const mcpTargetMap = globalMcpTargets;

  if (!targetIdes) {
    targetIdes = resolveTargetIdes(args, targetMap);
  }
  if (!targetIdes) {
    const fallback = resolveFallbackTargetIdes({
      targetMap,
      strictTargets: args.strictTargets,
      mode
    });
    targetIdes = fallback.targetIdes;
    if (fallback.message) {
      console.log(fallback.message);
    }
  }

  const mcpInstall = resolveMcpInstall({
    skipMcp: args.skipMcp,
    withMcp: args.withMcp,
    mcpProfile: args.mcpProfile,
    mcpServers: args.mcpServers,
    repoRoot
  });
  if (mcpInstall.enabled) {
    if (args.mcpProfile && args.mcpServers) {
      resolveMcpProfileName(args.mcpProfile, repoRoot);
    }
    resolveMcpServerNames(mcpInstall.serverNames, repoRoot);
  }

  const { plan, run: runAction } = executeInstall(targetMap, targetIdes, action, {
    dryRun: args.dryRun,
    forceCopy: args.forceCopy,
    forceSymlink: args.forceSymlink,
    preferCopyOnWindows: args.preferCopyOnWindows,
    force: args.force,
    keepStore: args.keepStore,
    skipAdopt: args.skipAdopt,
    mcpInstall,
    mcpOnly: args.mcpOnly,
    eccProfile: args.eccProfile,
    mcpTargetMap,
    projectDir: null
  });

  console.log(`Operating system: ${process.platform}`);
  console.log(`Action: ${action}${args.mcpOnly ? " (MCP only)" : ""}`);
  console.log(`Install mode: ${mode}`);
  if (action === "install") {
    console.log(`Skills source: ${sourceDir}`);
    console.log(`Kenmark store: ${getStoreDir()}`);
  }

  const ok =
    args.yes ||
    args.dryRun ||
    (await confirmPlan(plan, args.dryRun));
  if (!ok) {
    console.log("Cancelled.");
    process.exit(0);
  }

  if (args.dryRun) {
    console.log("\n(dry-run — no files changed)\n");
  }

  runAction();
}

run().catch((err) => {
  console.error(err.message || err);
  printUsage();
  process.exit(1);
});
