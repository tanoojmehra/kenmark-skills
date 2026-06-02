#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { wantsInteractive, banner } = require("./interactive");
const {
  buildInventoryRoots,
  getStoreDir,
  getAdoptableSkillNames,
  isVendoredMirror
} = require("./kenmark-hub");

const home = os.homedir();
const repoRoot = path.resolve(__dirname, "..");
const userSkillsDir = path.join(repoRoot, "skills", "user-skills");
const catalogPath = path.join(userSkillsDir, "recommended-catalog.json");

const DEFAULT_ROOTS = buildInventoryRoots(home);

const KEEP_ALWAYS = new Set([
  "impeccable",
  "skills-router",
  "find-skills",
  "init-brain",
  "commit-push",
  "skills-maintain",
  "skills-install-recommended",
  "skills-update",
  "skills-init",
  "issues-check",
  "issues-list",
  "issues-maintenance",
  "issues-scan",
  "issues-setup"
]);

function printUsage() {
  console.log("Usage: node scripts/skills-inventory.js [options]");
  console.log("");
  console.log("Interactive by default in a terminal. Agents: pass --json and/or --markdown paths.");
  console.log("");
  console.log("Options:");
  console.log("  --json <file>     Write full inventory JSON to file");
  console.log("  --markdown <file> Write human-readable report");
  console.log("  --include-plugins Include ~/.claude/plugins/cache skill trees");
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

function readDescription(skillMdPath) {
  try {
    const raw = fs.readFileSync(skillMdPath, "utf8");
    const m = raw.match(/^description:\s*(.+?)(?:\n\w[\w-]*:|\n---|$)/ms);
    if (!m) return "";
    return m[1].replace(/\s+/g, " ").trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

function inferCategory(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes("seo")) return "seo";
  if (/\b(design|ui|ux|frontend|visual|impeccable)\b/.test(text)) return "design";
  if (/\b(test|qa|verification|eval|tdd)\b/.test(text)) return "testing";
  if (/\b(workflow|router|learning|agent|ecc|gstack)\b/.test(text)) return "workflow";
  if (/\b(api|backend|django|python|database|server|nestjs)\b/.test(text)) return "backend";
  return "general";
}

function getStoreSkillRealDir(name) {
  const storeSkill = path.join(getStoreDir(), name);
  if (fs.existsSync(path.join(storeSkill, "SKILL.md"))) {
    return safeRealpath(storeSkill);
  }
  return null;
}

function buildAdoptableNameSet() {
  try {
    return new Set(
      getAdoptableSkillNames(userSkillsDir, catalogPath, { homeDir: os.homedir() })
    );
  } catch {
    return new Set();
  }
}

function walkSkills(rootPath, rootId, entries, stats) {
  if (!fs.existsSync(rootPath)) {
    stats.missingRoots.push(rootId);
    return;
  }
  stats.scannedRoots.push({ id: rootId, path: rootPath });

  const stack = [{ dir: rootPath, rel: "" }];
  while (stack.length) {
    const { dir, rel } = stack.pop();
    let children;
    try {
      children = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    const skillMd = path.join(dir, "SKILL.md");
    if (fs.existsSync(skillMd)) {
      const name = path.basename(dir);
      const realDir = safeRealpath(dir);
      const description = readDescription(skillMd);
      const stat = fs.statSync(skillMd);
      entries.push({
        name,
        skillDir: dir,
        skillMd,
        realDir,
        rootId,
        relativePath: rel ? `${rel}/${name}` : name,
        description,
        category: inferCategory(name, description),
        mtime: stat.mtime.toISOString(),
        vendoredMirror: isVendoredMirror(`${rootId}/${rel}/${name}`)
      });
      continue;
    }
    for (const child of children) {
      if (!child.isDirectory()) continue;
      if (child.name.startsWith(".")) continue;
      stack.push({
        dir: path.join(dir, child.name),
        rel: rel ? `${rel}/${child.name}` : child.name
      });
    }
  }
}

function recommendVerdict(group, adoptableNames) {
  const { name, instances } = group;
  const storeReal = getStoreSkillRealDir(name);

  if (adoptableNames.has(name)) {
    const hasIdeCopy = instances.some((i) => i.rootId !== "kenmark-store");
    const storeMissing = !storeReal;
    const ideDiffersFromStore =
      storeReal &&
      instances.some((i) => i.rootId !== "kenmark-store" && i.realDir !== storeReal);
    if ((storeMissing && hasIdeCopy) || ideDiffersFromStore) {
      return {
        verdict: "adopt-candidate",
        reason: storeMissing
          ? "Catalog skill in IDE paths but not in ~/.kenmark/store — run `kenmark-skills adopt`."
          : "IDE copy differs from ~/.kenmark/store — run `kenmark-skills adopt` to consolidate and relink."
      };
    }
  }

  if (KEEP_ALWAYS.has(name)) {
    return { verdict: "keep", reason: "Kenmark / team curated — always keep one canonical copy." };
  }
  if (instances.every((i) => i.vendoredMirror)) {
    return {
      verdict: "remove-candidate",
      reason: "Vendored mirror only (e.g. gstack multi-harness copies). Safe to prune if you use a global install."
    };
  }
  if (instances.length > 1) {
    const storeInst = instances.find((i) => i.rootId === "kenmark-store");
    const canonical =
      storeInst ||
      instances.find((i) => i.rootId === "agents") ||
      instances.find((i) => i.rootId === "cursor") ||
      instances[0];
    const extras = instances.filter((i) => i !== canonical);
    const allSymlinksSame = new Set(instances.map((i) => i.realDir)).size === 1;
    if (allSymlinksSame) {
      const storeHint = storeInst
        ? "Keep ~/.kenmark/store and relink IDE paths to the store."
        : `Keep ${canonical.rootId}:${canonical.relativePath}, remove redundant symlinks/copies.`;
      return {
        verdict: "dedupe",
        reason: `Same skill on disk (${instances.length} paths); ${storeHint}`,
        keep: canonical
      };
    }
    if (extras.every((i) => i.vendoredMirror)) {
      return {
        verdict: "remove-candidate",
        reason: `Duplicate name; keep ${canonical.rootId} copy, prune ${extras.length} vendored mirror(s).`,
        keep: canonical
      };
    }
    return {
      verdict: "review",
      reason: `${instances.length} distinct copies — compare content before deleting.`,
      keep: canonical
    };
  }
  if (instances[0].vendoredMirror) {
    return {
      verdict: "review",
      reason: "Single vendored mirror — keep only if you rely on that harness path."
    };
  }
  return { verdict: "keep", reason: "Unique skill with no duplicate name conflict." };
}

function buildInventory(roots, includePlugins) {
  const entries = [];
  const stats = { missingRoots: [], scannedRoots: [] };
  const adoptableNames = buildAdoptableNameSet();

  for (const root of roots) {
    walkSkills(root.path, root.id, entries, stats);
  }

  if (includePlugins) {
    const pluginsCache = path.join(home, ".claude", "plugins", "cache");
    if (fs.existsSync(pluginsCache)) {
      walkSkills(pluginsCache, "plugins-cache", entries, stats);
    }
  }

  const byName = new Map();
  for (const e of entries) {
    if (!byName.has(e.name)) byName.set(e.name, []);
    byName.get(e.name).push(e);
  }

  const groups = [];
  for (const [name, instances] of byName.entries()) {
    const rec = recommendVerdict({ name, instances }, adoptableNames);
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
    totalSkillFiles: entries.length,
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
  lines.push("# Skills inventory report");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`| --- | ---: |`);
  lines.push(`| SKILL.md files scanned | ${summary.totalSkillFiles} |`);
  lines.push(`| Unique skill names | ${summary.uniqueNames} |`);
  lines.push(`| Names with duplicates | ${summary.duplicateNames} |`);
  lines.push(`| Remove candidates | ${summary.removeCandidates} |`);
  lines.push(`| Adopt into ~/.kenmark/store | ${summary.adoptCandidates} |`);
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
  lines.push("| Verdict | Skill | Copies | Category | Reason |");
  lines.push("| --- | --- | ---: | --- | --- |");
  for (const g of groups) {
    const reason = (g.reason || "").replace(/\|/g, "\\|").slice(0, 120);
    lines.push(
      `| ${g.verdict} | ${g.name} | ${g.instanceCount} | ${g.category} | ${reason} |`
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
      lines.push(`- \`${inst.skillDir}\` (${tag})`);
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

  let roots = DEFAULT_ROOTS;
  if (args.roots) {
    roots = DEFAULT_ROOTS.filter((r) => args.roots.includes(r.id));
    if (roots.length === 0) {
      console.error(`No matching roots for: ${args.roots.join(", ")}`);
      process.exit(1);
    }
  }

  const defaultMd = path.join(process.cwd(), "temp", "skills-inventory-report.md");
  const defaultJson = path.join(process.cwd(), "temp", "skills-inventory.json");

  if (wantsInteractive(args) && !args.explicitOutput) {
    banner("kenmark-skills inventory", "Scan installed skills · recommend keep vs remove");
    const paths = await promptOutputPaths(defaultMd, defaultJson);
    args.markdown = paths.markdown;
    args.json = paths.json;
  }

  const inv = buildInventory(roots, args.includePlugins);

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
    `Scanned ${inv.summary.totalSkillFiles} SKILL.md files → ${inv.summary.uniqueNames} unique names`
  );
  console.log(
    `Remove: ${inv.summary.removeCandidates} | Adopt: ${inv.summary.adoptCandidates} | Dedupe: ${inv.summary.dedupeCandidates} | Review: ${inv.summary.reviewCandidates}`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
