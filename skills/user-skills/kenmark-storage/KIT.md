# Kenmark Storage — Skill Kit

First-party skill for **API-only**, **full-proxy** Kenmark Storage integration in **existing** Next.js apps and monorepos.

| Skill | Role | Install path |
| --- | --- | --- |
| **`kenmark-storage`** | REST API integration — proxied upload/list/serve, visibility, soft delete/restore; shared monorepo package; server SDK only; app-side conversion | `~/.cursor/skills/kenmark-storage/` |

## Project types

| Type | Skill behavior |
| --- | --- |
| Single Next.js | `lib/storage.ts` + routes under `/api/assets/*` |
| New / existing monorepo | **Shared** `packages/kenmark-storage/`; all apps use one Storage project; thin route re-exports per app |

**Does not scaffold** apps or workspaces. **No Storage UI** for callers — operators use **kenmark-manage** for project/key setup.

**Routers:** App Router and Pages Router (prefer App if both exist).

## How to install this skill

```bash
npx kenmark-skills init
npx kenmark-skills update --kenmark-only -y
```

Copies to `~/.kenmark/store/skills/kenmark-storage/` and IDE skill dirs. Restart IDE if needed.

## How to invoke

- `/kenmark-storage`
- “add Kenmark Storage API to this app”
- “proxied storage upload download”
- “soft delete asset API”
- Or **`kenmark-router`** auto-pick

## What this skill covers

- Operator pre-flight (kenmark-manage project + key)
- Step 0: detect shape; monorepo → shared package
- Env: `KENMARK_STORAGE_URL` + `KENMARK_STORAGE_KEY` (server only)
- `@kenmark/storage/server` — never browser SDK in production
- REST routes: upload, list, PATCH visibility, DELETE, restore, proxied public/private serve
- Sanitized responses — no Storage hostnames or tokens
- App-side Sharp/FFmpeg conversion (server fetch)

## Related Kenmark skills

| Need | Skill |
| --- | --- |
| Secure-code review | `kenmark-security-review` |
| Secrets scan | `kenmark-repo-secrets` |
| Plan before large change | `kenmark-plan` |
| Troubleshoot | `kenmark-troubleshoot` |
| Commit by feature | `kenmark-commit` |

## Non-goals

- Not kenmark-manage or platform operator work
- Not scaffolding Next/monorepos
- Not browser direct-to-Storage uploads
- Not post-upload conversion inside Storage platform
- Not a project CLI (`add-storage`) — global skill install only
