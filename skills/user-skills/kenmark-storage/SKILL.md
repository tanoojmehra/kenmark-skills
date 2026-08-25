---
name: kenmark-storage
version: 1.2.0
category: workflow
scope: universal
phase: implement
description: "Host project assets on Kenmark Storage — upload originals (public/private), browser upload tokens, signed private downloads, app-side Sharp/FFmpeg conversion with default presets and per-request params. Works for existing Next.js (App or Pages Router) and monorepo workspaces. Use when integrating Kenmark Storage into any project."
triggers:
  - kenmark-storage
  - storage platform
  - "@kenmark/storage"
  - storage upload
  - signed download
  - KENMARK_STORAGE_KEY
  - convert image after upload
  - storage SDK
  - app-side conversion
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

Integrate **`@kenmark/storage`** into an **existing** Next.js app or monorepo workspace — public or private files, browser uploads via one-time tokens, signed private downloads, and optional app-side image/video conversion.

**Does not scaffold** apps or workspaces. The tree must already exist.

Kit overview: see [KIT.md](KIT.md). Deep reference: [reference.md](reference.md).

---

## When to use

- Adding Kenmark Storage to a new or existing Next.js app (repo already created)
- Adding Kenmark Storage to a new or existing monorepo (workspace already created)
- Public or private asset hosting for a project
- Signed private downloads after your app authenticates the viewer
- App-side image/video conversion (Sharp / FFmpeg) after upload

## When not to use

| Intent | Use instead |
| --- | --- |
| Create a Next app or monorepo from scratch | Scaffold first (`create-next-app` / workspace tooling), then re-run this skill |
| Generic app security audit | **`kenmark-security-review`** |
| `.env` / credential leak scan | **`kenmark-repo-secrets`** |
| Vague failure, need RCA | **`kenmark-troubleshoot`** |
| Plan before a big change | **`kenmark-plan`** |

---

## Hard rules

1. **Project API keys stay on the server** — never `NEXT_PUBLIC_*`, never browser bundles.
2. Import server client from **`@kenmark/storage/server`** only (not package root).
3. Browser uses **one-time upload session** from your authenticated API route + `@kenmark/storage/browser`.
4. Private downloads: **authorize your user first**, then `signedUrl` on the server and redirect.
5. Example routes fail closed (`authorized = false`) until real auth is wired — copy that pattern.
6. **Storage is originals-only.** Do not send `processingMode: "web"` expecting variants. Convert in your app (below).
7. **Public vs private is per file**, not per user. Anonymous viewers use `asset.publicUrl`. Private files need **your** login check, then `storage.assets.signedUrl`. Change later with `storage.assets.update(id, { visibility })`.

---

## Core principle

```text
Filesystem is the storage engine → HTTP/SDK is the only tenant interface → never put project API keys in browsers
```

---

## Step 0 — Detect project shape

Run this **before** writing files. Record the answers; all later steps use them.

| Signal | How to detect |
| --- | --- |
| Package manager | `pnpm-lock.yaml` → pnpm; `yarn.lock` → yarn; `bun.lockb` → bun; else `package-lock.json` / npm |
| Monorepo | `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, or root `package.json` `workspaces` |
| Target app | Single app at repo root **or** a Next package under `apps/` / `packages/`. If multiple Next apps, **ask** which one. |
| App Router | `app/` or `src/app/` with `layout.tsx` (or `layout.js`) |
| Pages Router | `pages/` or `src/pages/` |
| Both routers | Prefer **App Router** unless the user asks for Pages |
| Import alias | Match existing `@/` (or relative imports). Do **not** invent a new alias. |
| Lib folder | Prefer existing `lib/` or `src/lib/` under the target app |

**Stop and ask** if neither App nor Pages layout is found — this skill does not scaffold Next.js.

### Supported project types

| Type | Expectation |
| --- | --- |
| New Next.js | Repo/app already created (may be minimal); integrate Storage |
| Existing Next.js | Detect router + lib paths; wire routes and env |
| New monorepo | Workspace already created; pick target Next app; integrate there |
| Existing monorepo | Same as new monorepo; do not create a new shared package unless asked |

### Monorepo placement rules

| Concern | Where it goes |
| --- | --- |
| `@kenmark/storage` dependency | **Target app** `package.json` (not monorepo root unless root *is* the app) |
| `KENMARK_STORAGE_*` env | Env file for the **app that runs Next** (`.env.local` / `.env` matching that package’s convention) |
| Server singleton | Inside the target app: e.g. `apps/web/lib/storage.ts` |
| API routes | Inside the target app (`app/api/...` or `pages/api/...`) |
| Browser upload UI | Package that owns the client UI for that app |
| Shared server package | Only if the repo **already** has a shared server-lib pattern — do not create `packages/*` without asking |
| Turbo / CI env | Note that deploy pipelines must pass `KENMARK_STORAGE_URL` / `KENMARK_STORAGE_KEY` into the app |

CORS: include **each** deployed origin that browser-PUTs to Storage.

---

## Public vs private (anonymous vs authenticated)

Kenmark Storage has **no end-user accounts**. Your app decides who may see a private file.

| Visibility | Who can fetch the bytes |
| --- | --- |
| `public` | Anyone with the URL (`asset.publicUrl`) |
| `private` | Only after your app authenticates the viewer and mints a short-lived signed URL |

Set visibility on upload (`visibility: "public" | "private"`). Change it:

```ts
await storage.assets.update(assetId, { visibility: "private" });
```

Public → private stops new unauthenticated origin hits. One-year immutable cache means old CDN/browser copies may remain. Default to `private` unless public caching is acceptable.

---

## Originals vs conversion

Kenmark Storage keeps the **uploaded original** and serves it via `variant: "original"`. It does not generate WebP/AVIF or resize after upload.

Your app owns conversion:

| Tool | Typical use |
| --- | --- |
| **Sharp** (`sharp`) | Raster images — resize, WebP/AVIF/JPEG, metadata strip |
| **FFmpeg** (`fluent-ffmpeg` or CLI) | Video/audio — transcode, thumbnails, bitrate caps |

At **project/app setup**, define a **default conversion preset** (format + parameters). At runtime:

1. **Upload as original** — always store the source file in Storage first.
2. **Convert to default** — apply the preset (e.g. WebP width 1280, quality 80).
3. **Convert with specific parameters** — same pipeline with per-request overrides (width, format, quality, crop).

Derivatives can live in your DB, object cache, CDN, or a separate bucket — not in Storage `variants/` (that path is legacy-only).

```text
Browser → your API (auth) → Storage upload session → PUT original → asset ready
                ↓
         optional: fetch original → Sharp/FFmpeg → default or custom params → serve/cache derivative
```

---

## Step 1 — Install package

In the **target app** directory (or with `-C` / `--filter` for monorepos), install with the detected package manager:

```bash
# pnpm
pnpm add @kenmark/storage
# yarn
yarn add @kenmark/storage
# npm
npm install @kenmark/storage
# bun
bun add @kenmark/storage
```

Monorepo filter examples: `pnpm --filter web add @kenmark/storage`, `yarn workspace web add @kenmark/storage`.

---

## Step 2 — Env

Add to the target app’s env file (`.env.local` preferred for Next; match repo convention). Never commit secrets.

```bash
# Application server only
KENMARK_STORAGE_URL=https://storage-api.example.com
KENMARK_STORAGE_KEY=ks_live_...   # project API key with needed scopes
```

Scopes typically: `assets:write` (uploads), `assets:read` (list/signed URL), `assets:delete` if needed.

---

## Step 3 — Server singleton

Place under the target app’s existing `lib/` or `src/lib/`:

```ts
// lib/storage.ts  (or src/lib/storage.ts / apps/web/lib/storage.ts)
import { KenmarkStorage } from "@kenmark/storage/server";

export const storage = new KenmarkStorage({
  baseUrl: process.env.KENMARK_STORAGE_URL!,
  apiKey: process.env.KENMARK_STORAGE_KEY!,
});
```

Adjust the import path in routes to match the app’s alias (`@/lib/storage` vs relative).

---

## Step 4 — Authenticated upload-session route

Use **App** or **Pages** based on Step 0. Same fail-closed auth placeholder in both.

### App Router

```ts
// app/api/assets/upload-session/route.ts
// (or src/app/api/assets/upload-session/route.ts)
import { NextResponse } from "next/server";
import { CreateUploadSchema } from "@kenmark/storage";
import { storage } from "@/lib/storage";

export async function POST(request: Request) {
  // REQUIRED: replace with real session/authz for the calling user + target record
  const authorized = false;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = CreateUploadSchema.parse(await request.json());
  const session = await storage.uploads.create(input);
  return NextResponse.json(session, { status: 201 });
}
```

### Pages Router

```ts
// pages/api/assets/upload-session.ts
// (or src/pages/api/assets/upload-session.ts)
import type { NextApiRequest, NextApiResponse } from "next";
import { CreateUploadSchema } from "@kenmark/storage";
import { storage } from "@/lib/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // REQUIRED: replace with real session/authz
  const authorized = false;
  if (!authorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const input = CreateUploadSchema.parse(req.body);
  const session = await storage.uploads.create(input);
  return res.status(201).json(session);
}
```

Client sends: `filename`, `contentType`, `sizeBytes`, optional `visibility`, `folder`, `metadata`. `processingMode` is accepted and ignored.

---

## Step 5 — Browser upload

Router-agnostic (same for App and Pages). Call your upload-session API path:

```ts
import { uploadWithSession } from "@kenmark/storage/browser";
import type { UploadSession } from "@kenmark/storage";

const sessionRes = await fetch("/api/assets/upload-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    visibility: "private",
  }),
});
const session = (await sessionRes.json()) as UploadSession;

const asset = await uploadWithSession({
  session,
  file,
  onProgress: ({ percentage }) => console.log(percentage),
});
```

---

## Step 6 — Private download redirect

### App Router

```ts
// app/api/assets/[assetId]/download/route.ts
import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const authorized = false; // REQUIRED: real authz
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assetId } = await context.params;
  const { url } = await storage.assets.signedUrl(assetId, {
    variant: "original",
    expiresIn: 300,
    download: true,
  });
  return NextResponse.redirect(url, 302);
}
```

### Pages Router

```ts
// pages/api/assets/[assetId]/download.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "@/lib/storage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authorized = false; // REQUIRED: real authz
  if (!authorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const assetId = String(req.query.assetId || "");
  if (!assetId) {
    return res.status(400).json({ error: "Missing assetId" });
  }

  const { url } = await storage.assets.signedUrl(assetId, {
    variant: "original",
    expiresIn: 300,
    download: true,
  });
  return res.redirect(302, url);
}
```

Public assets can use `asset.publicUrl` (or `signedUrl` with `download: false`, which returns that stable URL). Still do not put API keys in the client.

Anonymous users should never receive a private signed URL. Authenticated users get one only after **your** authorization check.

---

## App-side conversion (Sharp / FFmpeg)

### Setup — default preset

Define defaults once (env, config module, or per-tenant DB row). Example image preset:

```ts
// lib/media-presets.ts
export const DEFAULT_IMAGE_CONVERT = {
  format: "webp" as const,
  maxWidth: 1280,
  quality: 80,
  withoutEnlargement: true,
};

export type ImageConvertParams = {
  format?: "webp" | "avif" | "jpeg" | "png";
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};
```

Video/audio: mirror the same idea with FFmpeg output format, resolution, and codec options in `DEFAULT_VIDEO_CONVERT`.

Install Sharp in the **same target app** (detected package manager):

```bash
pnpm add sharp
# or: yarn add sharp / npm install sharp / bun add sharp
# optional: fluent-ffmpeg + system ffmpeg for video
```

### Workflow 1 — Upload as original

Always complete the Storage upload first. The asset is `ready` immediately; no processing job.

```ts
const session = await storage.uploads.create({
  filename: file.name,
  contentType: file.type || "application/octet-stream",
  sizeBytes: file.size,
  visibility: "private",
  folder: "/uploads/",
});
await uploadWithSession({ session, file });
// original is in Storage; convert separately if needed
```

### Workflow 2 — Convert to default

After upload (or when serving), fetch the original and apply the default preset:

```ts
import sharp from "sharp";
import { DEFAULT_IMAGE_CONVERT } from "@/lib/media-presets";

async function convertImageToDefault(originalBytes: Buffer): Promise<Buffer> {
  return sharp(originalBytes)
    .resize({
      width: DEFAULT_IMAGE_CONVERT.maxWidth,
      withoutEnlargement: DEFAULT_IMAGE_CONVERT.withoutEnlargement,
    })
    .toFormat(DEFAULT_IMAGE_CONVERT.format, { quality: DEFAULT_IMAGE_CONVERT.quality })
    .toBuffer();
}

// Example: signed download → transform → respond
const { url } = await storage.assets.signedUrl(assetId, { variant: "original", expiresIn: 60 });
const original = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
const webp = await convertImageToDefault(original);
```

Cache the derivative (filesystem, Redis, your CDN) if the same output is requested often.

### Workflow 3 — Convert with specific parameters

Merge request overrides onto defaults:

```ts
import sharp from "sharp";
import { DEFAULT_IMAGE_CONVERT, type ImageConvertParams } from "@/lib/media-presets";

async function convertImage(
  originalBytes: Buffer,
  params: ImageConvertParams = {},
): Promise<Buffer> {
  const format = params.format ?? DEFAULT_IMAGE_CONVERT.format;
  const maxWidth = params.maxWidth ?? DEFAULT_IMAGE_CONVERT.maxWidth;
  const quality = params.quality ?? DEFAULT_IMAGE_CONVERT.quality;

  return sharp(originalBytes)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .toFormat(format, { quality })
    .toBuffer();
}

// Route handler: ?width=640&format=webp
const webp640 = await convertImage(original, { maxWidth: 640 });
```

Expose overrides only behind **your** auth and rate limits. Dynamic `?width=` on Storage URLs is not supported — your app implements that layer.

### Video (FFmpeg)

Same three workflows: upload original to Storage, then transcode with FFmpeg using default or request-specific `-vf scale`, codec, and bitrate. Run FFmpeg in a worker/queue if jobs are long; do not block the upload response.

### What not to do

- Do not expect Storage to create `webp-640` or similar variant paths on new uploads.
- Do not put Sharp/FFmpeg in the kenmark-storage monorepo worker unless explicitly redesigning the platform (out of scope).
- Do not skip storing the original when you only need a derivative — keep the source in Storage for reprocessing.

---

## CORS & origins (platform side)

If the **browser** PUTs directly to the Storage API:

- Platform project `allowedOrigins` should include your app origin (or empty = any origin with a valid upload token).
- Platform `CORS_ALLOWED_ORIGINS` must include your app (and dashboard) origins.
- Monorepos: include every deployed frontend origin that uploads.

If uploads are proxied only through your app server, browser→API CORS is less critical — prefer the documented browser upload token flow.

---

## MIME / size

- Respect project allowlist (empty allowlist on the platform **denies** all).
- Max object size is capped (platform default 5 GiB; project may be lower).
- Send exact `sizeBytes`; the upload token is bound to that size.

---

## Checklist before merge

- [ ] Project shape detected (package manager, mono vs single, App vs Pages, target app)
- [ ] `@kenmark/storage` installed on the **target app**, not wrongly on monorepo root
- [ ] No API key in client code or `NEXT_PUBLIC_*`
- [ ] Upload-session and signed-URL routes enforce **your** auth (App or Pages path matches router)
- [ ] Errors from Storage API are not blindly reflected with secrets
- [ ] Private links expire (`expiresIn` sensible, e.g. 60–300s)
- [ ] AbortSignal / progress handled if UX requires it
- [ ] Original uploaded to Storage; conversion (if any) runs in app with Sharp/FFmpeg
- [ ] Default conversion preset documented in app config; per-request overrides validated and bounded
- [ ] Public files use `publicUrl`; private files go through app auth + `signedUrl`
- [ ] Visibility changes use `assets.update`; public→private cache warning understood
- [ ] CORS origins cover all uploading frontends (esp. monorepo multi-app)

---

## Reference

- [KIT.md](KIT.md) — install, invoke, project types
- [reference.md](reference.md) — trust zones, auth matrix, detection, monorepo placement

When the storage monorepo is available:

- `examples/nextjs-app/` — patterns
- `docs/sdk-distribution.md` — publish/consume
- `docs/api.md` — HTTP details

Canonical packages: `@kenmark/storage-contracts`, `@kenmark/storage`.
