# Project standards

Universal rules for **kenmark-skills** (npm CLI + bundled skills). Stack, workflow, testing, and release details live in sibling files under `brain/rules/`.

## Scope and quality

- Prefer the smallest correct change; do not refactor unrelated code.
- Match existing patterns in `scripts/` and skill frontmatter before adding new conventions.
- Bundled skills live under `skills/user-skills/<name>/SKILL.md` — flat layout only (no nested category folders on disk).

## Project layout

- **Canonical skills:** `skills/user-skills/` (43 Kenmark skills + `recommended-catalog.json`).
- **CLI:** `scripts/cli.js` dispatches to focused modules (`setup-skills.js`, `kenmark-hub.js`, etc.).
- **Config:** `config/mcp-servers.json`, `config/mcp-profiles.json`.
- Never delete the `brain/` folder — project knowledge base for this repo.
- Use `temp/` for scratch scripts (gitignored).
- Update `brain/kb/` and `brain/CHANGELOG.md` after meaningful CLI, catalog, MCP, or skill changes.

## Brain KB maintenance

- Read relevant `brain/kb/` files before non-trivial work.
- Read relevant `brain/specs/` files before implementing feature or workflow changes.
- After every meaningful change, update the matching numbered KB file or `kb/features/` entry.
- Keep `README.md` lean; move new long-form docs to `brain/kb/`.
- Package `CHANGELOG.md` and version in `package.json` must move with user-facing CLI or skill changes.

## Packages and docs

- Node.js **18+**; no runtime npm dependencies in the published package.
- Use `npm run validate` before commits that touch skills, catalog, or scripts.
- Consumer repos use `npx kenmark-skills init` — this repo documents that CLI, it does not require a local `~/.kenmark` install to develop.

## Safety

- Do not commit secrets, tokens, or local IDE folders (`.cursor/`, `.claude/`, `.agents/`).
- `brain/issues/` and `brain/plans/` are part of the tracked brain — commit them with other `brain/` docs. Teams may add local `.gitignore` entries if they choose not to push trackers.

---

## Organizational defaults (consumer projects)

These are the **default choices** for consumer projects built with Kenmark. They prevent agents from making random architecture/stack decisions when a project doesn't specify its own.

### Architecture

| Scale | Default |
| --- | --- |
| Small / simple | Single application |
| Large / complex | Monorepo |

### UI primitives

Mixed **Radix / Base UI** approach via **shadcn-style composition**. Use shadcn/ui conventions when available; fall back to raw Radix or Base UI primitives when shadcn isn't suitable.

### Database

| Aspect | Default |
| --- | --- |
| Primary DB | **MongoDB** |
| ORM / driver | **Prisma v6.x** (until v7 ships MongoDB support), or **Mongoose** — verify Prisma MongoDB connector status before standardizing on one approach per project |
| Decision | Use Mongoose when the project needs full MongoDB feature depth; use Prisma when the project benefits from unified schema/typegen across non-Mongo services too |

### State management

Provide **local, server, global, realtime, and offline** options with usage guidance so agents can decide per project:

| Category | When |
| --- | --- |
| **Local** (React state, URL params, form state) | Ephemeral UI state, forms, filters |
| **Server** (React Server Components, server actions, SWR/React Query) | Server-cached data, background refetch, stale-while-revalidate |
| **Global** (Zustand, Jotai, Context) | Cross-component shared state, user prefs, auth |
| **Realtime** (WebSocket, Supabase Realtime, Liveblocks) | Live cursors, collaborative editing, push notifications |
| **Offline** (IndexedDB, local-first, partial sync) | Progressive web apps, field data collection, low-connectivity use |

### Deployment

| Aspect | Default |
| --- | --- |
| Target | **Ubuntu VPS** |
| Process manager | **PM2** |
| Not Vercel-first | Vercel is evaluated per project only if it provides clear benefit over VPS |

### When to override

These are *defaults*, not mandates. Deviate when:
- The project's own `brain/kb/`, `package.json`, or config files specify different choices.
- The user explicitly overrides a choice in conversation.
- A project constraint (client mandate, existing infra, team skill set) conflicts.
