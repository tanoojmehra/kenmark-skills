---
name: kenmark-simplify-scan
version: 1.0.0
category: issues
scope: universal
phase: optimize
description: "Issue-filing scan for simplification opportunities. Does not modify source code."
triggers:
  - scan for simplification opportunities
  - simplify audit
  - kenmark-simplify-scan
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
risk: write-files
disable-model-invocation: true
---

# Kenmark Simplify Scan

## Purpose

**Identify simplification opportunities** across the codebase and **document them as issues** in `brain/issues/`. This skill focuses on enhancing code clarity, consistency, and maintainability without altering exact functionality.

---

## Hard Rules

1. **Never modify source code directly** during the scan. Only document opportunities as issue files.
2. **Preserve exact functionality** when proposing simplifications.
3. **Follow the global ID ledger rules** in `brain/issues/INDEX.md` when raising issues (compute `NEXT_ID = max(all IDs) + 1` from active files, completed files, and index entries).
4. **Use convention links** with the `file://` scheme to point to evidence files and exact lines.
5. **Use subagents** or split task prompts to cover broad directories (e.g., frontend, backend, workers, tests) concurrently when the harness supports it.

---

## Simplification Opportunities Checklist

Audit code against these standard project patterns:
1. **Nested Ternaries:** Identify nested ternary operators (`? :` inside another `? :`). Propose standard `if/else` or `switch` statements instead.
2. **Top-Level Arrow Functions:** Locate top-level function declarations defined using `const foo = () => ...`. Propose using the standard `function` keyword instead.
3. **Missing Return Type Annotations:** Find top-level, helper, or middleware functions lacking explicit return type annotations. Propose adding clear return types (e.g., `: void`, `: Promise<void>`, `: string`).
4. **Redundant Boilerplate & try/catch:** Spot duplicate database initialization, repeated environment loading, or unnecessarily nested try/catch blocks that can be refactored into a single shared helper or global hook.

---

## Step 1 — Reconcile ID Ledger and Compute Next ID

Always consult the project's issues ledger before writing new files:

```bash
ISSUES_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/issues"

{
  # Active issues
  find "$ISSUES_DIR" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  # Completed issues
  find "$ISSUES_DIR/completed" -maxdepth 1 -type f -name "[0-9][0-9][0-9]-*.md" -exec basename {} \; 2>/dev/null | sed 's/-.*//'
  # INDEX entries
  grep -Eo '\b[0-9]{3}\b' "$ISSUES_DIR/INDEX.md" 2>/dev/null
} | grep -E '^[0-9]{3}$' | sort -n | uniq > /tmp/kenmark_all_issue_ids.txt

LAST_ID="$(tail -1 /tmp/kenmark_all_issue_ids.txt 2>/dev/null || echo 000)"
NEXT_ID="$(printf "%03d" "$((10#$LAST_ID + 1))")"

echo "LAST_ID=$LAST_ID"
echo "NEXT_ID=$NEXT_ID"
```

Verify that the ledger values in `brain/issues/INDEX.md` align with these results.

---

## Step 2 — Delegate Scans to cover more ground

To execute a comprehensive audit without hitting context window limitations, divide the codebase by concern and run parallel subagents or focused grep commands:

*   **Frontend UI/Layout:** Scan `src/components/`, `src/app/`, and layout primitives for nested ternaries in conditional rendering or styling.
*   **Core Backend & API:** Scan `src/lib/agent/`, `src/lib/agent-runtime/`, `src/lib/ai/`, `src/app/api/`, and `workers/` for Arrow functions, missing types, and try-catch boilerplate.
*   **Testing Suites:** Scan `tests/` and `e2e/` for helper return types, duplicated mock setups, and absolute path dependencies.

### Grep Search Examples:

```bash
# Find arrow functions assigned to variables
grep -rn "const [a-zA-Z0-9_]\+ = (.*) =>" src/ 2>/dev/null

# Find nested ternaries in JSX/TSX
grep -rn "?.*:.*:.*:" src/ 2>/dev/null

# Find functions with missing return types
grep -rn "function [a-zA-Z0-9_]\+(.*) {" src/ 2>/dev/null | grep -v ":"
```

---

## Step 3 — Document Findings & Update Index

For each high-value simplification opportunity found:
1. Write a new issue file `brain/issues/NNN-slug.md`.
2. Format the issue frontmatter with:
   - `id`: NNN
   - `title`: Short, clear summary
   - `severity`: P2 (or P1 if critical regression/bug)
   - `area`: dx / testing / ui / backend / etc.
   - `source`: kenmark-simplify-scan
   - `status`: open
   - `files`: array of relative paths
3. Include clear evidence with clickable `file://` markdown links referencing line ranges.
4. Add clear acceptance criteria (e.g., `[ ] All functions in x.ts have return types`).
5. Update `brain/issues/INDEX.md` active issues tables, active issue counts, and ledger parameters.
6. Append a summary entry to `brain/CHANGELOG.md` describing the simplification audit pass.
