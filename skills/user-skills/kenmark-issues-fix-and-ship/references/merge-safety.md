# Merge safety

Guardrails for Phase 7 of `kenmark-issues-fix-and-ship`. Read `brain/rules/workflow.md` first — its Git branch policy table overrides defaults below.

## Protected deployment branches

| Branch | Role | Direct commit/push |
| --- | --- | --- |
| `main`, `master`, `production` | Production CI/CD | No (unless explicit user override) |
| `dev`, `develop`, `staging` | Staging / test CI/CD | No (unless explicit user override) |

### Never on protected branches (without explicit user request)

- `git commit`
- `git push`
- `git merge` into the protected branch locally

### Always allowed

- Create feature branch: `git switch -c fix/<summary>`
- Push feature branch: `git push -u origin HEAD`
- Open PR from feature branch

---

## PR-first merge (default)

This is the default path. Do not merge without user choosing B or C.

### Step 1 — Push feature branch

```bash
git rev-parse --abbrev-ref @{upstream} 2>/dev/null || git push -u origin HEAD
git push
```

### Step 2 — Create PR

```bash
gh pr create \
  --title "fix: <concise summary>" \
  --body "$(cat <<'EOF'
## Summary
- Fixes issue NNN: <title>
- ...

## Test plan
- [ ] pnpm typecheck
- [ ] pnpm lint
- [ ] Manual: <area>
EOF
)"
```

### Step 3 — Wait for CI or user waiver

Report PR URL. Stop here unless user explicitly requests merge.

### Step 4 — Merge (only when user requests)

```bash
gh pr merge <number> --merge
# or --squash per repo convention
```

---

## Direct merge (explicit user only)

Phrases that qualify:

- "merge to main"
- "merge the PR"
- "commit directly to dev"
- "I understand CI/CD will run"

### Still forbidden

| Action | Reason |
| --- | --- |
| `git push --force` to protected branches | Destructive; never without explicit force request |
| `--no-verify` on commit or push | Skips hooks |
| `git config` changes | Policy violation |
| `Co-authored-by:` / `Made-with:` trailers | Attribution policy |
| Commit on `main` without branch | Use feature branch + PR |

### Pre-merge checklist

- [ ] `pnpm typecheck` passed (or user waived)
- [ ] `pnpm lint` passed (or user waived)
- [ ] `git log -1 --format=%B` on each commit — no trailers
- [ ] Working tree clean on feature branch
- [ ] User confirmed merge target branch
- [ ] PR checks green or user waived

### Merge commands

```bash
# Via PR (preferred even for "direct merge" requests)
gh pr merge <number> --merge

# Report result
git log --oneline -3 origin/main
```

---

## Confirm merge target (required every run)

Use `AskUserQuestion` or ask in chat:

```text
Merge target for this ship run?
A) Open PR only — do not merge (recommended)
B) Open PR and merge to <default-branch> after CI passes
C) Direct merge to <named-branch> — I understand CI/CD may run
```

Record the user's choice in the final report.

---

## Post-merge

```bash
git switch main   # or default branch
git pull
```

Report:

- PR URL
- Merge commit SHA on default branch
- Branch name that was merged
- Any follow-up (e.g. delete feature branch — only if user asks)

---

## Commit safety (Phase 6 cross-reference)

From `kenmark-commit` — applies before merge:

```bash
git log -1 --format=%B
```

If output contains `Co-authored-by:`, `Made-with:`, or similar:

1. Abort — do not push or open PR.
2. Fix hook or amend only per user rules.
3. Retry with clean message.

---

## Failure handling

| Failure | Action |
| --- | --- |
| Push rejected (non-fast-forward) | Report; suggest `git pull --rebase` only if user asks |
| PR checks failing | Report; do not merge unless user waives |
| `gh` not authenticated | Report; provide manual PR URL instructions |
| Protected branch checkout | Create feature branch before any commit |
