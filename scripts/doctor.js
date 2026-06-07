#!/usr/bin/env node

const path = require("path");
const { runDoctor } = require("./kenmark-hub");

function printUsage() {
  console.log("Usage: kenmark-skills doctor [options]");
  console.log("");
  console.log(
    "Diagnose local Kenmark install: ~/.kenmark store, manifest, MCP, IDE links, symlinks, and hash drift."
  );
  console.log("For repo/package invariants, use: kenmark-skills validate");
  console.log("");
  console.log("Options:");
  console.log("  --soft          Report problems as warnings; exit 0");
  console.log("  --no-fail       Exit 0 even when issues are found (issues still listed; JSON ok:false)");
  console.log("  --json <path>   Write full report as JSON");
  console.log("  -h, --help      Show help");
}

function parseArgs(argv) {
  const args = { jsonPath: null, soft: false, noFail: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }
    if (token === "--soft") {
      args.soft = true;
      continue;
    }
    if (token === "--no-fail") {
      args.noFail = true;
      continue;
    }
    if (token === "--json") {
      args.jsonPath = argv[i + 1] || null;
      i += 1;
    }
  }
  return args;
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const report = runDoctor({
    repoRoot,
    jsonPath: args.jsonPath,
    soft: args.soft
  });

  const headline = report.ok
    ? "OK"
    : args.soft
      ? "warnings (soft)"
      : "issues found";
  console.log(`Kenmark skills doctor — ${headline}`);
  if (args.soft) {
    console.log("(soft mode: warnings only, exit 0)");
  }
  console.log(`Node: ${report.node} (${report.platform})`);
  if (report.homeDir) {
    console.log(`Home: ${report.homeDir}`);
  }
  console.log(`Package: ${report.packageVersion || "unknown"}`);
  console.log(`Kenmark home: ${report.kenmarkHome}`);
  console.log(`Store: ${report.storeDir} (${report.storeSkillCount} skill(s))`);
  console.log(`Manifest: ${report.manifestPath} (${report.manifestReadable ? "readable" : "missing/unreadable"})`);
  console.log(`Backups: ${report.backupCount} skill backup(s) on disk`);
  console.log("");

  const mcp = report.mcp;
  console.log("MCP:");
  if (!mcp.installed) {
    console.log("  Not installed (opt-in via setup --mcp-profile or --with-mcp)");
  } else {
    console.log(
      `  Store: ${mcp.mcpStorePath} (${mcp.mcpStoreExists ? "present" : "missing"})`
    );
    console.log(`  Profile: ${mcp.profile || "(not recorded in manifest)"}`);
    console.log(
      `  Servers: ${mcp.servers.length ? mcp.servers.join(", ") : "(none in store/manifest)"}`
    );
    const touched = mcp.targets.filter((t) => t.touched);
    if (touched.length) {
      console.log("  IDE configs (Kenmark servers present):");
      for (const t of touched) {
        console.log(`    ${t.ide}: ${t.path} — ${t.serversPresent.join(", ")}`);
      }
    } else if (mcp.targets.length) {
      console.log("  IDE configs: none of the recorded targets contain Kenmark MCP servers");
      for (const t of mcp.targets) {
        const note = t.configExists ? "exists, no Kenmark servers" : "missing";
        console.log(`    ${t.ide}: ${t.path} (${note})`);
      }
    }
    if (mcp.commandsNeeded.length) {
      const pathStatus = mcp.commandsNeeded
        .map((cmd) => `${cmd}: ${mcp.commandsOnPath[cmd] ? "on PATH" : "not found"}`)
        .join("; ");
      console.log(`  Launcher commands: ${pathStatus}`);
    }
    if (mcp.missingCommands.length) {
      console.log(`  Missing on PATH: ${mcp.missingCommands.join(", ")}`);
    }
  }
  console.log("");

  if (report.installedIdeRoots.length) {
    console.log(`Detected IDE roots: ${report.installedIdeRoots.join(", ")}`);
  } else {
    console.log("Detected IDE roots: none");
  }
  const managedOnly = (report.managedIdeRoots || []).filter(
    (ide) => !report.installedIdeRoots.includes(ide)
  );
  if (report.managedIdeRoots?.length) {
    console.log(`Kenmark-managed targets: ${report.managedIdeRoots.join(", ")}`);
  }
  if (managedOnly.length) {
    console.log(
      `  (skills path exists from Kenmark only — not counted as installed: ${managedOnly.join(", ")})`
    );
  }

  console.log("\nSkill counts by IDE:");
  for (const [ide, count] of Object.entries(report.skillCountsByIde)) {
    const broken = report.brokenSymlinksByIde[ide]?.length || 0;
    const brokenNote = broken ? ` (${broken} broken symlink(s))` : "";
    console.log(`  ${ide}: ${count}${brokenNote}`);
  }

  if (Object.values(report.brokenSymlinksByIde).some((items) => items.length)) {
    console.log("\nSuggested fix:");
    console.log("  npx kenmark-skills cleanup --global --ide auto -y");
    console.log("  npx kenmark-skills cleanup --global --all --dry-run   # preview legacy + broken");
    const copyFlag = report.platform === "win32" ? " --copy" : "";
    console.log("  To refresh working links after cleanup:");
    console.log(`  npx kenmark-skills setup --global --ide auto${copyFlag} -y`);
  }

  if (report.platform === "win32") {
    const cursorCount = report.skillCountsByIde?.cursor ?? 0;
    if (cursorCount === 0 && report.storeSkillCount > 0) {
      console.log("\nWindows tip:");
      console.log(
        "  npx kenmark-skills setup --global --ide cursor --copy --skip-adopt -y"
      );
      console.log("  Then restart Cursor (Developer: Reload Window or full quit).");
    }
  }

  if (report.hashMismatches.length) {
    console.log("\nStore/IDE hash mismatches:");
    for (const m of report.hashMismatches) {
      console.log(`  • ${m.skill} @ ${m.ide}`);
    }
  }

  if (report.warnings.length) {
    console.log("\nWarnings:");
    for (const w of report.warnings) {
      console.log(`  • ${w}`);
    }
  }

  if (report.issues.length) {
    console.log("\nIssues:");
    for (const issue of report.issues) {
      console.log(`  • ${issue}`);
    }
    console.log("\nSuggested fix for portability / installation issues:");
    console.log("  npx kenmark-skills adopt --global --ide all -y");
  }

  if (args.jsonPath) {
    console.log(`\nFull report written to ${path.resolve(args.jsonPath)}`);
  }

  process.exit(args.noFail || report.ok ? 0 : 1);
}

run();
