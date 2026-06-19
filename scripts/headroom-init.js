#!/usr/bin/env node
/**
 * Optional Headroom context-compression setup after interactive init.
 * Headroom is not a SKILL.md pack — this configures `headroom wrap` for selected IDEs.
 */

const { spawnSync } = require("child_process");

/** Kenmark IDE id → `headroom wrap <agent>` subcommand (see headroom/cli/wrap.py). */
const HEADROOM_WRAP_BY_IDE = {
  cursor: "cursor",
  claude: "claude",
  codex: "codex"
};

const HEADROOM_INSTALL_CMD = "uv tool install 'headroom-ai[all]'";

function getWrapAgentsForIdes(ideIds) {
  const agents = [];
  const seen = new Set();
  for (const ide of ideIds || []) {
    const agent = HEADROOM_WRAP_BY_IDE[ide];
    if (agent && !seen.has(agent)) {
      seen.add(agent);
      agents.push(agent);
    }
  }
  return agents;
}

function isHeadroomAvailable() {
  const probe = spawnSync("headroom", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return probe.status === 0;
}

function isUvAvailable() {
  const probe = spawnSync("uv", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return probe.status === 0;
}

function installHeadroom({ dryRun = false } = {}) {
  if (dryRun) {
    console.log(`[dry-run] would run: ${HEADROOM_INSTALL_CMD}`);
    return true;
  }
  if (!isUvAvailable()) {
    console.log("uv not found on PATH. Install Headroom manually:");
    console.log(`  ${HEADROOM_INSTALL_CMD}`);
    console.log("  pipx install 'headroom-ai[all]'");
    return false;
  }
  const result = spawnSync("uv", ["tool", "install", "headroom-ai[all]"], {
    stdio: "inherit"
  });
  return result.status === 0;
}

function headroomPrepareWrap(wrapAgent, { dryRun = false } = {}) {
  const label = `headroom wrap ${wrapAgent} --prepare-only`;
  if (dryRun) {
    console.log(`[dry-run] would run: ${label}`);
    return { ok: true, agent: wrapAgent };
  }
  const result = spawnSync("headroom", ["wrap", wrapAgent, "--prepare-only"], {
    stdio: "inherit"
  });
  return { ok: result.status === 0, agent: wrapAgent };
}

function printHeadroomUsageHints(wrapAgents) {
  console.log("\nHeadroom — built-in / subscription models:");
  if (wrapAgents.includes("cursor")) {
    console.log(
      "  Cursor (Auto): headroom wrap cursor --prepare-only  # rtk in .cursorrules per project"
    );
    console.log(
      "  Cursor (BYOK): headroom wrap cursor                 # proxy + override base URL in settings"
    );
  }
  if (wrapAgents.includes("claude")) {
    console.log("  Claude Code:   headroom wrap claude               # launch through Headroom");
  }
  if (wrapAgents.includes("codex")) {
    console.log("  Codex:         headroom wrap codex                 # launch through Headroom");
  }
  console.log("  Gemini:        no wrap yet — Kenmark skills only; see kenmark-setup references/headroom-usage.md");
  console.log("  headroom perf                                  # token savings report");
  console.log("  Docs: https://github.com/chopratejas/headroom");
}

module.exports = {
  HEADROOM_WRAP_BY_IDE,
  HEADROOM_INSTALL_CMD,
  getWrapAgentsForIdes,
  isHeadroomAvailable,
  isUvAvailable,
  installHeadroom,
  headroomPrepareWrap,
  printHeadroomUsageHints
};
