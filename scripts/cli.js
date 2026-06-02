#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log("kenmark-skills CLI");
  console.log("");
  console.log("Interactive by default in a terminal (humans). Pass flags + -y for agents.");
  console.log("");
  console.log("Usage:");
  console.log("  kenmark-skills init [--global|--project] [--ide <target>] [--skip-recommended] [-y]");
  console.log("  kenmark-skills setup [--global|--project] [--ide <target>] [-y]");
  console.log("  kenmark-skills uninstall [--global|--project] [--ide <target>] [-y]");
  console.log("  kenmark-skills inventory [--json path] [--markdown path] [--include-plugins]");
  console.log("  kenmark-skills subagents-inventory [--json path] [--markdown path] [--include-plugins] [--include-marketplaces]");
  console.log("  kenmark-skills install-recommended [--list-profiles] [--profile lean|core-next|…] [--ids a,b] [--global|--project] [-y]");
  console.log("  kenmark-skills update [--kenmark-only|--recommended-only|--both] [--global|--project] [-y]");
  console.log("  kenmark-skills adopt [--global|--project] [--ide <target>] [--dry-run] [-y]");
  console.log("  kenmark-skills doctor [--json path]");
  console.log("  kenmark-skills help");
  console.log("");
  console.log("Examples:");
  console.log("  npx kenmark-skills init");
  console.log("  npx kenmark-skills setup");
  console.log("  npx kenmark-skills setup --project --ide cursor -y");
  console.log("  npx kenmark-skills uninstall --global --ide claude -y");
}

if (!command || command === "help" || command === "--help" || command === "-h") {
  printUsage();
  process.exit(0);
}

if (command === "init") {
  const scriptPath = path.join(__dirname, "skills-init.js");
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
  const scriptPath = path.join(__dirname, "skills-install-recommended.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === "update") {
  const scriptPath = path.join(__dirname, "skills-update.js");
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

if (command === "doctor") {
  const scriptPath = path.join(__dirname, "doctor.js");
  const result = spawnSync(process.execPath, [scriptPath, ...args.slice(1)], {
    stdio: "inherit"
  });
  process.exit(result.status === null ? 1 : result.status);
}

console.error(`Unknown command: ${command}`);
printUsage();
process.exit(1);
