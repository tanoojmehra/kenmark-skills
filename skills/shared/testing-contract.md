# Shared testing contract

Before writing or running tests in any `kenmark-test-*` skill, follow these rules.

## Package manager

Detect package manager from lockfile:

| Lockfile | Package manager |
| --- | --- |
| `pnpm-lock.yaml` | `pnpm` |
| `yarn.lock` | `yarn` |
| `bun.lockb` | `bun` |
| `package-lock.json` | `npm` |

Prefer package scripts and repo-local binaries before `npx`.

Do not use `npx` to fetch tools unless the tool is already in dependencies/devDependencies or the user approves.

## Safety

- Do not use production data or production credentials.
- Do not hit paid/external services unless explicitly approved.
- Do not add a new test framework if the repo already has a good one.
- Prefer existing scripts and conventions.
- Run the smallest relevant test first.
- Document any env vars or setup needed.
- Update `brain/kb/` when testing setup changes materially.
