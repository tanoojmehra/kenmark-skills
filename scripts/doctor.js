#!/usr/bin/env node

const path = require("path");
const { runDoctor } = require("./kenmark-hub");

function printUsage() {
  console.log("Usage: kenmark-skills doctor [options]");
  console.log("");
  console.log("Diagnose Kenmark skills install: store, manifest, MCP, IDE links, and catalog.");
  console.log("");
  console.log("Options:");
  console.log("  --json <path>   Write full report as JSON");
  console.log("  -h, --help      Show help");
}

function parseArgs(argv) {
  const args = { jsonPath: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      args.help = true;
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
  const report = runDoctor({ repoRoot, jsonPath: args.jsonPath });

  console.log(`Kenmark skills doctor — ${report.ok ? "OK" : "issues found"}`);
  console.log(`Node: ${report.node} (${report.platform})`);
  console.log(`Package: ${report.packageVersion || "unknown"}`);
  console.log(`Kenmark home: ${report.kenmarkHome}`);
  console.log(`Store: ${report.storeDir} (${report.storeSkillCount} skill(s))`);
  console.log(`Manifest: ${report.manifestPath} (${report.manifestReadable ? "readable" : "missing/unreadable"})`);
  console.log(`Catalog: ${report.catalogPath} (${report.catalogReadable ? "readable" : "missing/unreadable"})`);
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

  console.log("\nSkill counts by IDE:");
  for (const [ide, count] of Object.entries(report.skillCountsByIde)) {
    const broken = report.brokenSymlinksByIde[ide]?.length || 0;
    const brokenNote = broken ? ` (${broken} broken symlink(s))` : "";
    console.log(`  ${ide}: ${count}${brokenNote}`);
  }

  if (report.hashMismatches.length) {
    console.log("\nStore/IDE hash mismatches:");
    for (const m of report.hashMismatches) {
      console.log(`  • ${m.skill} @ ${m.ide}`);
    }
  }

  if (report.issues.length) {
    console.log("\nIssues:");
    for (const issue of report.issues) {
      console.log(`  • ${issue}`);
    }
  }

  if (args.jsonPath) {
    console.log(`\nFull report written to ${path.resolve(args.jsonPath)}`);
  }

  process.exit(report.ok ? 0 : 1);
}

run();
