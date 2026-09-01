---
name: kenmark-storage
version: 1.3.1
category: workflow
scope: universal
phase: implement
description: "API-only Kenmark Storage integration for Next.js — proxied upload/list/download/public serve, visibility updates, soft delete/restore via app REST routes; shared monorepo package; server @kenmark/storage only; app-side Sharp/FFmpeg conversion. Operators provision projects/keys in kenmark-manage."
triggers:
  - kenmark-storage
  - storage platform
  - "@kenmark/storage"
  - storage upload
  - storage API
  - asset list API
  - soft delete asset
  - asset visibility
  - proxied storage
  - KENMARK_STORAGE_KEY
  - convert image after upload
  - storage SDK
  - app-side conversion
  - upload:asset
  - asset id
  - runtime nodejs
  - file: kenmark-storage
  - CMS asset path
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - TodoWrite
  - AskUserQuestion
risk: write-files
disable-model-invocation: false
---

# Kenmark Storage

Integrate **`@kenmark/storage/server`** into an **existing** Next.js app or monorepo — **API-only**, **full proxy** (no Storage hostnames exposed to callers), full asset lifecycle (upload, list, serve, visibility, soft delete, restore), optional app-side conversion.

**Does not scaffold** apps or workspaces. **No end-user Storage UI** — callers use your REST API with **your app auth** (session, JWT, or optional bearer). Operators create Storage projects and keys in **kenmark-manage**.

Kit overview: [KIT.md](KIT.md). Deep reference: [reference.md](reference.md).

---

## When to use

- Adding Kenmark Storage to a new or existing Next.js app (repo already created)
- Adding Kenmark Storage to a new or existing monorepo (shared `packages/kenmark-storage` so all apps access the same assets)
- REST API for upload, list, download, public serve, visibility, soft delete, restore
- Proxied delivery — callers never see Storage URLs or tokens
- App-side image/video conversion (Sharp / FFmpeg) after upload

## When not to use

| Intent | Use instead |
| --- | --- |
| Create a Next app or monorepo from scratch | Scaffold first, then re-run this skill |
| Kenmark Manage / platform operator work | Storage platform docs; not this consumer skill |
| Generic app security audit | **`kenmark-security-review`** |
| `.env` / credential leak scan | **`kenmark-repo-secrets`** |
| Vague failure, need RCA | **`kenmark-troubleshoot`** |
| Plan before a big change | **`kenmark-plan`** |
| Browser direct-to-Storage upload (`uploadWithSession`) or 302 redirect downloads | **`kenmark-storage-sdk`** skill in the **kenmark-storage** repo (non-proxy pattern; not bundled in kenmark-skills) |

---

## Hard rules

1. **`@kenmark/storage/server` only** — never expose Storage project keys or SDK to API callers; never `NEXT_PUBLIC_*`.
2. **No `@kenmark/storage/browser`** in production integration (testing/dev footnote only).
3. **No Storage UI** for callers — all CRUD and delivery via **your** REST API on the app domain.
4. **Never return** `uploadUrl`, `uploadToken`, `publicUrl`, or signed Storage URLs in JSON, redirects, or HTML `src`.
5. **Upload:** caller → your API → server creates session + **server PUT** → sanitized asset JSON.
6. **Download/serve:** auth → server `signedUrl` / `get` → **stream** bytes — **never** `302` redirect to Storage.
7. **Visibility + soft delete** only via app routes (`PATCH`, `DELETE`, `POST …/restore`).
8. **Block download/serve** when `status === "deleted"`.
9. **Public → private:** warn that CDN/browser cache may retain old public copies.
10. Example routes **fail closed** (`validateCallerAuth` returns false) until real auth is wired.
11. **Storage is originals-only.** Convert in your app (Sharp / FFmpeg), not in the Storage platform worker.
12. **Monorepo:** default shared workspace package — one Storage project/key for the whole repo.
13. **App Router segment config** (`export const runtime`, `maxDuration`, etc.) **must be declared in the route file** — never re-exported from the shared package.

---

## Core principle

```text
Callers → your REST API (app domain) → @kenmark/storage/server → Kenmark Storage platform
Never expose Storage hostnames, tokens, or project API keys to callers
```

---

## Operator pre-flight (before coding)

1. In **kenmark-manage**, create a Storage project for this consuming app/monorepo.
2. Create API key with scopes: **`assets:read`**, **`assets:write`**, **`assets:delete`**.
3. Copy `KENMARK_STORAGE_URL` and `KENMARK_STORAGE_KEY` (`ks_live_...`) into server env (never commit).
4. Configure allowed MIME types on the platform (empty allowlist **denies** all uploads).
5. Callers authenticate with **your app auth** — never send `ks_live_...` (`KENMARK_STORAGE_KEY`) to `/api/assets/*`.

### Operator: upload files (CLI pattern)

Optional local script in the **consumer app** (not in kenmark-skills). POST to your app's upload route with **your app auth** — not `KENMARK_STORAGE_KEY`.

```bash
# Single file
pnpm exec dotenv -e .env.local -- node scripts/upload-asset.mjs ./photo.jpg --visibility public

# Multiple files
pnpm exec dotenv -e .env.local -- node scripts/upload-asset.mjs ./a.jpg ./b.png --visibility public

# Folder (script globs or walks directory)
pnpm exec dotenv -e .env.local -- node scripts/upload-asset.mjs ./assets/hero --visibility public --recursive
```

Script behavior:

- Target `http://localhost:3000/api/assets/upload` (or deployed URL)
- `Authorization: Bearer` from your auth env (session token, service secret — **not** `KENMARK_STORAGE_KEY`)
- When using pnpm, filter literal `--` from `process.argv` if present
- One `POST` per file (multipart `file` field)

---

## Step 0 — Detect project shape

Run **before** writing files. Record answers; all later steps use them.

| Signal | How to detect |
| --- | --- |
| Package manager | `pnpm-lock.yaml` → pnpm; `yarn.lock` → yarn; `bun.lockb` → bun; else npm |
| Monorepo | `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, or root `workspaces` |
| App Router | `app/` or `src/app/` with `layout.tsx` |
| Pages Router | `pages/` or `src/pages/` |
| Both routers | Prefer **App Router** unless user asks for Pages |
| Import alias | Match existing `@/` — do not invent |
| Package naming | Match existing `@repo/*` or `packages/*` conventions |

**Stop and ask** if neither App nor Pages layout is found.

### Single app vs monorepo

| Type | Integration |
| --- | --- |
| **Single Next.js app** | `lib/storage.ts` + `lib/storage-proxy.ts` in the app; `@kenmark/storage` in app `package.json` |
| **Monorepo (new or existing)** | **Shared package** `packages/kenmark-storage/` (or match repo naming); `@kenmark/storage` **only in shared package**; thin API route re-exports in each Next app that exposes `/api/assets/*` |

### Monorepo: shared package (default)

When Step 0 detects a monorepo:

1. Detect workspace tool and existing `packages/*` naming.
2. If `packages/kenmark-storage` (or equivalent) exists → extend it.
3. Else → create `packages/kenmark-storage/` with workspace `package.json`.
4. List Next apps under `apps/*` (or `packages/*` with `next` dependency).
5. For each app that needs asset REST APIs → `"@acme/kenmark-storage": "workspace:*"` (match workspace scope) + thin route files.
6. Apps that only need server-side asset access import `createStorage()` from the shared package — no duplicate `@kenmark/storage` per app.

```
packages/kenmark-storage/
  package.json
  src/
    client.ts       # createStorage()
    proxy.ts        # putOriginalToSession, streamFromUrl
    sanitize.ts     # sanitizeAssetForApi
    auth.ts         # validateCallerAuth placeholder
    handlers/       # upload, list, asset, download, restore
    index.ts
```

**Env (one Storage project per monorepo):** `KENMARK_STORAGE_URL` + `KENMARK_STORAGE_KEY` in turbo `globalEnv` and each Next app's `.env.local` (or root `.env` with passthrough). Turbo/CI must pass vars into apps.

---

## Target API surface

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/assets/upload` | Ingest file bytes → Storage original (proxied) |
| `GET` | `/api/assets` | List assets |
| `GET` | `/api/assets/[assetId]` | Stream **public** asset (proxied) |
| `GET` | `/api/assets/[assetId]/download` | Stream **private** asset (proxied) |
| `PATCH` | `/api/assets/[assetId]` | Change visibility `public` / `private` |
| `DELETE` | `/api/assets/[assetId]` | Soft-delete |
| `POST` | `/api/assets/[assetId]/restore` | Restore before purge |

All routes: **`validateCallerAuth(request)`** first (fail-closed). See [reference.md](reference.md) for route paths (App vs Pages).

---

## Public vs private

Kenmark Storage has **no end-user accounts**. Your API decides who may call routes.

| Visibility | Serve route | Notes |
| --- | --- | --- |
| `public` | `GET /api/assets/[assetId]` | Stream via app domain only |
| `private` | `GET /api/assets/[assetId]/download` | Your app auth + authz; stream, no redirect |

Set on upload (`visibility: "public" | "private"`). Change via `PATCH /api/assets/[assetId]`. Default to `private` unless public caching is acceptable.

---

## Referencing assets in UI / CMS

After upload succeeds:

- Store **app path** `/api/assets/{assetId}` or `{ assetId }` in DB/CMS — never `publicUrl` or Storage hostname.
- **Public** images on anonymous pages: upload with `visibility=public`; embed same-origin:

```tsx
<img src="/api/assets/ast_abc123" alt="" />
// next/image: src="/api/assets/ast_abc123" — no remotePatterns for Storage host when proxied
```

- **Private** assets: use download route + your auth — do not embed on public pages.
- CMS fields (e.g. `heroImagePath`) override code fallbacks — migrate legacy disk paths (`/images/foo.jpg`) or map via `resolveAssetPath()`.

See [reference.md](reference.md) — Common pitfalls.

---

## Originals vs conversion

Storage keeps the **uploaded original** only. Your app owns Sharp / FFmpeg conversion (server-side fetch of original — never expose Storage URL to callers). See **App-side conversion** below.

---

## Step 1 — Install package

**Single app:** in the app directory:

```bash
pnpm add @kenmark/storage
# yarn add / npm install / bun add
```

**Monorepo:** in `packages/kenmark-storage/` only:

```bash
pnpm add @kenmark/storage --filter @acme/kenmark-storage
```

Add workspace dependency in each Next app: `"@acme/kenmark-storage": "workspace:*"`. Match workspace scope (`@repo/*`, `@acme/*`, etc.) — do not copy a placeholder blindly.

Optional: `sharp` in the app or shared package for image conversion.

### SDK not on npm yet (sibling repo)

When `@kenmark/storage` is unpublished, in `packages/kenmark-storage/package.json`:

```json
"@kenmark/storage": "file:../../../kenmark-storage/packages/sdk"
```

- Path is **relative to `packages/kenmark-storage`**, not monorepo root.
- Optional root `pnpm.overrides` for `@kenmark/storage-contracts` if resolution conflicts.
- CI must checkout sibling storage repo or publish SDK first.
- Switch to semver once published.

```text
consumer-monorepo/packages/kenmark-storage/  →  file:  →  kenmark-storage/packages/sdk
```

---

## Step 2 — Env

```bash
# Server only — never NEXT_PUBLIC_*
KENMARK_STORAGE_URL=https://storage-api.example.com
KENMARK_STORAGE_KEY=ks_live_...   # from kenmark-manage; assets:read, assets:write, assets:delete

# Optional bearer for /api/assets/* if not using session/JWT (your choice — not from Manage)
# ASSETS_API_AUTH_SECRET=...
```

---

## Step 3 — Shared helpers

**Single app:** `lib/storage.ts` + `lib/storage-proxy.ts`.  
**Monorepo:** `packages/kenmark-storage/src/` — export from `index.ts`.

### Client

```ts
// lib/storage.ts or packages/kenmark-storage/src/client.ts
import { KenmarkStorage } from "@kenmark/storage/server";

let storage: KenmarkStorage | undefined;

export function createStorage(): KenmarkStorage {
  if (!storage) {
    storage = new KenmarkStorage({
      baseUrl: process.env.KENMARK_STORAGE_URL!,
      apiKey: process.env.KENMARK_STORAGE_KEY!,
    });
  }
  return storage;
}
```

### Auth placeholder

Replace with session, JWT, or your existing auth. **Never** accept `KENMARK_STORAGE_KEY` from callers.

```ts
// lib/storage-proxy.ts or packages/kenmark-storage/src/auth.ts
export function validateCallerAuth(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.ASSETS_API_AUTH_SECRET;
  if (!secret) return false; // fail closed until real auth wired
  return auth === `Bearer ${secret}`;
}
```

### Proxy helpers

```ts
// lib/storage-proxy.ts or packages/kenmark-storage/src/proxy.ts
import type { UploadSession } from "@kenmark/storage";

export async function putOriginalToSession(
  session: UploadSession,
  body: ArrayBuffer | Buffer | ReadableStream,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Upload ${session.uploadToken}`,
    "Content-Type": "application/octet-stream",
    ...session.requiredHeaders,
  };
  return fetch(session.uploadUrl, { method: "PUT", headers, body: body as BodyInit });
}

const FORWARD_HEADERS = ["content-type", "content-length", "content-disposition"] as const;

export function streamFromUrl(upstream: Response): Response {
  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
```

### Sanitize API responses

```ts
// lib/storage-proxy.ts or packages/kenmark-storage/src/sanitize.ts
import type { Asset } from "@kenmark/storage";

export function sanitizeAssetForApi(asset: Asset) {
  const { publicUrl: _pu, ...rest } = asset;
  return {
    ...rest,
    urls: {
      public: `/api/assets/${asset.id}`,
      download: `/api/assets/${asset.id}/download`,
    },
  };
}
```

Never include `publicUrl`, `uploadUrl`, or `uploadToken` in JSON sent to callers.

---

## Step 4 — API upload (proxied)

**Route:** `POST /api/assets/upload`

1. `validateCallerAuth` — fail closed.
2. Parse multipart (`file`) or raw body + metadata (`filename`, `contentType`, `sizeBytes`, `visibility`, `folder`).
3. `storage.uploads.create({ ... })` then `putOriginalToSession(session, fileBytes)`.
4. Return `sanitizeAssetForApi(asset)`.

### App Router

```ts
// app/api/assets/upload/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createStorage } from "@/lib/storage";
import { validateCallerAuth, putOriginalToSession, sanitizeAssetForApi } from "@/lib/storage-proxy";

export async function POST(request: Request) {
  if (!validateCallerAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const visibility = (form.get("visibility") as string) || "private";
  const storage = createStorage();
  const session = await storage.uploads.create({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    visibility: visibility === "public" ? "public" : "private",
  });

  const putRes = await putOriginalToSession(session, await file.arrayBuffer());
  if (!putRes.ok) {
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }

  const asset = await putRes.json();
  return NextResponse.json(sanitizeAssetForApi(asset), { status: 201 });
}
```

### Pages Router

```ts
// pages/api/assets/upload.ts
export const config = { api: { bodyParser: false } };
// Use formidable or busboy to parse multipart; same create + putOriginalToSession flow.
```

**Body limits:** App Router — `runtime = "nodejs"`, note hosting `maxDuration` / body size caps. Pages — disable default body parser; enforce max size. Large files stress the app server (proxy tradeoff).

**Caller example:**

```bash
curl -X POST https://yourapp.com/api/assets/upload \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -F "file=@photo.jpg" \
  -F "visibility=private"
```

---

## Step 5 — List assets

**Route:** `GET /api/assets`

Forward query params: `folder`, `limit`, `cursor`, `page`, `status`, `visibility`, `search`, `includeDeleted`.

### App Router

```ts
// app/api/assets/route.ts
import { NextResponse } from "next/server";
import { createStorage } from "@/lib/storage";
import { validateCallerAuth, sanitizeAssetForApi } from "@/lib/storage-proxy";

export async function GET(request: Request) {
  if (!validateCallerAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const storage = createStorage();
  const list = await storage.assets.list({
    folder: searchParams.get("folder") ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    status: (searchParams.get("status") as "ready" | "deleted") ?? undefined,
    visibility: (searchParams.get("visibility") as "public" | "private") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    includeDeleted: searchParams.get("includeDeleted") === "true",
  });

  return NextResponse.json({
    ...list,
    items: list.items.map(sanitizeAssetForApi),
  });
}
```

---

## Step 6 — Update visibility

**Route:** `PATCH /api/assets/[assetId]`

Body: `{ "visibility": "public" | "private" }` — validate with `UpdateAssetSchema` from `@kenmark/storage`.

```ts
// app/api/assets/[assetId]/route.ts (PATCH handler)
import { UpdateAssetSchema } from "@kenmark/storage";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  if (!validateCallerAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { assetId } = await context.params;
  const { visibility } = UpdateAssetSchema.parse(await request.json());
  const storage = createStorage();
  const asset = await storage.assets.update(assetId, { visibility });
  return NextResponse.json(sanitizeAssetForApi(asset));
}
```

Public → private: document cache caveat for API consumers.

---

## Step 7 — Soft delete + restore

**DELETE** `/api/assets/[assetId]` → `storage.assets.delete(assetId)` → `204` or sanitized status JSON.

**POST** `/api/assets/[assetId]/restore` → `storage.assets.restore(assetId)` → sanitized asset JSON.

Platform sets `status: deleted`, `deletedAt`, `purgeAfter`; hard purge is worker-side (out of scope).

```bash
curl -X DELETE https://yourapp.com/api/assets/abc123 \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## Step 8 — Proxied private download

**Route:** `GET /api/assets/[assetId]/download`

1. `validateCallerAuth` + authz.
2. `assets.get(assetId)` — reject if `status === "deleted"`.
3. `signedUrl(assetId, { variant: "original", expiresIn: 300, download: true })` **server-only**.
4. `fetch(url)` → `streamFromUrl(upstream)` — **no redirect**.

```ts
export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  if (!validateCallerAuth(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { assetId } = await context.params;
  const storage = createStorage();
  const asset = await storage.assets.get(assetId);
  if (asset.status === "deleted") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { url } = await storage.assets.signedUrl(assetId, {
    variant: "original",
    expiresIn: 300,
    download: true,
  });
  const upstream = await fetch(url);
  if (!upstream.ok) {
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
  const streamed = streamFromUrl(upstream);
  streamed.headers.set("Cache-Control", "private, no-store");
  return streamed;
}
```

---

## Step 9 — Proxied public serve

**Route:** `GET /api/assets/[assetId]` (same file as PATCH/DELETE — method dispatch)

1. `assets.get` — require `visibility: "public"`, not deleted.
2. Fetch bytes server-side (`publicUrl` or signed URL) — never return URL to caller.
3. Stream via `streamFromUrl`; optional `Cache-Control: public, max-age=...`.

Callers and embeds use `/api/assets/${id}` only — never Storage hostname.

---

## Monorepo thin routes

Each Next app re-exports shared handlers. **Declare segment config in the route file:**

```ts
// apps/web/app/api/assets/upload/route.ts
export const runtime = "nodejs";
export { POST } from "@acme/kenmark-storage/handlers/upload";

// ❌ Do not re-export runtime from the shared package
// export { POST, runtime } from "@acme/kenmark-storage/handlers/upload";
```

Apply the same pattern for download/serve routes that need `runtime` or `maxDuration`.

Apps without public asset API can `import { createStorage } from "@acme/kenmark-storage"` in Server Components / server actions.

---

## App-side conversion (Sharp / FFmpeg)

Conversion runs in the **consumer app** (or shared package), not in the Storage platform.

1. Upload original via API (Step 4).
2. Fetch original **server-side** via `signedUrl` + `fetch` (never expose URL to callers).
3. Sharp / FFmpeg → derivative; cache or serve from your API.

```ts
const { url } = await storage.assets.signedUrl(assetId, { variant: "original", expiresIn: 60 });
const original = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
// sharp(original)... 
```

Do not put Sharp/FFmpeg in the kenmark-storage platform worker.

---

## CORS

Configure CORS on **your** API routes if browser-based API clients call them. No browser→Storage CORS needed — uploads and downloads are proxied through your app.

---

## MIME / size

- Platform project allowlist (empty = deny all).
- Max object size capped (platform default 5 GiB).
- Send exact `sizeBytes` on `uploads.create`.

---

## Checklist before merge

- [ ] Operator pre-flight: Manage project + key with `assets:read`, `assets:write`, `assets:delete`
- [ ] Project shape detected (single vs monorepo, App vs Pages)
- [ ] **Monorepo:** shared `packages/kenmark-storage`; `@kenmark/storage` only in shared package; thin routes per app with local `runtime = "nodejs"`
- [ ] **Single app:** `lib/storage.ts` + `lib/storage-proxy.ts`
- [ ] No Storage key in client or `NEXT_PUBLIC_*`
- [ ] Routes: upload, list, PATCH visibility, DELETE, restore, public serve, private download
- [ ] All delivery **streamed** — no redirects to Storage
- [ ] Responses sanitized — no `publicUrl`, tokens, or Storage hostnames
- [ ] Deleted assets return 404 on download/serve
- [ ] Caller auth fail-closed until real session/JWT wired; callers never send `ks_live_...`
- [ ] Public assets used on site with `visibility=public` and `/api/assets/{id}` paths in CMS/UI
- [ ] Public→private cache warning documented
- [ ] Conversion (if any) server-side only
- [ ] Turbo/CI passes `KENMARK_STORAGE_*` to apps
- [ ] Sibling `file:` SDK path correct if unpublished (see reference.md)

---

## Reference

- [KIT.md](KIT.md) — install, invoke, project types
- [reference.md](reference.md) — trust zones, auth matrix, route cheat sheet, monorepo layout, **common pitfalls**

When the storage monorepo is available: `docs/api.md`, `docs/sdk-distribution.md`.

Canonical packages: `@kenmark/storage-contracts`, `@kenmark/storage`.
