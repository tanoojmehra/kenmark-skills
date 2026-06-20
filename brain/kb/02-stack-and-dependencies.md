# Stack and dependencies

Last updated: 2026-06-07
Status: reviewed

## Confirmed facts

- **Node.js** >= 18 (`package.json` `engines`).
- **No runtime npm dependencies** — published package is self-contained scripts + skills + config JSON.
- **Package manager:** npm (`package-lock.json` gitignored locally; no lockfile in published tarball requirement).
- **Module system:** CommonJS throughout `scripts/`.
- Dev/test uses Node child processes (`spawnSync`) to invoke sub-scripts.

## Important files inspected

- `package.json` — scripts, `files`, engines
- `.gitignore` — excludes `node_modules/`, local IDE dirs, `temp/`; `brain/issues/` and `brain/plans/` are tracked (teams may gitignore locally)
- `.npmignore` — excludes `brain/`, IDE dirs from npm pack

## Assumptions

- Maintainers run tests with local `npm install` of the package (file dependency or npm link) for integration tests.

## Unknowns / documentation gaps

- Whether pnpm/yarn are supported for development (npm is canonical in docs).

## Organizational defaults (for consumer projects)

This file documents the **kenmark-skills repo's own stack**. For consumer-project stack defaults, see `brain/rules/standards.md` → **Organizational defaults**:

- **Primary DB:** MongoDB (Prisma v6.x or Mongoose — verify Prisma v7 MongoDB connector before standardizing).
- **UI primitives:** Mixed Radix/Base UI via shadcn-style composition.
- **State management:** Provide local/server/global/realtime/offline options with usage guidance.

## Maintenance notes

- If adding a runtime dependency, update `package.json`, validate-repo checks, and this file — strongly prefer zero-deps.
