#!/usr/bin/env node
/**
 * Shared interactive prompts for kenmark-skills CLI.
 * Priority: interactive when stdin is a TTY and -y is not set.
 * Agents should pass explicit flags plus -y to skip prompts.
 */

const readline = require("readline");
const { DEFAULT_AGENT_IDES } = require("./kenmark-hub");

const IDE_LABELS = {
  cursor: "Cursor (.cursor/skills)",
  claude: "Claude Code (.claude/skills)",
  codex: "Codex (.agents/skills)",
  gemini: "Gemini (.gemini/skills)",
  opencode: "OpenCode (.opencode/skills)",
  kiro: "Kiro (.kiro/skills)",
  trae: "Trae (.trae/skills)",
  "trae-cn": "Trae CN (.trae-cn/skills)",
  rovo: "Rovo Dev (.rovodev/skills)",
  qoder: "Qoder (.qoder/skills)",
  minimax: "MiniMax Code (~/.minimax/skills)"
};

function createRl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

function wantsInteractive(parsed) {
  if (parsed.yes) return false;
  if (process.env.KENMARK_SKILLS_NONINTERACTIVE === "1") return false;
  return Boolean(process.stdin.isTTY);
}

async function promptYesNo(message, defaultYes = true) {
  const rl = createRl();
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const answer = await ask(rl, `${message} ${hint} `);
  rl.close();
  if (!answer) return defaultYes;
  const lower = answer.toLowerCase();
  if (lower === "y" || lower === "yes") return true;
  if (lower === "n" || lower === "no") return false;
  return defaultYes;
}

function parseScopeChoice(answer) {
  const lower = answer.toLowerCase();
  if (lower === "1" || lower === "global" || lower === "g") return "global";
  if (lower === "2" || lower === "project" || lower === "p") return "project";
  return null;
}

async function promptScope(defaultScope = "global", opts = {}) {
  const required = opts.required === true;
  const rl = createRl();
  console.log("\nWhere should skills be installed?");
  if (required) {
    console.log("  1) global  — all projects on this machine (~/.cursor, ~/.claude, …)");
    console.log("  2) project — only this repo (.cursor/, .claude/, … in cwd)\n");
  } else {
    console.log("  1) global  — all projects on this machine (~/.cursor, ~/.claude, …) [default]");
    console.log("  2) project — only this repo (.cursor/, .claude/, … in cwd)\n");
  }
  const hint = required
    ? "Choose scope [1/2 or global/project] (required): "
    : `Choose scope [1/2 or global/project] (default ${defaultScope}): `;
  const answer = await ask(rl, hint);
  rl.close();
  const lower = answer.toLowerCase();
  if (!lower) {
    if (required) {
      console.log("Please choose 1 (global) or 2 (project).");
      return promptScope(defaultScope, opts);
    }
    return defaultScope;
  }
  const parsed = parseScopeChoice(lower);
  if (parsed) return parsed;
  if (required) {
    console.log('Invalid choice. Enter 1, 2, "global", or "project".');
    return promptScope(defaultScope, opts);
  }
  console.log(`Using default scope: ${defaultScope}`);
  return defaultScope;
}

async function promptAction(defaultAction = "install") {
  const rl = createRl();
  console.log("\nWhat do you want to do?");
  console.log("  1) install   — copy Kenmark skills into IDE folders [default]");
  console.log("  2) uninstall — remove Kenmark skills from IDE folders\n");
  const answer = await ask(rl, "Choose [1/2 or install/uninstall] (default install): ");
  rl.close();
  const lower = answer.toLowerCase();
  if (!lower || lower === "1" || lower === "install" || lower === "i") return "install";
  if (lower === "2" || lower === "uninstall" || lower === "u") return "uninstall";
  return defaultAction;
}

/**
 * @param {string[]} availableIdes - keys from targetMap
 * @param {string[]} detectedIdes - subset that exist on disk
 */
function defaultAgentIdes(availableIdes) {
  const defaults = DEFAULT_AGENT_IDES.filter((ide) => availableIdes.includes(ide));
  return defaults.length ? defaults : ["cursor"];
}

function parseIdeChoice(answer, availableIdes, detectedIdes) {
  const sorted = [...availableIdes].sort();
  const lower = answer.toLowerCase();
  if (lower === "0" || lower === "auto") {
    return detectedIdes.length > 0 ? detectedIdes : null;
  }
  if (lower === "a" || lower === "all") {
    return sorted;
  }

  const picked = new Set();
  const parts = lower.split(/[\s,]+/).filter(Boolean);
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= sorted.length) {
      picked.add(sorted[num - 1]);
      continue;
    }
    if (sorted.includes(part)) {
      picked.add(part);
    }
  }
  if (picked.size > 0) {
    return [...picked];
  }
  return null;
}

async function promptIde(availableIdes, detectedIdes, opts = {}) {
  const required = opts.required === true;
  const rl = createRl();
  console.log("\nWhich IDE / agent should receive skills?");
  if (required) {
    console.log("  0) auto — use detected installs only");
  } else {
    console.log("  0) auto — use detected installs only [default]");
  }
  console.log("  a) all  — every supported IDE path\n");
  const sorted = [...availableIdes].sort();
  sorted.forEach((ide, i) => {
    const label = IDE_LABELS[ide] || ide;
    const mark = detectedIdes.includes(ide) ? " ✓ detected" : "";
    console.log(`  ${i + 1}) ${label}${mark}`);
  });
  console.log("");
  const hint = required
    ? "Choose [0/auto, a/all, numbers like 1,2, or id names] (required): "
    : "Choose [0/auto, a/all, numbers like 1,2, or id names]: ";
  const answer = await ask(rl, hint);
  rl.close();

  const lower = answer.toLowerCase();
  if (!lower) {
    if (required) {
      console.log("Please choose at least one IDE target.");
      return promptIde(availableIdes, detectedIdes, opts);
    }
    return detectedIdes.length > 0 ? detectedIdes : defaultAgentIdes(availableIdes);
  }

  const parsed = parseIdeChoice(lower, availableIdes, detectedIdes);
  if (parsed) return parsed;
  if (required) {
    console.log("No valid IDE choice. Try 0/auto, a/all, numbers, or id names.");
    return promptIde(availableIdes, detectedIdes, opts);
  }
  console.log("No valid IDE choice; using auto-detect.");
  return detectedIdes.length > 0 ? detectedIdes : defaultAgentIdes(availableIdes);
}

async function confirmPlan(lines, dryRun = false, opts = {}) {
  if (dryRun) return true;
  const required = opts.requiredConfirm === true;
  const rl = createRl();
  console.log("\nPlanned steps:");
  for (const line of lines) {
    console.log(`  • ${line}`);
  }
  const hint = required ? "\nProceed? [y/N] " : "\nProceed? [Y/n] ";
  const answer = await ask(rl, hint);
  rl.close();
  const lower = answer.toLowerCase();
  if (!lower) return !required;
  if (lower === "y" || lower === "yes") return true;
  if (lower === "n" || lower === "no") return false;
  return !required;
}

/**
 * @param {Array<{id: string, name: string, defaultSelected?: boolean}>} packs
 * @returns {Promise<string[]>} selected pack ids
 */
async function promptSelectPacks(packs, opts = {}) {
  const noDefaults = opts.noDefaults === true;
  const rl = createRl();
  console.log("\nSelect packs to install:\n");
  packs.forEach((p, i) => {
    const mark = !noDefaults && p.defaultSelected ? " [default]" : "";
    console.log(`  ${i + 1}) ${p.id}${mark} — ${p.name}`);
  });
  if (noDefaults) {
    console.log("\nEnter: number(s) 1,2 · ids impeccable,ecc · all · (empty cancels)\n");
  } else {
    console.log("\nEnter: number(s) 1,2 · ids impeccable,ecc · all · defaults · Enter for defaults\n");
  }
  const answer = await ask(rl, "Choice> ");
  rl.close();
  if (!answer) {
    if (noDefaults) return [];
    return packs.filter((p) => p.defaultSelected).map((p) => p.id);
  }
  const lower = answer.toLowerCase();
  if (lower === "all") return packs.map((p) => p.id);
  if (!noDefaults && (lower === "defaults" || lower === "default" || lower === "d")) {
    return packs.filter((p) => p.defaultSelected).map((p) => p.id);
  }
  const nums = lower.split(/[\s,]+/).filter(Boolean);
  const byNum = [];
  for (const part of nums) {
    const n = parseInt(part, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= packs.length) {
      byNum.push(packs[n - 1].id);
    }
  }
  if (byNum.length > 0) return [...new Set(byNum)];
  return answer.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * @param {{install?: {profiles?: Array<{id: string, description: string}>, defaultProfile?: string}}} pack
 * @param {string|null} preset
 * @returns {Promise<string>}
 */
async function promptEccProfile(pack, preset, opts = {}) {
  if (preset) return preset;
  const required = opts.required === true;
  const profiles = pack.install?.profiles;
  if (!profiles?.length) {
    return pack.install?.defaultProfile || "core";
  }
  const rl = createRl();
  console.log("\nECC install profile:");
  profiles.forEach((p, i) => {
    console.log(`  ${i + 1}) ${p.id} — ${p.description}`);
  });
  const defaultId = pack.install.defaultProfile || "core";
  const hint = required
    ? `Profile [1-${profiles.length} or id] (required): `
    : `Profile [1-${profiles.length} or id] (default ${defaultId}): `;
  const answer = await ask(rl, hint);
  rl.close();
  if (!answer) {
    if (required) {
      console.log("Please choose an ECC profile.");
      return promptEccProfile(pack, preset, opts);
    }
    return defaultId;
  }
  const num = parseInt(answer, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= profiles.length) {
    return profiles[num - 1].id;
  }
  const byId = profiles.find((p) => p.id === answer);
  if (byId) return byId.id;
  if (required) {
    console.error(`Unknown profile "${answer}".`);
    return promptEccProfile(pack, preset, opts);
  }
  console.error(`Unknown profile "${answer}", using ${defaultId}.`);
  return defaultId;
}

function banner(title, subtitle) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  if (subtitle) console.log(`  ${subtitle}`);
  console.log(`${"═".repeat(60)}\n`);
}

/**
 * @param {Array<{id: string, name: string, description?: string, default?: boolean, kenmarkRecommended?: boolean}>} profiles
 * @param {string} defaultProfileId
 * @returns {Promise<string|null>} profile id, "custom", or null (cancel)
 */
async function promptSelectProfile(profiles, defaultProfileId, opts = {}) {
  const rl = createRl();
  const defaultProfile =
    profiles.find((p) => p.id === defaultProfileId) ||
    profiles.find((p) => p.default) ||
    profiles[0];
  console.log("\nChoose setup profile:\n");
  profiles.forEach((p, i) => {
    const tags = [];
    if (p.id === defaultProfileId || p.default) tags.push("default");
    if (p.kenmarkRecommended) tags.push("Kenmark stack");
    if (p.requiresConfirmation) tags.push("opt-in");
    const tagStr = tags.length ? ` — ${tags.join(", ")}` : "";
    console.log(`  ${i + 1}) ${p.name}${tagStr}`);
    if (p.description) console.log(`     ${p.description}`);
  });
  const customNum = profiles.length + 1;
  console.log(`  ${customNum}) Custom — pick packs manually\n`);
  console.log(
    "Enter: number · profile id (e.g. core-next) · Enter for default · empty twice cancels\n"
  );
  const answer = await ask(rl, "Choice> ");
  rl.close();
  if (!answer) {
    return defaultProfile?.id || defaultProfileId;
  }
  const lower = answer.toLowerCase();
  const num = parseInt(lower, 10);
  if (!Number.isNaN(num)) {
    if (num >= 1 && num <= profiles.length) return profiles[num - 1].id;
    if (num === customNum) return "custom";
  }
  if (lower === "custom" || lower === "c") return "custom";
  const byId = profiles.find((p) => p.id === lower);
  if (byId) return byId.id;
  console.log(`Unknown profile "${answer}".`);
  return promptSelectProfile(profiles, defaultProfileId, opts);
}

function printProfileSummary(summary) {
  if (!summary) return;
  console.log("\nThis will install:");
  for (const line of summary.installLines) {
    console.log(`  - ${line}`);
  }
  console.log(`\nEstimated weight: ${summary.weight}`);
  console.log(`Bloat risk: ${summary.bloatRisk}`);
  if (summary.recommendedFor?.length) {
    console.log(`Recommended for: ${summary.recommendedFor.join(", ")}`);
  }
  if (summary.requiresConfirmation) {
    console.log(
      "\n⚠ This profile may install many skills/agents and can increase routing noise."
    );
  }
}

async function promptHighBloatConfirm() {
  const rl = createRl();
  const answer = await ask(
    rl,
    "This may install many skills/agents and increase routing noise. Continue? [y/N] "
  );
  rl.close();
  const lower = answer.toLowerCase();
  return lower === "y" || lower === "yes";
}

module.exports = {
  IDE_LABELS,
  createRl,
  ask,
  wantsInteractive,
  promptYesNo,
  promptScope,
  promptAction,
  promptIde,
  promptSelectPacks,
  promptSelectProfile,
  printProfileSummary,
  promptHighBloatConfirm,
  promptEccProfile,
  confirmPlan,
  banner
};
