#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  wantsInteractive,
  promptScope,
  confirmPlan,
  banner
} = require("./interactive");
const readline = require("readline");
const { loadCatalog, defaultSelectedIds } = require("./recommended-catalog");

const repoRoot = path.resolve(__dirname, "..");
const setupScript = path.join(__dirname, "setup-skills.js");
const recommendedScript = path.join(__dirname, "kenmark-packs.js");
const packageJsonPath = path.join(repoRoot, "package.json");

function printUsage() {
  console.log("Usage: node scripts/kenmark-update.js [options]");
  console.log("");
  console.log("Refresh Kenmark skills and/or curated recommended packs (npx, no git clone).");
  console.log("Interactive by default in a terminal. Agents: pass --both + flags + -y.");
  console.log("");
  console.log("Options:");
  console.log("  --kenmark-only        Update Kenmark skills only (re-copy from package)");
  console.log("  --recommended-only    Re-run recommended pack installs only");
  console.log("  --both                Update Kenmark skills and recommended packs");
  console.log("  --global              User-wide install paths (default)");
  console.log("  --project             Current project directory only");
  console.log("  --ide <target>        IDE for Kenmark sync: cursor, claude, all, …");
  console.log("  --ids a,b             Recommended pack ids (default: defaultSelected)");
  console.log("  --ecc-profile core    ECC profile when refreshing recommended");
  console.log("  --skip-npm            Do not run npm update -g kenmark-skills");
  console.log("  --skip-adopt          Do not adopt catalog skills into ~/.kenmark/store");
  console.log("  --npm-only            Only upgrade global kenmark-skills package");
  console.log("  --dry-run             Show planned steps without running");
  console.log("  -y, --yes             Skip confirmation prompts");
  console.log("  -h, --help            Show help");
}

function parseArgs(argv) {
  const args = {
    yes: false,
    dryRun: false,
    skipNpm: false,
    skipAdopt: false,
    npmOnly: false,
    scope: null,
    ide: null,
    mode: null,
    ids: null,
    eccProfile: null
  };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === "-h" || t === "--help") {
      args.help = true;
      continue;
    }
    if (t === "--kenmark-only") {
      args.mode = "kenmark";
      continue;
    }
    if (t === "--recommended-only") {
      args.mode = "recommended";
      continue;
    }
    if (t === "--both") {
      args.mode = "both";
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
    if (t === "--ecc-profile") {
      args.eccProfile = (argv[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (t === "--skip-npm") {
      args.skipNpm = true;
      continue;
    }
    if (t === "--skip-adopt") {
      args.skipAdopt = true;
      continue;
    }
    if (t === "--npm-only") {
      args.npmOnly = true;
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
  }
  return args;
}

function readPackageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

function createRl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

async function promptMode(preset) {
  if (preset) return preset;
  const rl = createRl();
  console.log("\nWhat should we update?");
  console.log("  1) Kenmark skills only — re-sync from kenmark-skills package [default]");
  console.log("  2) Recommended packs only — selected optional packs");
  console.log("  3) Both — Kenmark + selected optional packs\n");
  const answer = await ask(rl, "Choose [1/2/3] (default 1): ");
  rl.close();
  const lower = answer.toLowerCase();
  if (!lower || lower === "1" || lower === "kenmark" || lower === "k") return "kenmark";
  if (lower === "2" || lower === "recommended" || lower === "r") return "recommended";
  if (lower === "3" || lower === "both" || lower === "b") return "both";
  console.log('Unknown choice; using "kenmark".');
  return "kenmark";
}

async function promptNpmUpdate(skipPreset) {
  if (skipPreset) return false;
  const rl = createRl();
  const answer = await ask(
    rl,
    "\nRun `npm update -g kenmark-skills` first (if installed globally)? [Y/n]: "
  );
  rl.close();
  const lower = answer.toLowerCase();
  if (!lower || lower === "y" || lower === "yes") return true;
  return false;
}

async function promptIde(preset) {
  if (preset) return preset;
  const rl = createRl();
  const answer = await ask(
    rl,
    "\nKenmark IDE target [cursor|claude|codex|all|empty=auto-detect]: "
  );
  rl.close();
  if (!answer) return null;
  return answer.toLowerCase();
}

async function promptRecommendedIds() {
  const rl = createRl();
  console.log(
    "\nRecommended packs to refresh (comma-separated ids, 'defaults', 'all', or empty=defaults):\n"
  );
  console.log("  impeccable, ecc\n");
  const answer = await ask(rl, "ids> ");
  rl.close();
  if (!answer) return "defaults";
  return answer;
}

function runNodeScript(scriptPath, scriptArgs, dryRun, label) {
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

function runNpmUpdate(dryRun) {
  const cmd = "npm update -g kenmark-skills";
  console.log(`\n━━━ npm package ━━━`);
  console.log(`$ ${cmd}`);
  if (dryRun) return { status: 0 };
  return spawnSync(cmd, { shell: true, stdio: "inherit", env: process.env });
}

function globalKenmarkInstalled() {
  const result = spawnSync("npm list -g kenmark-skills --depth=0", {
    shell: true,
    encoding: "utf8"
  });
  return result.status === 0 && /kenmark-skills@/.test(result.stdout || "");
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const localVersion = readPackageVersion();
  console.log(`kenmark-skills update (package in this tree: v${localVersion})`);

  let mode = args.mode;
  let scope = args.scope;
  let runNpm = false;
  let ide = args.ide;

  const interactive =
    wantsInteractive(args) &&
    !args.npmOnly &&
    mode === null &&
    !args.ids &&
    scope === null;

  if (args.npmOnly) {
    mode = "kenmark";
    runNpm = !args.skipNpm;
    scope = scope || "global";
  } else if (interactive) {
    banner("kenmark-skills update", "Refresh installs · flags + -y for agents");
    mode = await promptMode(mode);
    scope = await promptScope(scope || "global");
    if (mode === "kenmark" || mode === "both") {
      if (!args.skipNpm && globalKenmarkInstalled()) {
        runNpm = await promptNpmUpdate(false);
      }
      ide = await promptIde(ide);
    }
    if (mode === "recommended" || mode === "both") {
      if (!args.ids) {
        const picked = await promptRecommendedIds();
        if (picked === "defaults") {
          args.ids = null;
          args.allDefaults = true;
        } else if (picked === "all") {
          args.ids = null;
          args.allPacks = true;
        } else {
          args.ids = picked.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
    }
  } else {
    mode = mode || "kenmark";
    scope = scope || "global";
    runNpm = !args.skipNpm && (mode === "kenmark" || mode === "both") && globalKenmarkInstalled();
  }

  const plan = [];
  if (runNpm) plan.push("npm update -g kenmark-skills");
  if (mode === "kenmark" || mode === "both") {
    const ideLabel = ide || "auto-detect";
    plan.push(`Kenmark skills → ${scope} (${ideLabel})`);
    if (!args.skipAdopt) {
      plan.push("  + adopt catalog skills into ~/.kenmark/store + relink");
    }
  }
  if (mode === "recommended" || mode === "both") {
    const idsLabel = args.ids?.length ? args.ids.join(", ") : "default packs";
    plan.push(`Recommended packs (${idsLabel}) → ${scope} via npx`);
    if (!args.skipAdopt) {
      plan.push("  + adopt installed skills into ~/.kenmark/store + relink");
    }
  }

  if (plan.length === 0) {
    console.log("Nothing to do.");
    process.exit(0);
  }

  const ok = args.yes || (await confirmPlan(plan, args.dryRun));
  if (!ok) {
    console.log("Cancelled.");
    process.exit(0);
  }

  if (args.dryRun) console.log("\n(dry-run — commands only)\n");

  if (runNpm) {
    const npmResult = runNpmUpdate(args.dryRun);
    if (!args.dryRun && npmResult.status !== 0) {
      console.error("npm update failed; continuing with local package scripts.");
    }
  }

  if (mode === "kenmark" || mode === "both") {
    const setupArgs = [
      scope === "project" ? "--project" : "--global",
      "--install",
      "--ide",
      ide || "auto",
      "-y"
    ];
    if (args.skipAdopt) setupArgs.push("--skip-adopt");
    if (args.eccProfile) setupArgs.push("--ecc-profile", args.eccProfile);
    if (args.dryRun) setupArgs.push("--dry-run");
    const result = runNodeScript(setupScript, setupArgs, args.dryRun, "Kenmark skills");
    if (!args.dryRun && result.status !== 0) {
      console.error(`Kenmark update failed (exit ${result.status})`);
      process.exit(result.status || 1);
    }
  }

  if (mode === "recommended" || mode === "both") {
    const catalog = loadCatalog();
    const recArgs = [
      scope === "project" ? "--project" : "--global",
      "-y"
    ];
    if (args.ids?.length) {
      recArgs.push("--ids", args.ids.join(","));
    } else if (args.allPacks) {
      recArgs.push("--all");
    } else {
      const defaults = defaultSelectedIds(catalog);
      if (!defaults.length) {
        console.log("\nNo default optional packs configured; skipping recommended refresh.");
      } else {
        recArgs.push("--ids", defaults.join(","));
      }
    }
    const shouldRunRecommended =
      recArgs.includes("--all") || recArgs.some((a, i) => a === "--ids" && recArgs[i + 1]);

    if (shouldRunRecommended) {
      if (args.eccProfile) {
        recArgs.push("--ecc-profile", args.eccProfile);
      }
      if (args.skipAdopt) recArgs.push("--skip-adopt");
      recArgs.push("--ide", ide || "auto");
      if (args.dryRun) recArgs.push("--dry-run");

      const result = runNodeScript(
        recommendedScript,
        recArgs,
        false,
        "Recommended packs"
      );
      if (!args.dryRun && result.status !== 0) {
        console.error(`Recommended refresh failed (exit ${result.status})`);
        process.exit(result.status || 1);
      }
    }
  }

  // Adopt pass is now performed inside `setup` and `install-recommended` themselves,
  // so we no longer invoke skills-adopt.js here. To disable it, pass --skip-adopt,
  // which is forwarded to the inner scripts.

  console.log("\nUpdate complete.");
  console.log("Restart your IDE or agent session if skills do not appear immediately.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
