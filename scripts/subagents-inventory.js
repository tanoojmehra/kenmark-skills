#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { wantsInteractive, banner } = require("./interactive");
const {
  buildAgentInventoryRoots,
  getAgentStoreDir,
  isVendoredAgent
} = require("./kenmark-hub");

const home = os.homedir();

const AGENT_IDE_SUBPREFIXES = new Set([
  ".claude",
  ".codex",
  ".cursor",
  ".gemini",
  ".opencode",
  ".minimax",
  ".agents",
  "skills"
]);

const AGENT_SKIPPED_DIRS = new Set([
  "node_modules",
  ".git",
  "docs",
  "contexts",
  "examples",
  "commands",
  "reference",
  "shared"
]);

const KEEP_ALWAYS = new Set([
  "architect",
  "build-error-resolver",
  "capacitor-expert",
  "chief-of-staff",
  "code-reviewer",
  "database-reviewer",
  "doc-updater",
  "e2e-runner",
  "expert-documenter-reviewer",
  "go-build-resolver",
  "go-reviewer",
  "harness-optimizer",
  "kotlin-build-resolver",
  "kotlin-reviewer",
  "loop-operator",
  "nextjs-fullstack-expert",
  "nodejs-expert",
  "planner",
  "python-reviewer",
  "refactor-cleaner",
  "research-problem-solver",
  "security-reviewer",
  "senior-dev-troubleshooter",
  "tdd-guide"
]);

function printUsage() {
  console.log("Usage: node scripts/subagents-inventory.js [options]");
  console.log("");
  console.log("Interactive by default in a terminal. Agents: pass --json and/or --markdown paths.");
  console.log("");
  console.log("Options:");
  console.log("  --json <file>     Write full inventory JSON to file");
  console.log("  --markdown <file> Write human-readable report");
  console.log("  --include-plugins Include ~/.claude/plugins/cache agent trees");
  console.log("  --include-marketplaces Include ~/.claude/plugins/marketplaces agent trees");
  console.log("  --roots a,b,c     Comma-separated root ids (default: known IDE paths)");
  console.log("  -y, --yes         Skip prompts (default paths under ./temp/)");
  console.log("  -h, --help        Show help");
}

function createRl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

async function promptOutputPaths(defaultMd, defaultJson) {
  const rl = createRl();
  console.log("\nWhere should the report be saved?");
  console.log(`  1) markdown only → ${defaultMd} [default]`);
  console.log(`  2) markdown + JSON → ${defaultMd} + ${defaultJson}`);
  console.log("  3) console summary only (no files)\n");
  const answer = await ask(rl, "Choose [1/2/3]: ");
  rl.close();
  const lower = answer.toLowerCase();
  if (lower === "2" || lower === "both" || lower === "json") {
    return { markdown: defaultMd, json: defaultJson };
  }
  if (lower === "3" || lower === "none" || lower === "summary") {
    return { markdown: null, json: null };
  }
  return { markdown: defaultMd, json: null };
}

function parseArgs(argv) {
  const args = {
    json: null,
    markdown: null,
    includePlugins: false,
    includeMarketplaces: false,
    roots: null,
    yes: false,
    explicitOutput: false
  };
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
    if (t === "--json") {
      args.json = argv[i + 1] || null;
      args.explicitOutput = true;
      i += 1;
      continue;
    }
    if (t === "--markdown") {
      args.markdown = argv[i + 1] || null;
      args.explicitOutput = true;
      i += 1;
      continue;
    }
    if (t === "--include-plugins") {
      args.includePlugins = true;
      continue;
    }
    if (t === "--include-marketplaces") {
      args.includeMarketplaces = true;
      continue;
    }
    if (t === "--roots") {
      args.roots = (argv[i + 1] || "").split(",").map((s) => s.trim()).filter(Boolean);
      i += 1;
    }
  }
  return args;
}

function safeRealpath(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}

function listSubdirs(parent) {
  if (!fs.existsSync(parent)) return [];
  try {
    return fs
      .readdirSync(parent, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => path.join(parent, e.name));
  } catch {
    return [];
  }
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = raw.slice(3, end);
  const out = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let value = m[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function readAgentMeta(mdPath) {
  let raw = "";
  try {
    raw = fs.readFileSync(mdPath, "utf8");
  } catch {
    return {
      fmName: null,
      description: "",
      tools: [],
      model: null,
      hasFrontmatter: false
    };
  }
  const fm = parseFrontmatter(raw);
  const hasFrontmatter = Object.keys(fm).length > 0;
  const fmName =
    typeof fm.name === "string" && fm.name.trim() ? fm.name.trim() : null;
  const description = typeof fm.description === "string" ? fm.description : "";
  const tools = Array.isArray(fm.tools) ? fm.tools : [];
  const model = typeof fm.model === "string" ? fm.model : null;
  return { fmName, description, tools, model, hasFrontmatter };
}

function inferCategory(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes("seo")) return "seo";
  if (/\b(design|ui|ux|frontend|visual|impeccable)\b/.test(text)) return "design";
  if (/\b(test|qa|verification|eval|tdd|e2e|reviewer|review)\b/.test(text)) return "testing";
  if (/\b(workflow|router|learning|agent|orchestrate|loop|continuous)\b/.test(text)) return "workflow";
  if (/\b(api|backend|node|python|django|server|database|postgres|java|kotlin|go|swift)\b/.test(text)) return "backend";
  if (/\b(planner|architect|design|system)\b/.test(text)) return "planning";
  if (/\b(research|problem|search|deep)\b/.test(text)) return "research";
  if (/\b(security|scan|vulnerab|threat)\b/.test(text)) return "security";
  if (/\b(optim|harness|build|fix|debug|troubleshoot)\b/.test(text)) return "ops";
  if (/\b(doc|write|article|content)\b/.test(text)) return "docs";
  return "general";
}

function getStoreAgentRealDir(name) {
  const storeAgent = path.join(getAgentStoreDir(), `${name}.md`);
  if (fs.existsSync(storeAgent)) {
    return safeRealpath(storeAgent);
  }
  return null;
}

function walkAgents(rootPath, rootId, entries, stats, options = {}) {
  const { depth = 0, rootIsAgentsRoot = true } = options;
  if (!fs.existsSync(rootPath)) {
    stats.missingRoots.push(rootId);
    return;
  }
  stats.scannedRoots.push({ id: rootId, path: rootPath });

  const stack = [{ dir: rootPath, rel: "", depth, rootIsAgentsRoot }];
  while (stack.length) {
    const { dir, rel, depth: d, rootIsAgentsRoot: isAgents } = stack.pop();
    let children;
    try {
      children = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    const parentIsAgents = path.basename(dir) === "agents";
    for (const child of children) {
      const full = path.join(dir, child.name);
      if (child.isDirectory()) {
        if (child.name.startsWith(".")) continue;
        if (AGENT_SKIPPED_DIRS.has(child.name)) continue;
        const insideAnAgentsLayout = isAgents || parentIsAgents;
        if (!insideAnAgentsLayout && child.name !== "agents") {
          stack.push({
            dir: full,
            rel: rel ? `${rel}/${child.name}` : child.name,
            depth: d + 1,
            rootIsAgentsRoot: false
          });
          continue;
        }
        if (!insideAnAgentsLayout && child.name === "agents") {
          stack.push({
            dir: full,
            rel: rel ? `${rel}/${child.name}` : child.name,
            depth: d + 1,
            rootIsAgentsRoot: true
          });
          continue;
        }
        stack.push({
          dir: full,
          rel: rel ? `${rel}/${child.name}` : child.name,
          depth: d + 1,
          rootIsAgentsRoot: isAgents && parentIsAgents
        });
        continue;
      }
      if (!child.isFile()) continue;
      if (path.extname(child.name).toLowerCase() !== ".md") continue;
      if (!parentIsAgents && !isAgents) continue;
      const meta = readAgentMeta(full);
      const filename = path.basename(full, path.extname(full));
      const parentDir = path.basename(dir);
      let effectiveName = null;
      if (d > 0 && parentDir && parentDir !== "agents") {
        effectiveName = meta.fmName || parentDir;
      } else if (meta.fmName) {
        effectiveName = meta.fmName;
      } else if (meta.hasFrontmatter) {
        continue;
      } else if (d === 0 && filename) {
        effectiveName = filename;
      }
      if (!effectiveName) continue;
      const stat = fs.statSync(full);
      const relPath = rel ? `${rel}/${child.name}` : child.name;
      entries.push({
        name: effectiveName,
        file: full,
        realFile: safeRealpath(full),
        rootId,
        relativePath: relPath,
        description: meta.description,
        tools: meta.tools,
        model: meta.model,
        category: inferCategory(effectiveName, meta.description),
        mtime: stat.mtime.toISOString(),
        size: stat.size,
        vendoredMirror: isVendoredAgent(`${rootId}/${relPath}`)
      });
    }
  }
}

function recommendVerdict(group) {
  const { name, instances } = group;
  const storeReal = getStoreAgentRealDir(name);

  if (storeReal) {
    const hasIdeCopy = instances.some((i) => i.rootId !== "kenmark-store");
    const ideDiffersFromStore = instances.some(
      (i) => i.rootId !== "kenmark-store" && i.realFile !== storeReal
    );
    if (hasIdeCopy && ideDiffersFromStore) {
      return {
        verdict: "adopt-candidate",
        reason: "Store copy exists but IDE copy differs — consolidate and relink."
      };
    }
  }

  if (KEEP_ALWAYS.has(name)) {
    return { verdict: "keep", reason: "Well-known agent — always keep one canonical copy." };
  }
  if (instances.every((i) => i.vendoredMirror)) {
    return {
      verdict: "remove-candidate",
      reason: "Vendored mirror only (e.g. plugin marketplace copies). Safe to prune if you have a global install."
    };
  }
  if (instances.length > 1) {
    const allSameContent = new Set(instances.map((i) => i.realFile)).size === 1;
    if (allSameContent) {
      return {
        verdict: "dedupe",
        reason: `Same agent on disk (${instances.length} paths); keep one canonical and remove redundant symlinks/copies.`
      };
    }
    const vendoredExtras = instances.filter((i) => i.vendoredMirror);
    if (vendoredExtras.length === instances.length - 1) {
      const canonical = instances.find((i) => !i.vendoredMirror) || instances[0];
      return {
        verdict: "remove-candidate",
        reason: `Keep ${canonical.rootId}:${canonical.relativePath}, prune ${vendoredExtras.length} vendored mirror(s).`,
        keep: canonical
      };
    }
    return {
      verdict: "review",
      reason: `${instances.length} distinct copies — diff before deleting.`
    };
  }
  if (instances[0].vendoredMirror) {
    return {
      verdict: "review",
      reason: "Single vendored mirror — keep only if you rely on that harness path."
    };
  }
  return { verdict: "keep", reason: "Unique agent with no duplicate name conflict." };
}

function buildInventory(roots, includePlugins, includeMarketplaces) {
  const entries = [];
  const stats = { missingRoots: [], scannedRoots: [] };

  for (const root of roots) {
    walkAgents(root.path, root.id, entries, stats);
  }

  if (includePlugins) {
    const pluginsCache = path.join(home, ".claude", "plugins", "cache");
    if (fs.existsSync(pluginsCache)) {
      for (const pluginDir of listSubdirs(pluginsCache)) {
        const slug = path.basename(pluginDir);
        walkAgents(pluginDir, `plugins-cache:${slug}`, entries, stats, {
          rootIsAgentsRoot: false
        });
      }
    }
  }

  if (includeMarketplaces) {
    const marketplaces = path.join(home, ".claude", "plugins", "marketplaces");
    if (fs.existsSync(marketplaces)) {
      for (const pluginDir of listSubdirs(marketplaces)) {
        const slug = path.basename(pluginDir);
        walkAgents(pluginDir, `marketplaces:${slug}`, entries, stats, {
          rootIsAgentsRoot: false
        });
      }
    }
  }

  const byName = new Map();
  for (const e of entries) {
    if (!byName.has(e.name)) byName.set(e.name, []);
    byName.get(e.name).push(e);
  }

  const groups = [];
  for (const [name, instances] of byName.entries()) {
    const rec = recommendVerdict({ name, instances });
    groups.push({
      name,
      instances,
      instanceCount: instances.length,
      category: instances[0].category,
      ...rec
    });
  }

  groups.sort((a, b) => {
    const order = { "remove-candidate": 0, "adopt-candidate": 1, dedupe: 2, review: 3, keep: 4 };
    const da = order[a.verdict] ?? 9;
    const db = order[b.verdict] ?? 9;
    if (da !== db) return da - db;
    return b.instanceCount - a.instanceCount || a.name.localeCompare(b.name);
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    totalAgentFiles: entries.length,
    uniqueNames: groups.length,
    duplicateNames: groups.filter((g) => g.instanceCount > 1).length,
    removeCandidates: groups.filter((g) => g.verdict === "remove-candidate").length,
    adoptCandidates: groups.filter((g) => g.verdict === "adopt-candidate").length,
    dedupeCandidates: groups.filter((g) => g.verdict === "dedupe").length,
    reviewCandidates: groups.filter((g) => g.verdict === "review").length,
    scannedRoots: stats.scannedRoots,
    missingRoots: stats.missingRoots
  };

  return { summary, groups, entries };
}

function formatMarkdown(inv) {
  const { summary, groups } = inv;
  const lines = [];
  lines.push("# Sub-agents inventory report");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`| --- | ---: |`);
  lines.push(`| Agent files scanned | ${summary.totalAgentFiles} |`);
  lines.push(`| Unique agent names | ${summary.uniqueNames} |`);
  lines.push(`| Names with duplicates | ${summary.duplicateNames} |`);
  lines.push(`| Remove candidates | ${summary.removeCandidates} |`);
  lines.push(`| Adopt into ~/.kenmark/store/agents | ${summary.adoptCandidates} |`);
  lines.push(`| Dedupe (same inode) | ${summary.dedupeCandidates} |`);
  lines.push(`| Needs manual review | ${summary.reviewCandidates} |`);
  lines.push("");
  lines.push("### Scanned roots");
  for (const r of summary.scannedRoots) {
    lines.push(`- **${r.id}**: \`${r.path}\``);
  }
  if (summary.missingRoots.length) {
    lines.push("");
    lines.push("### Missing roots (skipped)");
    for (const id of summary.missingRoots) {
      lines.push(`- ${id}`);
    }
  }
  lines.push("");
  lines.push("## Recommendations");
  lines.push("");
  lines.push("| Verdict | Agent | Copies | Category | Model | Reason |");
  lines.push("| --- | --- | ---: | --- | --- | --- |");
  for (const g of groups) {
    const reason = (g.reason || "").replace(/\|/g, "\\|").slice(0, 120);
    const model = g.instances[0]?.model || "—";
    lines.push(
      `| ${g.verdict} | ${g.name} | ${g.instanceCount} | ${g.category} | ${model} | ${reason} |`
    );
  }
  lines.push("");
  lines.push("## Duplicate detail (top 40 by copy count)");
  lines.push("");
  const dupes = groups.filter((g) => g.instanceCount > 1).slice(0, 40);
  for (const g of dupes) {
    lines.push(`### ${g.name} (${g.instanceCount} paths) — **${g.verdict}**`);
    lines.push("");
    for (const inst of g.instances) {
      const tag = inst.vendoredMirror ? "vendored" : inst.rootId;
      lines.push(`- \`${inst.file}\` (${tag})`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const DEFAULT_ROOTS = buildAgentInventoryRoots(home);
  let roots = DEFAULT_ROOTS;
  if (args.roots) {
    roots = DEFAULT_ROOTS.filter((r) => args.roots.includes(r.id));
    if (roots.length === 0) {
      console.error(`No matching roots for: ${args.roots.join(", ")}`);
      process.exit(1);
    }
  }

  const defaultMd = path.join(process.cwd(), "temp", "subagents-inventory-report.md");
  const defaultJson = path.join(process.cwd(), "temp", "subagents-inventory.json");

  if (wantsInteractive(args) && !args.explicitOutput) {
    banner("kenmark-skills subagents-inventory", "Scan installed sub-agents · recommend keep vs remove");
    const paths = await promptOutputPaths(defaultMd, defaultJson);
    args.markdown = paths.markdown;
    args.json = paths.json;
  }

  const inv = buildInventory(roots, args.includePlugins, args.includeMarketplaces);

  if (args.json) {
    const dir = path.dirname(args.json);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(args.json, `${JSON.stringify(inv, null, 2)}\n`, "utf8");
    console.log(`Wrote ${args.json}`);
  }

  if (args.markdown) {
    const dir = path.dirname(args.markdown);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(args.markdown, formatMarkdown(inv), "utf8");
    console.log(`Wrote ${args.markdown}`);
  } else if (!args.json && !wantsInteractive(args)) {
    const mdPath = defaultMd;
    const dir = path.dirname(mdPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(mdPath, formatMarkdown(inv), "utf8");
    console.log(`Wrote ${mdPath}`);
  }

  console.log("");
  console.log(
    `Scanned ${inv.summary.totalAgentFiles} agent files → ${inv.summary.uniqueNames} unique names`
  );
  console.log(
    `Remove: ${inv.summary.removeCandidates} | Adopt: ${inv.summary.adoptCandidates} | Dedupe: ${inv.summary.dedupeCandidates} | Review: ${inv.summary.reviewCandidates}`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
