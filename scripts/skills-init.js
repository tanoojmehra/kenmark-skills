#!/usr/bin/env node

const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const {
  wantsInteractive,
  promptScope,
  promptIde,
  promptYesNo,
  promptSelectProfile,
  printProfileSummary,
  promptHighBloatConfirm,
  promptSelectPacks,
  promptEccProfile,
  confirmPlan,
  banner
} = require("./interactive");
const {
  loadCatalog,
  listProfiles,
  defaultProfileId,
  summarizeProfile
} = require("./recommended-catalog");
const {
  buildGlobalTargets,
  buildProjectTargets,
  detectInstalledIdes
} = require("./kenmark-hub");

const repoRoot = path.resolve(__dirname, "..");
const setupScript = path.join(__dirname, "setup-skills.js");
const recommendedScript = path.join(__dirname, "skills-install-recommended.js");

function printUsage() {
  console.log("Usage: node scripts/skills-init.js [options]");
  console.log("");
  console.log("Interactive first-time setup: Kenmark skills + optional recommended packs.");
  console.log("");
  console.log("Options:");
  console.log("  --global              Force global scope (skip scope prompt)");
  console.log("  --project             Force project scope");
  console.log("  --ide <target>        IDE: cursor, claude, all, …");
  console.log("  --skip-recommended    Only install Kenmark skills (non-interactive)");
  console.log("  --recommended-only    Only install recommended packs (non-interactive)");
  console.log("  --profile <id>        Recommended profile (lean, core-next, growth-seo, …)");
  console.log("  --ids a,b             Recommended pack ids — custom (non-interactive)");
  console.log("  --all                 Install all catalog packs (legacy)");
  console.log("  --dry-run             Show steps without running");
  console.log("  -y, --yes             Skip prompts (agent mode; pass explicit flags)");
  console.log("  -h, --help            Show help");
}

function parseArgs(argv) {
  const args = { yes: false, dryRun: false, scope: null, ide: null, ids: null, all: false };
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
    if (t === "--global") {
      args.scope = "global";
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
    if (t === "--skip-recommended") {
      args.skipRecommended = true;
      continue;
    }
    if (t === "--recommended-only") {
      args.recommendedOnly = true;
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

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  banner(
    "kenmark-skills init",
    "Interactive setup — every choice is explicit · use flags + -y for agents"
  );

  const interactive = wantsInteractive(args);
  let scope = args.scope;
  let ideArg = args.ide;
  let installKenmark = false;
  let installRecommended = false;
  let selectedProfile = null;
  let selectedPacks = [];
  let eccProfile = null;

  if (interactive) {
    installKenmark = await promptYesNo(
      "Install Kenmark skills (init-brain, commit-push, issues, …)?",
      false
    );
    installRecommended = await promptYesNo(
      "Install curated recommended packs (Impeccable, ECC, Graphify, …)?",
      false
    );
    if (installRecommended) {
      const catalog = loadCatalog();
      const profiles = listProfiles(catalog);
      if (profiles.length === 0) {
        console.log("No curated profiles available; skipping recommended step.");
        installRecommended = false;
      } else {
        const choice = await promptSelectProfile(
          profiles,
          defaultProfileId(catalog)
        );
        if (!choice) {
          installRecommended = false;
        } else if (choice === "custom") {
          const packs = catalog.packs || [];
          selectedPacks = await promptSelectPacks(packs, { noDefaults: true });
          if (selectedPacks.length === 0) {
            console.log("No packs chosen; skipping recommended step.");
            installRecommended = false;
          } else {
            const eccPack = packs.find((p) => p.id === "ecc");
            if (eccPack && selectedPacks.includes("ecc")) {
              eccProfile = await promptEccProfile(eccPack, null, { required: true });
            }
          }
        } else {
          selectedProfile = choice;
          const summary = summarizeProfile(choice, catalog);
          printProfileSummary(summary);
          const profileMeta = profiles.find((p) => p.id === choice);
          if (profileMeta?.requiresConfirmation) {
            const ok = await promptHighBloatConfirm();
            if (!ok) installRecommended = false;
          }
        }
      }
    }
    if (installKenmark || installRecommended) {
      if (!scope) scope = await promptScope("global", { required: true });
    }
    if (installKenmark && !ideArg) {
      const targetMap =
        scope === "project"
          ? buildProjectTargets(process.cwd())
          : buildGlobalTargets(os.homedir());
      const targetKeys = Object.keys(targetMap);
      const detected = detectInstalledIdes(targetMap);
      const ides = await promptIde(targetKeys, detected, { required: true });
      ideArg = ides.length === targetKeys.length ? "all" : ides.join(",");
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
    if (installRecommended) {
      if (args.profile) {
        selectedProfile = args.profile;
      } else if (args.all) {
        selectedPacks = (loadCatalog().packs || []).map((p) => p.id);
      } else if (args.ids?.length) {
        selectedPacks = args.ids;
      } else {
        console.error(
          "Non-interactive recommended install requires --profile, --ids, or --all (or use interactive init)."
        );
        process.exit(1);
      }
    }
    scope = scope || "global";
  }

  const plan = [];
  if (installKenmark) {
    const ideLabel = ideArg || "auto-detect";
    plan.push(`Kenmark skills → ${scope} (${ideLabel})`);
  }
  if (installRecommended) {
    if (selectedProfile) {
      plan.push(`Recommended profile → ${scope}: ${selectedProfile}`);
    } else {
      plan.push(`Recommended packs → ${scope}: ${selectedPacks.join(", ")}`);
      if (eccProfile) plan.push(`  ECC profile: ${eccProfile}`);
    }
  }
  plan.push("Tip: run init-brain in your agent chat to bootstrap brain/ in a repo");

  if (!installKenmark && !installRecommended) {
    console.log("Nothing selected to install.");
    process.exit(0);
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
    const setupArgs = [
      scope === "project" ? "--project" : "--global",
      "--install",
      "-y"
    ];
    if (ideArg) {
      if (ideArg.includes(",")) {
        for (const ide of ideArg.split(",")) {
          const one = [...setupArgs, "--ide", ide.trim()];
          const result = runNode(setupScript, one, args.dryRun, `Kenmark → ${ide.trim()}`);
          if (!args.dryRun && result.status !== 0) process.exit(result.status || 1);
        }
      } else {
        setupArgs.push("--ide", ideArg);
        const result = runNode(setupScript, setupArgs, args.dryRun, "Kenmark skills");
        if (!args.dryRun && result.status !== 0) process.exit(result.status || 1);
      }
    } else {
      const result = runNode(setupScript, setupArgs, args.dryRun, "Kenmark skills");
      if (!args.dryRun && result.status !== 0) process.exit(result.status || 1);
    }
  }

  if (installRecommended) {
    const recArgs = [scope === "project" ? "--project" : "--global"];
    if (selectedProfile) {
      recArgs.push("--profile", selectedProfile);
    } else {
      recArgs.push("--ids", selectedPacks.join(","));
      if (eccProfile) recArgs.push("--ecc-profile", eccProfile);
    }
    if (args.dryRun) recArgs.push("--dry-run");
    recArgs.push("-y");
    const result = runNode(recommendedScript, recArgs, args.dryRun, "Recommended packs");
    if (!args.dryRun && result.status !== 0) process.exit(result.status || 1);
  }

  console.log("\n✓ Init complete.");
  console.log("Next: open your IDE, start a new agent chat, and try /kenmark-skills-router or init-brain.");
  console.log("Restart the IDE if skills do not appear immediately.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
