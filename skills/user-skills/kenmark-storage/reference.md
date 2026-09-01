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
| Package naming | Match existing workspace scope (`@repo/*`, `@acme/*`, etc.) — default `packages/kenmark-storage/` |

If no Next layout: **stop** — do not scaffold.

## Monorepo placement (default)

| Item | Location |
| --- | --- |
| `@kenmark/storage` | **Shared package only** (`packages/kenmark-storage/package.json`) |
| `KENMARK_STORAGE_*` | One Storage project/key per monorepo; turbo `globalEnv` + app `.env.local` |
| Client, proxy, handlers | `packages/kenmark-storage/src/` |
| API routes | Thin re-exports in each Next app under `app/api/assets/` or `pages/api/assets/` |
| Server-only consumers | Any app imports `createStorage()` from shared package — no duplicate SDK install |

Match the workspace package name (`@repo/kenmark-storage`, `@acme/kenmark-storage`, etc.) — do not copy a placeholder scope blindly.

## Single-app placement

| Item | Location |
| --- | --- |
| `@kenmark/storage` | App `package.json` |
| Env | App `.env.local` |
| `lib/storage.ts`, `lib/storage-proxy.ts` | Inside the app |
| API routes | App App or Pages API tree |

## SDK not on npm yet (sibling repo)

When `@kenmark/storage` is not published:

- Install **only** in `packages/kenmark-storage/package.json` (monorepo) or the target app (single repo).
- Use `file:` **relative to that package**, not the monorepo root:

```json
"@kenmark/storage": "file:../../../kenmark-storage/packages/sdk"
```

Adjust `../` depth to your sibling layout:

```text
consumer-monorepo/packages/kenmark-storage/  →  file:  →  kenmark-storage/packages/sdk
```

- Optional root `pnpm.overrides` for `@kenmark/storage-contracts` if workspace resolution conflicts.
- **CI:** checkout the sibling storage repo or publish the SDK before install.
- Once published, switch to semver and remove `file:`.

## Thin App Router re-exports

Segment config **must live in the route file** — Next.js does not apply re-exported `runtime` / `maxDuration`:

```ts
// ✅ apps/web/app/api/assets/upload/route.ts
export const runtime = "nodejs";
export { POST } from "@acme/kenmark-storage/handlers/upload";

// ❌ Breaks — do not re-export runtime from the shared package
export { POST, runtime } from "@acme/kenmark-storage/handlers/upload";
```

Same pattern for download/serve routes that need `runtime` or `maxDuration`.

## Referencing assets in UI / CMS

After upload:

- Store **app path** `/api/assets/{assetId}` or `{ assetId }` in DB/CMS — never `publicUrl` or Storage hostname.
- **Public** images on anonymous pages: upload with `visibility=public`; use same-origin paths:

```tsx
<img src="/api/assets/ast_abc123" alt="" />
// or next/image with src="/api/assets/ast_abc123" — no remotePatterns for Storage host when proxied
```

- **Private** assets: download route + your auth — do not embed on public pages.
- CMS fields (e.g. `heroImagePath`) override code fallbacks — migrate legacy disk paths (`/images/foo.jpg`) or map via a small `resolveAssetPath()` helper.

## Coexistence with legacy uploads

Kenmark `/api/assets/*` is **separate** from legacy app upload routes (e.g. `/api/uploads`, local disk storage). Add alongside existing flows unless intentionally migrating.

## Trust zones

```text
API callers   → your REST API only (your app auth) — never Kenmark Storage directly
App server    → Kenmark Storage project API key (ks_live_...) + @kenmark/storage/server
Operators     → kenmark-manage (create project, key, MIME settings) — not end users
Storage API   → Mongo metadata, object store, signing secrets
```

Never put Storage project keys (`ks_live_...`) in callers, browsers, or `NEXT_PUBLIC_*`.

## Auth matrix

| Credential | Used for | Notes |
| --- | --- | --- |
| **Your app auth** | Caller access on `/api/assets/*` | Session, JWT, or optional bearer secret — **not** from kenmark-manage |
| **Storage project API key** | SDK calls server-side | `KENMARK_STORAGE_KEY` (`ks_live_...`); scopes `assets:read`, `assets:write`, `assets:delete` |
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

1. Caller `POST /api/assets/upload` with your app auth + file body.
2. App validates auth; `uploads.create` with Storage project key.
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
KENMARK_STORAGE_KEY=ks_live_...    # server only; from kenmark-manage; never give to callers
# Optional: bearer secret for /api/assets/* if not using session/JWT
# ASSETS_API_AUTH_SECRET=...
```

## Package imports

| Import | Use |
| --- | --- |
| `@kenmark/storage/server` | `KenmarkStorage` / `createStorage()` |
| `@kenmark/storage` | Types, schemas (`UpdateAssetSchema`, `CreateUploadSchema`) |

Do **not** use `@kenmark/storage/browser` in production integration. For browser direct-to-Storage upload or 302 redirect downloads, see **`kenmark-storage-sdk`** skill in the **kenmark-storage** repo (not bundled in kenmark-skills).

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

Prefix with `src/` when the app uses `src/`. Monorepo: logic in `packages/kenmark-storage/src/handlers/`; apps re-export with local `runtime`.

## Common pitfalls

| Pitfall | Fix |
| --- | --- |
| Re-export `runtime` / `maxDuration` from shared handler | Declare segment config in the route file; re-export handler only |
| `file:` path from monorepo root | Path relative to `packages/kenmark-storage` |
| CMS/DB still points at legacy disk URL | Update DB or map legacy paths to `/api/assets/{id}` |
| `next/dynamic` with `ssr: false` inside RSC page | Use a client boundary / `ClientOnly` wrapper pattern |
| Asset 404 on public page | Upload must be `public`; private needs auth + download route |
| Caller sends `ks_live_...` | Only server uses `KENMARK_STORAGE_KEY`; callers use your app auth |

## Anti-patterns

- Exposing `KENMARK_STORAGE_KEY` or Storage URLs to API callers
- `302` redirect to Storage for download (use stream proxy)
- Returning `uploadUrl` / `uploadToken` / `publicUrl` in JSON
- `@kenmark/storage/browser` / `uploadWithSession` as production path in this skill
- Per-app duplicate `@kenmark/storage` in monorepos (use shared package)
- Serving assets with `status: deleted`
- Minting signed URLs without your app's auth check
- Expecting Storage to create WebP/AVIF variants on upload
- Scaffolding Next inside this skill when none exists
- End-user Storage UI or direct Storage access for callers
