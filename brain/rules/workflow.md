# Development workflow

## Git branch policy

Protected **deployment branches** — pushing triggers release expectations. Do not commit or push directly unless a human explicitly approves.

| Branch | Purpose | Direct commit/push |
| --- | --- | --- |
| `main` | Production / default branch | no |

### Workflow

- Use feature branches (`feat/…`, `fix/…`, `docs/…`).
- Merge through PR unless explicitly approved for direct push.
- **kenmark-commit** reads this section for protected branches.

## Scope

- Change only what the task requires.
- Skill edits: one skill per commit when splitting work; group related CLI + catalog changes together.

## Local dev

- No dev server — run `npm run validate` and targeted `npm run test:*` scripts.
- `npm test` = validate + CLI smoke + packs verify skip.

## KB update requirement — verified knowledge consistency

After successful verification, identify specific established durable KB claims affected by the change and compare them to source. Update only claims that genuinely became inaccurate; otherwise report `KB already consistent`. Do not create meaningless changelog entries. When preparing a real user-facing release, update root package version and CHANGELOG separately according to release policy.
