---
name: kenmark-audit-loop
version: 1.2.0
category: issues
scope: universal
phase: discover
description: "Manual multi-pass audit loop that files unique issues until convergence. Heavy workflow; use only when explicitly requested."
triggers:
  - audit until clean
  - multi-pass audit
  - exhaustive bug scan
  - audit loop
  - kenmark-audit-loop
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
  - Task
risk: write-files
disable-model-invocation: true
---

# Kenmark Audit Loop

## Purpose

**Audit until converged** — run repeated passes on the user's chosen area (or the full repo), file **only new unique findings** in `brain/issues/`, and **stop when a full pass finds zero new issues**.

This skill orchestrates existing audit lenses (`kenmark-issues-scan`, `kenmark-security-review`, `kenmark-test-coverage`, `kenmark-performance`, `kenmark-repo-docs`, `kenmark-repo-deps`) rather than replacing them.

**Not setup.** If `brain/issues/INDEX.md` is missing, stop and run **`kenmark-tracker-setup`** (or **`kenmark-init`**) first.

---

## Hard Rules

1. **Never modify source code** during the audit. Only document findings as issue files.
2. **Never create an issue** without reading `brain/issues/INDEX.md` and reconciling the ID ledger.
3. **Never reuse an issue ID.** Compute `NEXT_ID = max(all IDs) + 1` from active files, completed files, and INDEX entries.
4. **Never file a duplicate finding** — dedupe by fingerprint (see Step 3) against existing issues and earlier passes in this run.
5. **Always ask the user which area to audit** (Step 0) unless they already named a specific area in the same message.
6. **Convergence is cycle-wide, never lens-wide.** Run every applicable lens in the cycle; stop only when the **entire cycle** files zero new unique issues.
7. **Default to at most 3 full cycles.** A cycle is one complete rotation of all selected lenses plus the semantic pass when applicable.
8. **Use subagents** (`Task`) to cover large directories in parallel when the harness supports it.

---

## Step 0 — Choose audit area

Unless the user already specified an area (e.g. "audit security until clean"), use **AskUserQuestion** with `allow_multiple: true`:

| Option ID | Label |
| --- | --- |
| `all` | **All areas** — full repo, rotate every lens until converged (Recommended) |
| `bugs` | Bugs & gaps — API drift, stale refs, schema mismatches, broken links |
| `security` | Security — auth bypass, injection, SSRF, CORS, exposed secrets patterns |
| `simplify` | Code clarity — nested ternaries, arrow functions, missing types, boilerplate |
| `testing` | Testing — coverage gaps, missing tests, weak assertions |
| `performance` | Performance — N+1 queries, bundle size, slow routes, caching |
| `docs` | Documentation — README accuracy, KB freshness, broken links |
| `deps` | Dependencies — unused packages, lockfile drift, duplicate libs |
| `frontend` | Frontend — UI components, routes, client rendering |
| `backend` | Backend — services, workers, shared libs |
| `api` | API — handlers, routes, request/response contracts |
| `infra` | Infra & DX — scripts, CI, config, tooling |

**Selection rules:**

- If the user picks **`all`**, ignore other selections and run the full lens rotation (Step 2).
- If the user picks **one or more specific areas**, run only lenses mapped to those areas (Step 2 table). Skip unselected lenses.
- If **AskUserQuestion** is unavailable, ask in chat and wait for a reply before scanning.

Record the chosen areas in the run ledger as `selected_areas: string[]`.

---

## Step 1 — Initialize run ledger and ID ledger

Create or update a scratch ledger at `brain/.audit-run.json` (gitignored if the repo ignores `brain/.*`; otherwise acceptable as ephemeral run state):

```json
{
  "started": "YYYY-MM-DD",
  "selected_areas": ["all"],
  "cycle_number": 0,
  "pass_number": 0,
  "fingerprints": [],
  "lenses_completed_this_cycle": [],
  "issues_filed": [],
  "stop_reason": null
}
```

Reconcile the issue ID ledger (same as `kenmark-issues-scan`):

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"

{
  find "$ISSUES_DIR" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  find "$ISSUES_DIR/completed" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  grep -Eo '\b[0-9]{3}\b' "$ISSUES_DIR/INDEX.md" 2>/dev/null
} | grep -E '^[0-9]{3}$' | sort -n | uniq > /tmp/kenmark_all_issue_ids.txt

LAST_ID="$(tail -1 /tmp/kenmark_all_issue_ids.txt 2>/dev/null || echo 000)"
NEXT_ID="$(printf "%03d" "$((10#$LAST_ID + 1))")"
```

If `INDEX.md` and folders disagree, run `kenmark-tracker-maintain` before continuing.

Seed `fingerprints` from all open and completed issues (parse `files:` frontmatter + evidence `file:line` entries) so reruns do not re-file known work.

---

## Step 2 — Lens rotation by area

A **cycle** is one complete rotation through every applicable lens for the selected areas. Each **pass** runs one lens. Rotate lenses in this order; skip lenses that do not apply to the user's selection.

| Lens ID | Applies when area is | Delegate to / patterns from |
| --- | --- | --- |
| `bugs` | `all`, `bugs`, `api`, `backend`, `frontend` | `kenmark-issues-scan` Step 3 grep patterns |
| `security` | `all`, `security`, `api`, `auth`, `backend` | `kenmark-security-review` checklist |
| `simplify` | `all`, `simplify`, `frontend`, `backend`, `dx` | `kenmark-issues-scan` simplify mode |
| `testing` | `all`, `testing` | `kenmark-test-coverage` critical-path audit |
| `performance` | `all`, `performance`, `backend`, `api`, `frontend` | `kenmark-performance` patterns |
| `docs` | `all`, `docs` | `kenmark-repo-docs` checklist |
| `deps` | `all`, `deps`, `infra` | `kenmark-repo-deps` audit |
| `semantic` | `all`, or any area after lens queue empty | Deep read of files flagged in prior passes; paths from `brain/issues/` `files:` for selected areas |

**Cycle loop:**

```text
max_cycles = 3
cycle_number = 0

WHILE cycle_number < max_cycles:
  cycle_number += 1
  cycle_new_issues = 0
  reset lenses_completed_this_cycle

  FOR each applicable lens in order:
    pass_number += 1
    run pass (subagents per top-level directory when repo is large)
    dedupe → file new issues → update INDEX
    cycle_new_issues += new_issues_this_pass
    mark lens completed for this cycle

  IF the normal lens queue produced any findings OR prior issues identify hot paths:
    pass_number += 1
    run one semantic pass over flagged symbols/files
    cycle_new_issues += new_issues_this_pass

  IF cycle_new_issues == 0:
    stop_reason = "converged"
    BREAK

IF stop_reason is still null:
  stop_reason = "max_cycles"
```

A clean **single lens** never means convergence. Continue through the rest of the current cycle even when that lens finds zero issues. Continue the loop **in the same session** across turns until `stop_reason` is set.

---

## Step 3 — Fingerprint deduplication

Before filing any issue, compute a fingerprint:

```text
fingerprint = lower(file_path) + ":" + stable_symbol_or_surface + ":" + category + ":" + root_cause_slug
```

- `stable_symbol_or_surface` — prefer an exported function/class/component, route, config key, schema field, or other stable semantic anchor; use `file-scope` only when no better anchor exists
- `category` — lens id (`bugs`, `security`, `simplify`, etc.)
- `root_cause_slug` — short normalized summary (e.g. `stale-import`, `open-redirect`, `duplicate-validation`)

Line/range belongs in the issue evidence, **not** the primary fingerprint, because line numbers move after edits.

**Skip filing when:**

1. Fingerprint exists in `brain/.audit-run.json` → `fingerprints`
2. An open or completed issue already covers the same stable symbol/surface + root cause (compare titles, evidence, and `files:` frontmatter)
3. The finding is a grep hit without confirming context (read the file first)

After filing, append the fingerprint and issue id to the run ledger.

---

## Step 4 — Run a pass (per lens)

For each pass:

1. **Scope paths** to the selected area when not `all`:

| Area | Typical paths (adapt to repo) |
| --- | --- |
| `frontend` | `src/components/`, `src/app/`, `app/`, `pages/`, `**/*.tsx` |
| `backend` | `src/lib/`, `lib/`, `server/`, `workers/`, `services/` |
| `api` | `**/api/**`, `**/routes/**`, `**/handlers/**` |
| `infra` | `scripts/`, `.github/`, `config/`, root config files |
| `docs` | `README.md`, `brain/`, `docs/` |

2. **Delegate** parallel tracks when useful (via `Task` / subagents):
   - Frontend / API / backend / tests / infra — one track per major directory
   - Each track returns structured findings: `{ file, lines, category, summary, severity }`

3. **Read evidence** — do not file from grep alone; open the file and confirm the bug or gap.

4. **File issues** for confirmed, unique findings only.

---

## Step 5 — Create issue files

For each unique finding, create `brain/issues/{id}-{slug}.md`:

```markdown
---
id: {next-id}
title: {concise one-liner}
severity: P0|P1|P2
area: frontend|backend|api|database|auth|security|ui|testing|performance|dx|infra|docs|workflow|unknown
source: kenmark-audit-loop
status: open
created: {YYYY-MM-DD}
files:
  - path/to/file1
audit:
  pass: {pass_number}
  lens: {lens_id}
  fingerprint: {fingerprint}
---

## Summary

{2-3 sentences: what is wrong, where, and why it matters.}

## Evidence

- `file:line` — description of the finding

## Suggested fix

{Concrete steps to fix the issue.}

## Acceptance criteria

- [ ] {criterion 1}
```

Update `brain/issues/INDEX.md`: ID ledger, active counts, priority tables.

Append a one-line summary to `brain/CHANGELOG.md` when the run completes.

---

## Step 6 — Final report

When the loop stops, report:

| Field | Value |
| --- | --- |
| Selected areas | … |
| Cycles run | … |
| Passes run | … |
| Lenses used | … |
| New issues filed | count + IDs |
| Stop reason | `converged` \| `max_cycles` |
| Deduped (skipped) | count |
| Next steps | `kenmark-tracker-list`, `kenmark-issues-fix-and-ship`, or fix P0s first |

**Converged** means the last **full cycle across all applicable lenses** filed zero new unique issues — not that the repo has zero bugs globally.

---

## Relationship to other skills

| Skill | Role |
| --- | --- |
| `kenmark-issues-scan` | Single-pass bug scan; one lens inside this loop |
| `kenmark-issues-fix-and-ship` | After audit loop — fix filed issues and ship |
| `kenmark-subagents` | Optional; audit loop already delegates per pass |

Do not invoke `kenmark-audit-loop` for a one-shot scan — use `kenmark-issues-scan` or the relevant specialist skill instead.
