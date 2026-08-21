# Kenmark Storage — Skill Kit

First-party skill for **consuming** Kenmark Storage from any app (Next.js, Node, etc.).

| Skill | Role | Install path |
| --- | --- | --- |
| **`kenmark-storage`** | Host assets via `@kenmark/storage` — uploads, public/private delivery, signed URLs, app-side Sharp/FFmpeg conversion | `~/.cursor/skills/kenmark-storage/` (and other IDE skill dirs via Kenmark hub) |

## How to install

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

- Env: `KENMARK_STORAGE_URL` + `KENMARK_STORAGE_KEY` (server only)
- Server singleton from `@kenmark/storage/server`
- Authenticated upload-session routes + browser `uploadWithSession`
- Public vs private visibility and signed private downloads
- App-side conversion with Sharp (images) / FFmpeg (video) — default preset + per-request params

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
- Not platform-internal monorepo work (API/worker/nginx/Unraid operators)
- **Not** post-upload conversion inside Storage — apps convert with Sharp/FFmpeg
- Does not replace auth in your app — Storage has no end-user accounts
