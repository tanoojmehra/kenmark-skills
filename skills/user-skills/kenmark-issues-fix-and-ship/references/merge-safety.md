# Merge safety

## Protected deployment branches

Default protected (read `brain/rules/workflow.md` first — it overrides):

| Branch | Role |
| --- | --- |
| `main`, `master`, `production` | Production CI/CD |
| `dev`, `develop`, `staging` | Staging / test CI/CD |

Do not commit or push directly to these unless the user explicitly approves and understands pipelines may run.

## PR-first merge

1. Push feature branch: `git push -u origin HEAD`
2. Create PR: `gh pr create --title "..." --body "..."`
3. Wait for CI or note user waiver
4. Merge: `gh pr merge <number> --merge` (or `--squash` per repo habit)

## Direct merge (explicit user only)

Phrases that qualify: "merge to main", "commit directly to dev", "I understand CI/CD will run".

Still forbidden without explicit user request:

- `git push --force` to protected branches
- `--no-verify` on commit or push
- `git config` changes
- Co-authored-by / Made-with trailers

## After merge

- Confirm default branch contains the merge commit
- Report PR URL and SHA
- Optionally sync local `main`: `git switch main && git pull`
