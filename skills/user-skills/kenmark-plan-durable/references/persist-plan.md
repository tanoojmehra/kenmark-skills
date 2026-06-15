# Persist plan file (mandatory for kenmark-plan-durable)

## Compute next ID

Never create a plan without reading `brain/plans/INDEX.md`.

Collect IDs from:

1. `INDEX.md` (`Last Assigned ID`, `Next ID`)
2. `brain/plans/[0-9]*.md`
3. `brain/plans/completed/[0-9]*.md`

```bash
PLANS_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/brain/plans"
grep -E 'Last Assigned ID|Next ID' "$PLANS_DIR/INDEX.md"
find "$PLANS_DIR" "$PLANS_DIR/completed" -name "[0-9][0-9][0-9]-*.md" 2>/dev/null | \
  xargs -I{} basename {} | sed 's/-.*//' | sort -n | tail -1
```

Use `Next ID` from INDEX unless a higher ID exists in files — then use highest + 1. Never reuse IDs.

## Collision check

```bash
if find "$PLANS_DIR" "$PLANS_DIR/completed" -name "${NEXT_ID}-*.md" 2>/dev/null | grep -q .; then
  echo "ERROR: ID collision for $NEXT_ID. Recompute from INDEX + active + completed."
  exit 1
fi
```

## Write plan file

Path: `brain/plans/{id}-{slug}.md`

Slug rules: lowercase, hyphens, no numbers in slug. ID: 3-digit zero-padded (`001`, `002`, …).

```yaml
---
id: "{next-id}"
title: {concise one-liner}
tier: {quick|prototype|full-feature|dig-deep|ultrathink}
type: {planning-type}
status: proposed
source: kenmark-plan-durable
created: {YYYY-MM-DD}
files:
  - path/to/file
related_issues: []
related_plans: []
---
```

Include full plan body from the planning steps in `SKILL.md`.

## Update INDEX.md

1. Set `Last Assigned ID` to assigned ID; `Next ID` to assigned + 1 (3-digit)
2. Increment Active plans count
3. Add row to **Proposed** table (ID, Title, Tier)
4. Never decrement `Last Assigned ID` when archiving later
