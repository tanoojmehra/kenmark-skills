# Kenmark Storage — Skill Kit

First-party skill for **consuming** Kenmark Storage from an **existing** Next.js app or monorepo workspace.

| Skill | Role | Install path |
| --- | --- | --- |
| **`kenmark-storage`** | Host assets via `@kenmark/storage` — uploads, public/private delivery, signed URLs, app-side Sharp/FFmpeg conversion | `~/.cursor/skills/kenmark-storage/` (and other IDE skill dirs via Kenmark hub) |

## Project types (all supported)

| Type | Skill behavior |
| --- | --- |
| New Next.js | Tree must already exist; detect App/Pages Router; integrate |
| Existing Next.js | Detect shape; wire env, singleton, routes, conversion |
| New monorepo | Workspace must already exist; pick target Next app; integrate there |
| Existing monorepo | Same as new monorepo; deps/env/routes stay in the target app |

**Does not scaffold** `create-next-app` or turbo/pnpm workspaces. Scaffold first, then invoke this skill.

**Routers:** App Router and Pages Router (prefer App if both exist unless the user asks otherwise).

## How to install this skill

```bash
# First install (or re-run wizard)
npx kenmark-skills init

# Refresh after kenmark-skills updates (preferred)
npx kenmark-skills update --kenmark-only -y
```

The CLI copies the full skill folder into `~/.kenmark/store/skills/kenmark-storage/` and links/copies it into your IDE skill directories. Restart the IDE if the skill does not appear.

## How to invoke

- `/kenmark-storage`
- “add Kenmark Storage uploads to this app”
- “host assets on kenmark-storage”
- “signed private download”
- “convert image after upload”
- Or let the agent auto-pick from descriptions / **`kenmark-router`**

## What this skill covers

- Step 0: detect package manager, mono vs single, App vs Pages, target app
- Install `@kenmark/storage` on the target app
- Env: `KENMARK_STORAGE_URL` + `KENMARK_STORAGE_KEY` (server only)
- Server singleton from `@kenmark/storage/server`
- Authenticated upload-session + private download routes (App **and** Pages examples)
- Browser `uploadWithSession`
- Public vs private visibility
- App-side conversion with Sharp (images) / FFmpeg (video)

## Related Kenmark skills

| Need | Skill |
| --- | --- |
| Secure-code review of your app’s integration | `kenmark-security-review` |
| Secrets / `.env` in git | `kenmark-repo-secrets` |
| Plan before a large change | `kenmark-plan` |
| Incident / unclear failure | `kenmark-troubleshoot` |
| Commit by feature | `kenmark-commit` |

## Repo docs (when the storage monorepo is available)

- `README.md` — layout & quick start
- `docs/api.md` — HTTP API
- `docs/security.md` — threat model & controls
- `docs/sdk-distribution.md` — publish & consume SDK
- `examples/nextjs-app/` — safe integration patterns

## Non-goals of this kit

- Not a generic S3/MinIO skill
- Not scaffolding Next apps or monorepos
- Not platform-internal monorepo work (API/worker/nginx/Unraid operators)
- **Not** post-upload conversion inside Storage — apps convert with Sharp/FFmpeg
- Does not replace auth in your app — Storage has no end-user accounts
