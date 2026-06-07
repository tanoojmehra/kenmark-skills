#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const command = args[0];
const pkg = require(path.join(__dirname, "..", "package.json"));

if (command === "version" || command === "--version" || command === "-v") {
  console.log(pkg.version);
  process.exit(0);
}

function printUsage() {
  console.log("kenmark-skills CLI");
  console.log("");
  console.log("Interactive by default in a terminal (humans). Pass flags + -y for agents.");
  console.log("");
  console.log("Usage:");
  console.log("  kenmark-skills init [--global|--project] [--ide <target>] [--skip-recommended] [-y]");
  console.log("  kenmark-skills setup [--global|--project] [--ide <target>] [-y]");
  console.log("  kenmark-skills uninstall [--global|--project] [--ide <target>] [--mcp-only] [-y]");
  console.log("  kenmark-skills mcp uninstall [--global|--project] [--ide <target>] [-y]");
  console.log("  kenmark-skills inventory [--json path] [--markdown path] [--include-plugins]");
  console.log("  kenmark-skills subagents-inventory [--json path] [--markdown path] [--include-plugins] [--include-marketplaces]");
  console.log("  kenmark-skills install-recommended [--list] [--suggest] [--explain [id]] [--ids a,b] [--preset id] [--profile id] [--global|--project] [-y]");
  console.log("  kenmark-skills update [--kenmark-only|--recommended-only|--both] [--global|--project] [-y]");
  console.log("  kenmark-skills adopt [--global|--project] [--ide <target>] [--dry-run] [-y]");
  console.log("  kenmark-skills validate");
  console.log("  kenmark-skills doctor [--soft] [--no-fail] [--json path]");
  console.log("  kenmark-skills cleanup [--global|--project] [--ide <target>] [--dry-run] [-y]");
  console.log("  kenmark-skills version");
  console.log("  kenmark-skills help");
  console.log("");
  console.log("Examples:");
  console.log("  npx kenmark-skills init");
  console.log("  npx kenmark-skills setup");
  console.log("  npx kenmark-skills setup --project --ide cursor -y");
  console.log("  npx kenmark-skills uninstall --global --ide claude -y");
  console.log("  npx kenmark-skills mcp uninstall --global --ide cursor -y");
}

if (!command || command === "help" || command === "--help" || command === "-h") {
  printUsage();
  process.exit(0);
}

if (command === "init") {
  const scriptPath = path.join(__dirname, "kenmark-setup.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "setup") {
  const scriptPath = path.join(__dirname, "setup-skills.js");
  const forwardedArgs = args.slice(1);
  const result = spawnSync(process.execPath, [scriptPath, ...forwardedArgs], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "uninstall") {
  const scriptPath = path.join(__dirname, "setup-skills.js");
  const forwardedArgs = ["--uninstall", ...args.slice(1)];
  const result = spawnSync(process.execPath, [scriptPath, ...forwardedArgs], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "mcp") {
  const sub = args[1];
  if (!sub || sub === "help" || sub === "--help" || sub === "-h") {
    console.log("kenmark-skills mcp");
    console.log("");
    console.log("Usage:");
    console.log("  kenmark-skills mcp uninstall [--global|--project] [--ide <target>] [-y]");
    console.log("");
    console.log("Removes Kenmark-managed MCP server entries from Cursor / Claude configs");
    console.log("and clears ~/.kenmark/store/mcp.json. Does not remove skill links.");
    console.log("");
    console.log("Examples:");
    console.log("  npx kenmark-skills mcp uninstall --global --ide cursor -y");
    console.log("  npx kenmark-skills mcp uninstall --global -y");
    console.log("  npx kenmark-skills mcp uninstall --global --ide all -y   # advanced: every detected IDE path");
    process.exit(sub && sub !== "help" ? 1 : 0);
  }
  if (sub === "uninstall") {
    const scriptPath = path.join(__dirname, "setup-skills.js");
    const forwardedArgs = ["--uninstall", "--mcp-only", ...args.slice(2)];
    const result = spawnSync(process.execPath, [scriptPath, ...forwardedArgs], {
      stdio: "inherit"
    });
    process.exit(result.status === null ? 1 : result.status);
  }
  console.error(`Unknown mcp subcommand: ${sub}`);
  console.log("Run: kenmark-skills mcp help");
  process.exit(1);
}

if (command === "inventory") {
  const scriptPath = path.join(__dirname, "skills-inventory.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "subagents-inventory" || command === "agents-inventory") {
  const scriptPath = path.join(__dirname, "subagents-inventory.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "install-recommended") {
  const scriptPath = path.join(__dirname, "kenmark-packs.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "update") {
  const scriptPath = path.join(__dirname, "kenmark-update.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "adopt") {
  const scriptPath = path.join(__dirname, "skills-adopt.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "validate") {
  const scriptPath = path.join(__dirname, "validate.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "doctor") {
  const scriptPath = path.join(__dirname, "doctor.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "cleanup") {
  const scriptPath = path.join(__dirname, "kenmark-cleanup.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

console.error(`Unknown command: ${command}`);
printUsage();
process.exit(1);
