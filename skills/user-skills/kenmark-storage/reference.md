# Kenmark Storage — reference

Concise facts for agents integrating **consumer apps** via API-only, full-proxy Next.js routes. Prefer live storage repo docs when they disagree.

## Detection checklist (Step 0)

| Check | Look for |
| --- | --- |
| Package manager | `pnpm-lock.yaml` / `yarn.lock` / `bun.lockb` / `package-lock.json` |
| Monorepo | `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, root `workspaces` |
| Single vs mono | Single Next at root → app-local `lib/`; monorepo → **shared package** default |
| App Router | `app/` or `src/app/` + `layout.tsx` |
| Pages Router | `pages/` or `src/pages/` |
| Both | Prefer App unless user says Pages |
| Package naming | Match existing `@repo/*` / `packages/*` — default `packages/kenmark-storage/` |

If no Next layout: **stop** — do not scaffold.

## Monorepo placement (default)

| Item | Location |
| --- | --- |
| `@kenmark/storage` | **Shared package only** (`packages/kenmark-storage/package.json`) |
| `KENMARK_STORAGE_*` | One Storage project/key per monorepo; turbo `globalEnv` + app `.env.local` |
| Client, proxy, handlers | `packages/kenmark-storage/src/` |
| API routes | Thin re-exports in each Next app under `app/api/assets/` or `pages/api/assets/` |
| Server-only consumers | Any app imports `createStorage()` from shared package — no duplicate SDK install |

## Single-app placement

| Item | Location |
| --- | --- |
| `@kenmark/storage` | App `package.json` |
| Env | App `.env.local` |
| `lib/storage.ts`, `lib/storage-proxy.ts` | Inside the app |
| API routes | App App or Pages API tree |

## Trust zones

```text
API callers   → your REST API only (app API key) — never Kenmark Storage directly
App server    → Kenmark Storage project API key (ks_live_...) + @kenmark/storage/server
Operators     → kenmark-manage (create project, key, MIME settings) — not end users
Storage API   → Mongo metadata, object store, signing secrets
```

Never put Storage project keys in callers, browsers, or `NEXT_PUBLIC_*`.

## Auth matrix

| Credential | Used for | Notes |
| --- | --- | --- |
| **App API key** | Caller auth on `/api/assets/*` | Your app's `Authorization: Bearer ...`; fail-closed placeholder in skill |
| **Storage project API key** | SDK calls server-side | `assets:read`, `assets:write`, `assets:delete`; from kenmark-manage |
| **Upload token** | Server PUT only | Created by `uploads.create`; never returned to callers |
| **Download HMAC** | Server fetch only | From `signedUrl`; never returned to callers |

Storage does not authenticate end users — your API does.

## API surface (app routes)

| Method | Route | Storage SDK | Scope |
| --- | --- | --- | --- |
| POST | `/api/assets/upload` | `uploads.create` + server PUT | `assets:write` |
| GET | `/api/assets` | `assets.list` | `assets:read` |
| GET | `/api/assets/[assetId]` | `assets.get` + fetch stream | `assets:read` |
| GET | `/api/assets/[assetId]/download` | `signedUrl` + fetch stream | `assets:read` |
| PATCH | `/api/assets/[assetId]` | `assets.update({ visibility })` | `assets:write` |
| DELETE | `/api/assets/[assetId]` | `assets.delete` | `assets:delete` |
| POST | `/api/assets/[assetId]/restore` | `assets.restore` | `assets:delete` |

Responses: **sanitized** — no `publicUrl`, `uploadUrl`, `uploadToken`, or signed Storage URLs.

## Upload pipeline (proxied)

1. Caller `POST /api/assets/upload` with app API key + file body.
2. App validates key; `uploads.create` with Storage project key.
3. App **server PUT** to session URL (not caller).
4. Return sanitized asset JSON with app-domain paths only.

## Delivery (proxied)

| Visibility | Route | Behavior |
| --- | --- | --- |
| `public` | `GET /api/assets/[id]` | Server fetch → stream; no Storage URL in response |
| `private` | `GET /api/assets/[id]/download` | Server `signedUrl` → fetch → stream; **no 302** |
| `deleted` | either | **404** / **410** — do not serve |

Public → private: origin updates immediately; cached public copies may persist.

## Lifecycle

- **Soft delete:** `DELETE` → `status: deleted`, `deletedAt`, `purgeAfter`
- **Restore:** `POST …/restore` before `purgeAfter`
- **Hard purge:** platform worker after `purgeAfter` (not exposed in app API)

## List query params (forward from caller)

`folder`, `limit`, `cursor`, `page`, `status`, `visibility`, `search`, `includeDeleted`

## Originals vs conversion

| Layer | Responsibility |
| --- | --- |
| **Kenmark Storage** | Original bytes, metadata, auth, delivery |
| **Consumer app / shared package** | Sharp/FFmpeg derivatives; fetch original server-side only |

## Env

```bash
KENMARK_STORAGE_URL=https://storage-api.example.com
KENMARK_STORAGE_KEY=ks_live_...    # server only; scopes read/write/delete
APP_API_KEY=...                    # example caller auth for your API
```

## Package imports

| Import | Use |
| --- | --- |
| `@kenmark/storage/server` | `KenmarkStorage` / `createStorage()` |
| `@kenmark/storage` | Types, schemas (`UpdateAssetSchema`, `CreateUploadSchema`) |

Do **not** use `@kenmark/storage/browser` in production integration.

## Route path cheat sheet

| Purpose | Method | App | Pages |
| --- | --- | --- | --- |
| Upload | POST | `app/api/assets/upload/route.ts` | `pages/api/assets/upload.ts` |
| List | GET | `app/api/assets/route.ts` | `pages/api/assets/index.ts` |
| Public serve | GET | `app/api/assets/[assetId]/route.ts` | `pages/api/assets/[assetId].ts` |
| Update visibility | PATCH | same as public serve | same |
| Soft delete | DELETE | same as public serve | same |
| Private download | GET | `app/api/assets/[assetId]/download/route.ts` | `pages/api/assets/[assetId]/download.ts` |
| Restore | POST | `app/api/assets/[assetId]/restore/route.ts` | `pages/api/assets/[assetId]/restore.ts` |

Prefix with `src/` when the app uses `src/`. Monorepo: logic in `packages/kenmark-storage/src/handlers/`; apps re-export.

## Anti-patterns

- Exposing `KENMARK_STORAGE_KEY` or Storage URLs to API callers
- `302` redirect to Storage for download (use stream proxy)
- Returning `uploadUrl` / `uploadToken` / `publicUrl` in JSON
- `@kenmark/storage/browser` / `uploadWithSession` as production path
- Per-app duplicate `@kenmark/storage` in monorepos (use shared package)
- Serving assets with `status: deleted`
- Minting signed URLs without app API key check
- Expecting Storage to create WebP/AVIF variants on upload
- Scaffolding Next inside this skill when none exists
- End-user Storage UI or direct Storage access for callers
