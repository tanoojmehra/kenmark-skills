/**
 * Brain artifact templates for Kenmark CLI (scaffolding — not wired to cli.js yet).
 *
 * Planned command:
 *   npx kenmark-skills kenmark-troubleshoot-template --title "cursor slowdown"
 *
 * Creates (in cwd, when brain/ exists or --mkdir):
 *   brain/kenmark-troubleshooting/2026-06-03-cursor-slowdown.md
 *
 * Future home for other templates (e.g. issues) under the same module.
 */

const path = require("path");

/**
 * @param {string} title
 * @returns {string}
 */
function slugifyTitle(title) {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "investigation";
}

/**
 * @param {Date} [date]
 * @returns {string} YYYY-MM-DD
 */
function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * @param {{ title: string, cwd?: string, date?: Date }} opts
 * @returns {{ relativePath: string, absolutePath: string, slug: string, date: string }}
 */
function kenmark-troubleshootingArtifactPaths(opts) {
  const { title, cwd = process.cwd(), date = new Date() } = opts;
  const slug = slugifyTitle(title);
  const dateStr = formatDate(date);
  const filename = `${dateStr}-${slug}.md`;
  const relativePath = path.join("brain", "kenmark-troubleshooting", filename);
  return {
    relativePath,
    absolutePath: path.join(cwd, relativePath),
    slug,
    date: dateStr,
  };
}

/**
 * Markdown body aligned with skills/user-skills/kenmark-troubleshoot/SKILL.md Step 10.
 * @param {{ title: string, date?: Date }} opts
 * @returns {string}
 */
function kenmark-troubleshootingArtifactContent(opts) {
  const { title, date = new Date() } = opts;
  const dateStr = formatDate(date);
  const displayTitle = String(title).trim() || "Investigation";

  return `# Troubleshooting — ${displayTitle}

Date: ${dateStr}
Status: investigating
Owner:

## Problem frame

## Timeline

## Evidence bundle

| ID | Evidence | Source | Supports | Confidence |
| --- | --- | --- | --- | --- |

## Evidence ↔ hypotheses

- (add after bundle rows, e.g. E1, E2 support H1)

## Hypotheses

## Tests run

## Findings

## Action plan

## Resolution

## Follow-up prevention
`;
}

module.exports = {
  slugifyTitle,
  formatDate,
  kenmark-troubleshootingArtifactPaths,
  kenmark-troubleshootingArtifactContent,
};
