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
  gemini: "Gemini (.gemini/skills; shares ~/.agents/skills when Codex is also selected)",
  "antigravity-cli":
    "Antigravity CLI (~/.gemini/antigravity-cli/skills; shares ~/.gemini/skills when Gemini is also selected)",
  antigravity: "Antigravity 2.0 Manager (~/.gemini/antigravity/skills)",
  "antigravity-ide": "Antigravity IDE (~/.gemini/antigravity-ide/skills)",
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

const NONINTERACTIVE_STDIN_HINT =
  "Non-interactive stdin detected (TTY without readable input). " +
  "Re-run with explicit flags and -y, e.g. npx kenmark-skills init --ide auto -y\n" +
  "Or set KENMARK_SKILLS_NONINTERACTIVE=1 to skip interactive mode.";

function stdinEnded() {
  return Boolean(
    process.stdin.readableEnded || process.stdin.closed || process.stdin.destroyed
  );
}

function wantsInteractive(parsed) {
  if (parsed.yes) return false;
  if (process.env.KENMARK_SKILLS_NONINTERACTIVE === "1") return false;
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/**
 * Exit with guidance when stdin is a TTY but will not deliver input (agent pseudo-TTY).
 */
async function assertInteractiveStdin() {
  if (!process.stdin.isTTY) return;
  if (!process.stdout.isTTY || stdinEnded()) {
    console.error(NONINTERACTIVE_STDIN_HINT);
    process.exit(1);
  }

  const immediateEof = await new Promise((resolve) => {
    let settled = false;
    const done = (eof) => {
      if (settled) return;
      settled = true;
      process.stdin.removeListener("end", onEnd);
      process.stdin.removeListener("close", onClose);
      clearTimeout(timer);
      resolve(eof);
    };
    const onEnd = () => done(true);
    const onClose = () => done(true);
    process.stdin.once("end", onEnd);
    process.stdin.once("close", onClose);
    if (stdinEnded()) {
      done(true);
      return;
    }
    process.stdin.resume();
    const timer = setTimeout(() => done(false), 0);
  });

  if (immediateEof) {
    console.error(NONINTERACTIVE_STDIN_HINT);
    process.exit(1);
  }
}

async function promptYesNo(message, defaultYes = true) {
  const rl = createRl();
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const answer = await ask(rl, `${message} ${hint} `);
  rl.close();
  if (!answer && stdinEnded()) {
    console.error(NONINTERACTIVE_STDIN_HINT);
    process.exit(1);
  }
  if (!answer) return defaultYes;
  const lower = answer.toLowerCase();
  if (lower === "y" || lower === "yes") return true;
  if (lower === "n" || lower === "no") return false;
  return defaultYes;
}

function parseScopeChoice(answer) {
  const lower = answer.toLowerCase();
  if (lower === "1" || lower === "global" || lower === "g") return "global";
  return null;
}

const PROJECT_SCOPE_REMOVED =
  "Project scope is not supported. Kenmark-skills installs globally only (~/.kenmark/store, ~/.cursor, ~/.claude, …). Omit scope flags.";

function rejectProjectScopeInArgv(argv) {
  const args = Array.isArray(argv) ? argv : [];
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--project") {
      console.error(PROJECT_SCOPE_REMOVED);
      process.exit(1);
    }
    if (token === "--scope") {
      const value = (args[i + 1] || "").toLowerCase();
      if (value === "project") {
        console.error(PROJECT_SCOPE_REMOVED);
        process.exit(1);
      }
    }
  }
}

/** Drop deprecated scope flags; installs are always global. */
function normalizeCliArgv(argv) {
  const args = Array.isArray(argv) ? argv : [];
  const out = [];
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--global") continue;
    if (token === "--scope" && (args[i + 1] || "").toLowerCase() === "global") {
      i += 1;
      continue;
    }
    out.push(token);
  }
  return out;
}

const SCOPE_PROMPTS = {
  install: {
    title: "Install scope",
    global: "global — all projects on this machine (~/.cursor, ~/.claude, …)"
  },
  cleanup: {
    title: "Cleanup scope",
    global: "global — user home IDE folders on this machine (~/.cursor, ~/.claude, …)"
  }
};

/**
 * @param {"install"|"cleanup"} purpose
 */
function getScopePromptLines(purpose = "install") {
  const config = SCOPE_PROMPTS[purpose] || SCOPE_PROMPTS.install;
  return {
    title: config.title,
    lines: [`  ${config.global}`]
  };
}

async function promptScope(defaultScope = "global", _opts = {}) {
  return "global";
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
 * @param {string[]} detectedIdes - IDEs with real install evidence (not skills-only parents)
 * @param {{ required?: boolean, managedIdes?: string[] }} opts
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
  const managedIdes = opts.managedIdes || [];
  const rl = createRl();
  console.log("\nWhich IDE / agent should receive skills?");
  if (required) {
    console.log("  0) auto — use detected installs only");
  } else {
    console.log("  0) auto — use detected installs only [default]");
  }
  console.log("  a) all  — every supported IDE path\n");
  if (detectedIdes.length) {
    console.log(`  Detected on this machine: ${detectedIdes.join(", ")}`);
  }
  const managedOnly = managedIdes.filter((ide) => !detectedIdes.includes(ide));
  if (managedOnly.length) {
    console.log(`  Previously managed by Kenmark: ${managedOnly.join(", ")}`);
  }
  console.log("");
  const sorted = [...availableIdes].sort();
  sorted.forEach((ide, i) => {
    const label = IDE_LABELS[ide] || ide;
    let mark = "";
    if (detectedIdes.includes(ide)) {
      mark = " ✓ detected";
    } else if (managedIdes.includes(ide)) {
      mark = " · Kenmark-managed";
    }
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
/**
 * Checklist UX with repo-aware suggestions (selectable catalog mode).
 * @param {Array<object>} packs
 * @param {Array<{packId: string, tier: string, why: string, matchedSignals: string[]}>} suggestions
 * @param {{ defaultIds?: string[] }} opts
 */
async function promptSelectOptionalPacks(packs, suggestions, opts = {}) {
  const defaultIds = opts.defaultIds || packs.filter((p) => p.defaultSelected).map((p) => p.id);
  const sugById = new Map((suggestions || []).map((s) => [s.packId, s]));

  console.log("\nOptional recommended installs:\n");
  packs.forEach((p, i) => {
    const sug = sugById.get(p.id);
    const helps = (p.helpsWith || p.bestFor || []).join(", ");
    const weight =
      p.weight === "light"
        ? "Light"
        : p.weight === "medium"
          ? "Medium"
          : p.weight === "heavy"
            ? "Heavy"
            : p.weight || "?";
    const bloat = p.bloatScore ?? "?";
    const def = p.defaultSelected ? " [default-on]" : "";
    console.log(
      `  ${i + 1}) ${p.name}${def} — helps with: ${helps || "—"} · Weight: ${weight} · Bloat: ${bloat}`
    );
    if (sug?.why && sug.tier === "recommended") {
      console.log(`     Suggested: ${sug.why}`);
    }
  });

  const stack = (suggestions || []).filter(
    (s) => s.tier === "recommended" || (s.tier === "optional" && s.matchedSignals?.length)
  );
  if (stack.length) {
    console.log("\nRecommended based on this repo:\n");
    for (const s of stack) {
      const pack = packs.find((p) => p.id === s.packId);
      const checked =
        s.tier === "recommended" || pack?.defaultSelected ? "[x]" : "[ ]";
      const name = pack?.name || s.packId;
      console.log(`  ${checked} ${name.padEnd(22)} ${s.why}`);
    }
  }

  console.log(
    "\nEnter: number(s) 1,2 · ids impeccable,graphify · all · defaults · Enter for defaults · empty cancels\n"
  );

  return promptSelectPacks(packs, { defaultIds, quietList: true });
}

async function promptSelectPacks(packs, opts = {}) {
  const noDefaults = opts.noDefaults === true;
  const defaultIds =
    opts.defaultIds ||
    (noDefaults ? [] : packs.filter((p) => p.defaultSelected).map((p) => p.id));
  const rl = createRl();
  if (!opts.quietList) {
    console.log("\nSelect packs to install:\n");
    packs.forEach((p, i) => {
      const mark = defaultIds.includes(p.id) ? " [default]" : "";
      console.log(`  ${i + 1}) ${p.id}${mark} — ${p.name}`);
    });
    if (noDefaults) {
      console.log("\nEnter: number(s) 1,2 · ids impeccable,ecc · all · (empty cancels)\n");
    } else {
      console.log("\nEnter: number(s) 1,2 · ids impeccable,ecc · all · defaults · Enter for defaults\n");
    }
  }
  const answer = await ask(rl, "Choice> ");
  rl.close();
  if (!answer) {
    if (noDefaults) return [];
    return defaultIds.length ? defaultIds : packs.filter((p) => p.defaultSelected).map((p) => p.id);
  }
  const lower = answer.toLowerCase();
  if (lower === "all") return packs.map((p) => p.id);
  if (!noDefaults && (lower === "defaults" || lower === "default" || lower === "d")) {
    return defaultIds.length
      ? defaultIds
      : packs.filter((p) => p.defaultSelected).map((p) => p.id);
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
  console.log(
    `\nEstimated weight: ${summary.weight} (bloat score ${summary.bloatTotal})`
  );
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

function parseCleanupCategoryChoice(answer) {
  const c = { broken: false, legacy: false, kenmark: false, recommended: false };
  if (!answer) {
    c.broken = true;
    return c;
  }
  const lower = answer.toLowerCase();
  if (lower === "defaults" || lower === "default" || lower === "d" || lower === "1") {
    c.broken = true;
    return c;
  }
  if (lower === "full" || lower === "6" || lower === "everything") {
    c.broken = true;
    c.legacy = true;
    c.kenmark = true;
    c.recommended = true;
    return c;
  }
  if (lower === "all-managed" || lower === "managed" || lower === "5") {
    c.kenmark = true;
    c.recommended = true;
    return c;
  }
  if (lower === "all" || lower === "hygiene") {
    c.broken = true;
    c.legacy = true;
    return c;
  }

  const parts = lower.split(/[\s,]+/).filter(Boolean);
  for (const part of parts) {
    if (part === "1" || part === "broken" || part === "broken-only") c.broken = true;
    if (part === "2" || part === "legacy" || part === "legacy-only") c.legacy = true;
    if (part === "3" || part === "kenmark" || part === "core") c.kenmark = true;
    if (
      part === "4" ||
      part === "recommended" ||
      part === "packs" ||
      part === "pack" ||
      part === "catalog"
    ) {
      c.recommended = true;
    }
  }
  if (!c.broken && !c.legacy && !c.kenmark && !c.recommended) {
    c.broken = true;
  }
  return c;
}

/**
 * @returns {Promise<{broken: boolean, legacy: boolean, kenmark: boolean, recommended: boolean}>}
 */
async function promptCleanupCategories() {
  const rl = createRl();
  console.log("\nWhat should cleanup remove?\n");
  console.log("  1) broken      — dangling symlinks only [default]");
  console.log("  2) legacy      — proven unprefixed Kenmark paths (+ store when applicable)");
  console.log("  3) kenmark     — kenmark-* bundled skills from selected IDE dirs");
  console.log("  4) recommended — catalog pack skills (impeccable, graphify, ECC, …)");
  console.log("  5) all-managed — kenmark + recommended packs");
  console.log("  6) full        — broken + legacy + all managed skills\n");
  console.log(
    "Enter: numbers 1,3 · ids broken,kenmark · all-managed · full · Enter for broken only\n"
  );
  const answer = await ask(rl, "Choice> ");
  rl.close();
  return parseCleanupCategoryChoice(answer);
}

/**
 * @param {Array<{id: string, description: string}>} servers
 * @param {{ askInstall?: boolean, installPrompt?: string }} opts
 * @returns {Promise<string[]>} selected server ids (empty = skip)
 */
async function promptMcpServers(servers, opts = {}) {
  const askInstall = opts.askInstall !== false;
  if (askInstall) {
    const message =
      opts.installPrompt ||
      "Install bundled MCP servers into your selected IDE MCP configs?";
    const want = await promptYesNo(message, false);
    if (!want) return [];
  }

  if (!servers.length) return [];

  const rl = createRl();
  console.log("\nSelect MCP servers (comma-separated numbers or ids):\n");
  servers.forEach((s, i) => {
    console.log(`  ${i + 1}) ${s.id} — ${s.description}`);
  });
  console.log(
    "\nEnter: number(s) 1,2 · ids playwright,context7 · all · Enter/none to skip\n"
  );
  const answer = await ask(rl, "Choice> ");
  rl.close();

  if (!answer) return [];
  const lower = answer.toLowerCase();
  if (lower === "none" || lower === "skip" || lower === "n" || lower === "no") {
    return [];
  }
  if (lower === "all") return servers.map((s) => s.id);

  const picked = new Set();
  const parts = lower.split(/[\s,]+/).filter(Boolean);
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= servers.length) {
      picked.add(servers[num - 1].id);
      continue;
    }
    const byId = servers.find((s) => s.id === part);
    if (byId) picked.add(byId.id);
  }
  if (picked.size > 0) return [...picked].sort();
  console.log(`Unknown choice "${answer}"; skipping MCP.`);
  return [];
}

/**
 * @param {Array<{id: string, description: string, servers?: string[]}>} profiles
 * @param {{ defaultProfile?: string, askInstall?: boolean, installPrompt?: string }} opts
 * @returns {Promise<string|null>} profile id or null when user declines install
 */
async function promptMcpProfile(profiles, opts = {}) {
  const defaultProfile = opts.defaultProfile || "none";
  const askInstall = opts.askInstall !== false;
  if (askInstall) {
    const message =
      opts.installPrompt ||
      "Install bundled MCP servers into your selected IDE MCP configs?";
    const want = await promptYesNo(message, false);
    if (!want) return "none";
  }

  if (!profiles.length) return "none";

  const rl = createRl();
  console.log("\nMCP profile (merged into selected IDE MCP configs):\n");
  profiles.forEach((p, i) => {
    const def = p.id === defaultProfile ? " [default]" : "";
    const servers =
      p.servers?.length > 0 ? ` · servers: ${p.servers.join(", ")}` : "";
    console.log(`  ${i + 1}) ${p.id}${def} — ${p.description}${servers}`);
  });
  console.log(
    "\nEnter: number · profile id (e.g. web) · Enter for default · none to skip\n"
  );
  const answer = await ask(
    rl,
    `Profile [1-${profiles.length} or id] (default ${defaultProfile}): `
  );
  rl.close();

  if (!answer) return defaultProfile;
  const lower = answer.toLowerCase();
  if (lower === "none" || lower === "skip" || lower === "n" || lower === "no") {
    return "none";
  }
  const num = parseInt(lower, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= profiles.length) {
    return profiles[num - 1].id;
  }
  const byId = profiles.find((p) => p.id === lower);
  if (byId) return byId.id;
  console.log(`Unknown profile "${answer}"; using ${defaultProfile}.`);
  return defaultProfile;
}

/**
 * Optional post-init Headroom wrap setup (interactive init only).
 * @param {string[]} selectedIdeIds Kenmark IDE ids from init (--ide)
 * @param {{ dryRun?: boolean }} opts
 */
async function promptHeadroomAfterInit(selectedIdeIds, opts = {}) {
  const {
    getWrapAgentsForIdes,
    isHeadroomAvailable,
    installHeadroom,
    headroomPrepareWrap,
    printHeadroomUsageHints
  } = require("./headroom-init");

  const wrapAgents = getWrapAgentsForIdes(selectedIdeIds);
  if (!wrapAgents.length) {
    return;
  }

  const agentList = wrapAgents.join(", ");
  const want = await promptYesNo(
    `Set up Headroom context compression (headroom wrap) for ${agentList}?`,
    false
  );
  if (!want) {
    return;
  }

  if (!isHeadroomAvailable()) {
    const install = await promptYesNo(
      "Headroom CLI not found. Install now with uv? (Python 3.10+, large download)",
      true
    );
    if (!install) {
      console.log("\nInstall later: npx kenmark-skills install-recommended --ids headroom -y");
      printHeadroomUsageHints(wrapAgents);
      return;
    }
    if (!installHeadroom({ dryRun: opts.dryRun })) {
      console.log("Headroom install did not complete — skip wrap setup.");
      return;
    }
  }

  console.log("\nHeadroom wrap setup (prepare-only — does not launch your agent):\n");
  for (const agent of wrapAgents) {
    const result = headroomPrepareWrap(agent, { dryRun: opts.dryRun });
    if (!result.ok) {
      console.log(`  ⚠ headroom wrap ${agent} --prepare-only exited non-zero (you can retry manually)`);
    }
  }

  if (wrapAgents.includes("cursor")) {
    console.log(
      "\nCursor (built-in/Auto): rtk is in this project's .cursorrules — prefix shell commands with `rtk`."
    );
    console.log(
      "Cursor (BYOK only): run `headroom wrap cursor` for proxy base URL in model settings."
    );
  }

  printHeadroomUsageHints(wrapAgents);
}

module.exports = {
  IDE_LABELS,
  createRl,
  ask,
  wantsInteractive,
  assertInteractiveStdin,
  NONINTERACTIVE_STDIN_HINT,
  stdinEnded,
  promptYesNo,
  getScopePromptLines,
  promptScope,
  rejectProjectScopeInArgv,
  normalizeCliArgv,
  PROJECT_SCOPE_REMOVED,
  promptAction,
  promptIde,
  promptSelectPacks,
  promptSelectOptionalPacks,
  promptSelectProfile,
  printProfileSummary,
  promptHighBloatConfirm,
  promptCleanupCategories,
  parseCleanupCategoryChoice,
  promptEccProfile,
  promptMcpProfile,
  promptMcpServers,
  confirmPlan,
  banner,
  promptHeadroomAfterInit
};
