# Kenmark Storage — reference

Concise facts for agents integrating **consumer apps**. Prefer live storage repo docs when they disagree.

## Detection checklist (Step 0)

| Check | Look for |
| --- | --- |
| Package manager | `pnpm-lock.yaml` / `yarn.lock` / `bun.lockb` / `package-lock.json` |
| Monorepo | `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, root `workspaces` |
| Target Next app | Root app **or** `apps/*` / `packages/*` with `next` dependency — ask if multiple |
| App Router | `app/` or `src/app/` + `layout.tsx` |
| Pages Router | `pages/` or `src/pages/` |
| Both | Prefer App unless user says Pages |
| Alias / lib | Existing `@/` and `lib/` or `src/lib/` — do not invent |

If no Next layout: **stop** — do not scaffold.

## Monorepo placement

| Item | Location |
| --- | --- |
| `@kenmark/storage` | Target app `package.json` |
| Env vars | Target Next app’s `.env` / `.env.local` |
| `lib/storage.ts` | Inside target app |
| API routes | Target app App or Pages API tree |
| New shared package | Only if user asks or pattern already exists |

## Trust zones

```text
Browser     → upload token, public URL, short-lived private URL only
App server  → project API key (ks_live_...)
Storage API → Mongo metadata, object store, pepper, signing secrets
```

Never put project API keys in browsers or `NEXT_PUBLIC_*`.

## Auth matrix (consumer view)

| Credential | Used for | Notes |
| --- | --- | --- |
| Project API key | Upload sessions, assets CRUD, signed URLs | Server only; scopes e.g. `assets:write`, `assets:read` |
| Upload token | `PUT` of file bytes | One-time; size-bound; from your auth’d session route |
| Download HMAC | Private file query `token` | Mint after **your** app authenticates the viewer |
| Your app session | Who may upload / download private files | Storage does not authenticate end users |

## Upload pipeline (happy path)

1. Your authenticated API creates a session with the project API key (`assets:write`) → quota reserved.
2. Browser/client `PUT` with upload token, exact bytes, size header.
3. MIME allowed (fail closed if project list empty).
4. Asset is `ready` immediately. Originals only — no post-upload conversion. `processingMode` from clients is ignored.

## Originals vs conversion

| Layer | Responsibility |
| --- | --- |
| **Kenmark Storage** | Immutable original bytes, metadata, auth, delivery (`variant: "original"`) |
| **Consumer app** | Default conversion preset at setup; Sharp/FFmpeg to produce derivatives when needed |

App workflows:

1. **Upload as original** — session + PUT; asset is `ready` immediately.
2. **Convert to default** — app fetches original, applies project/app default format + parameters (e.g. WebP max width 1280).
3. **Convert with specific parameters** — same pipeline with per-request overrides (width, format, quality, crop).

## Delivery

| Asset | Anonymous | After **app** authenticates the viewer |
| --- | --- | --- |
| `public` | `asset.publicUrl` | Same URL |
| `private` | Public URL 404 | App mints signed URL → redirect |

- Public cache may be long-lived immutable — flip to private does **not** uncache old copies.
- Private: short `expiresIn` (e.g. 60–300s); prefer `private, no-store` semantics.
- Change visibility later: `storage.assets.update(id, { visibility })`.

## Env (consumer app)

```bash
KENMARK_STORAGE_URL=https://storage-api.example.com
KENMARK_STORAGE_KEY=ks_live_...
```

Never commit real values. Keep keys server-side only.

## Package imports

| Import | Use |
| --- | --- |
| `@kenmark/storage/server` | `KenmarkStorage` singleton |
| `@kenmark/storage/browser` | `uploadWithSession` |
| `@kenmark/storage` | Shared types / schemas (e.g. `CreateUploadSchema`) |

Do not import the server client from the package root.

## Route path cheat sheet

| Router | Upload session | Private download |
| --- | --- | --- |
| App | `app/api/assets/upload-session/route.ts` | `app/api/assets/[assetId]/download/route.ts` |
| Pages | `pages/api/assets/upload-session.ts` | `pages/api/assets/[assetId]/download.ts` |

(Prefix with `src/` when the app uses `src/`.)

## Anti-patterns

- Putting `KENMARK_STORAGE_KEY` in `NEXT_PUBLIC_*` or browser bundles
- Installing `@kenmark/storage` only at monorepo root when the Next app is under `apps/`
- Minting signed private URLs without your app’s auth check
- Expecting Storage to create WebP/AVIF variants on new uploads
- Skipping the original upload when you only need a derivative
- Reflecting Storage API errors that may include secrets
- Open-ended `?width=` on Storage URLs — implement transforms in your app
- Scaffolding a Next app inside this skill when none exists
