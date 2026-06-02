#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const catalogPath = path.join(
  path.resolve(__dirname, ".."),
  "skills",
  "user-skills",
  "recommended-catalog.json"
);

function loadCatalog() {
  if (!fs.existsSync(catalogPath)) {
    return { version: 0, packs: [], profiles: [] };
  }
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

function getPack(catalog, packId) {
  return (catalog.packs || []).find((p) => p.id === packId) || null;
}

function getProfile(catalog, profileId) {
  return (catalog.profiles || []).find((p) => p.id === profileId) || null;
}

/**
 * Flatten profile inheritance (extends) into ordered pack refs.
 * Later refs override earlier ones for the same pack id.
 */
function resolveProfilePackRefs(profileId, catalog) {
  const profile = getProfile(catalog, profileId);
  if (!profile) return null;

  let refs = [];
  if (profile.extends) {
    const parentRefs = resolveProfilePackRefs(profile.extends, catalog);
    if (!parentRefs) return null;
    refs = [...parentRefs];
  }
  refs = refs.concat(profile.packs || []);
  return mergePackRefs(refs);
}

function mergePackRefs(refs) {
  const map = new Map();
  for (const ref of refs) {
    const id = ref.id;
    if (!map.has(id)) {
      map.set(id, { ...ref });
      continue;
    }
    const existing = map.get(id);
    const skills = [
      ...new Set([...(existing.skills || []), ...(ref.skills || [])])
    ];
    map.set(id, {
      ...existing,
      ...ref,
      skills: skills.length ? skills : undefined,
      profile: ref.profile ?? existing.profile,
      mode: ref.mode ?? existing.mode
    });
  }
  return [...map.values()];
}

/**
 * Build install plan entries from pack refs.
 */
function buildInstallPlan(packRefs, catalog) {
  const plan = [];
  for (const ref of packRefs) {
    const pack = getPack(catalog, ref.id);
    if (!pack) {
      plan.push({ packId: ref.id, missing: true, ref });
      continue;
    }
    const eccProfile =
      ref.profile ||
      pack.recommendedProfile ||
      pack.defaultProfile ||
      pack.install?.defaultProfile ||
      "minimal";
    const seoMode =
      ref.mode ||
      (ref.skills?.length ? "selected-skills" : pack.defaultMode || "full");
    plan.push({
      packId: ref.id,
      pack,
      ref,
      eccProfile: pack.id === "ecc" ? eccProfile : null,
      seoSkills: ref.skills?.length ? ref.skills : null,
      seoMode: pack.id === "seo-geo-claude-skills" ? seoMode : null
    });
  }
  return plan;
}

function resolveProfilePlan(profileId, catalog) {
  const refs = resolveProfilePackRefs(profileId, catalog);
  if (!refs) return null;
  const profile = getProfile(catalog, profileId);
  return {
    profileId,
    profile,
    packRefs: refs,
    installPlan: buildInstallPlan(refs, catalog)
  };
}

function weightLabel(plan) {
  const scores = plan
    .filter((e) => !e.missing && e.pack)
    .map((e) => e.pack.bloatScore ?? 1);
  const total = scores.reduce((a, b) => a + b, 0);
  if (total <= 3) return { label: "Low", total };
  if (total <= 6) return { label: "Medium", total };
  if (total <= 9) return { label: "Medium–High", total };
  return { label: "High", total };
}

function riskLabel(profile) {
  if (profile?.risk === "high-bloat") return "High";
  const w = weightLabel(
    buildInstallPlan(resolveProfilePackRefs(profile.id, loadCatalog()) || [], loadCatalog())
  );
  if (w.label === "High") return "High";
  if (w.label === "Medium–High") return "Medium";
  return "Low";
}

function summarizeProfile(profileId, catalog) {
  const resolved = resolveProfilePlan(profileId, catalog);
  if (!resolved) return null;
  const { profile, installPlan } = resolved;
  const weight = weightLabel(installPlan);
  const lines = installPlan
    .filter((e) => !e.missing)
    .map((e) => {
      let suffix = "";
      if (e.eccProfile) suffix = ` (${e.eccProfile})`;
      if (e.seoSkills?.length) {
        suffix = ` (${e.seoSkills.length} SEO/GEO skills)`;
      } else if (e.seoMode === "full") {
        suffix = " (full SEO/GEO pack)";
      }
      return `${e.pack.name}${suffix}`;
    });
  return {
    profileId,
    name: profile.name,
    description: profile.description,
    recommendedFor: profile.recommendedFor || [],
    requiresConfirmation: Boolean(profile.requiresConfirmation),
    risk: profile.risk,
    installLines: lines,
    weight: weight.label,
    bloatTotal: weight.total,
    bloatRisk:
      profile.risk === "high-bloat"
        ? "High"
        : weight.label === "High"
          ? "Medium"
          : weight.label === "Medium–High"
            ? "Medium"
            : "Low"
  };
}

function resolveInstallCommands(entry, scope, catalog) {
  const pack = entry.pack;
  if (!pack) return [];

  if (pack.id === "seo-geo-claude-skills" && entry.seoSkills?.length) {
    const skillBlock = pack.install?.skillInstall?.[scope];
    const cwd =
      skillBlock?.cwd === "project" ? process.cwd() : undefined;
    return entry.seoSkills.map((skill) => {
      let cmd =
        skillBlock?.command ||
        `npx --yes skills add aaron-he-zhu/seo-geo-claude-skills ${scope === "global" ? "-g " : ""}-y -s {{skill}}`;
      cmd = cmd.replace(/\{\{skill\}\}/g, skill);
      return { command: cmd, cwd, label: skill };
    });
  }

  const block = pack.install?.[scope];
  if (!block?.command) return [];

  let cmd = block.command;
  if (pack.id === "ecc" && cmd.includes("{{profile}}")) {
    const profile =
      entry.eccProfile ||
      pack.recommendedProfile ||
      pack.install?.defaultProfile ||
      "minimal";
    cmd = cmd.replace(/\{\{profile\}\}/g, profile);
  }
  const cwd = block.cwd === "project" ? process.cwd() : undefined;
  return [{ command: cmd, cwd }];
}

function listProfiles(catalog) {
  return catalog.profiles || [];
}

function defaultProfileId(catalog) {
  return catalog.defaults?.profile || "lean";
}

module.exports = {
  catalogPath,
  loadCatalog,
  getPack,
  getProfile,
  resolveProfilePackRefs,
  mergePackRefs,
  buildInstallPlan,
  resolveProfilePlan,
  summarizeProfile,
  weightLabel,
  resolveInstallCommands,
  listProfiles,
  defaultProfileId
};
