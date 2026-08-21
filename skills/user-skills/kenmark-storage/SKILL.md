---
name: kenmark-storage
version: 1.1.0
category: workflow
scope: universal
phase: implement
description: "Host project assets on Kenmark Storage — upload originals (public/private), browser upload tokens, signed private downloads, app-side Sharp/FFmpeg conversion with default presets and per-request params. Use when integrating Kenmark Storage into any project."
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

Integrate **`@kenmark/storage`** into any application to host assets on the Kenmark Storage platform — public or private files, browser uploads via one-time tokens, signed private downloads, and optional app-side image/video conversion.

Kit overview: see [KIT.md](KIT.md). Deep reference: [reference.md](reference.md).

---

## When to use

- Adding Kenmark Storage uploads to a Next.js / Node app
- Public or private asset hosting for a project
- Signed private downloads after your app authenticates the viewer
- App-side image/video conversion (Sharp / FFmpeg) after upload

## When not to use

| Intent | Use instead |
| --- | --- |
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

## Step 1 — Env

```bash
# Application server only
KENMARK_STORAGE_URL=https://storage-api.example.com
KENMARK_STORAGE_KEY=ks_live_...   # project API key with needed scopes
```

Scopes typically: `assets:write` (uploads), `assets:read` (list/signed URL), `assets:delete` if needed.

---

## Step 2 — Server singleton

```ts
// lib/storage.ts
import { KenmarkStorage } from "@kenmark/storage/server";

export const storage = new KenmarkStorage({
  baseUrl: process.env.KENMARK_STORAGE_URL!,
  apiKey: process.env.KENMARK_STORAGE_KEY!,
});
```

---

## Step 3 — Authenticated upload-session route

```ts
// app/api/assets/upload-session/route.ts
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

Client sends: `filename`, `contentType`, `sizeBytes`, optional `visibility`, `folder`, `metadata`. `processingMode` is accepted and ignored.

---

## Step 4 — Browser upload

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

## Step 5 — Private download redirect

```ts
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

Install in the **consumer app** (not kenmark-storage):

```bash
pnpm add sharp
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

If uploads are proxied only through your app server, browser→API CORS is less critical — prefer the documented browser upload token flow.

---

## MIME / size

- Respect project allowlist (empty allowlist on the platform **denies** all).
- Max object size is capped (platform default 5 GiB; project may be lower).
- Send exact `sizeBytes`; the upload token is bound to that size.

---

## Checklist before merge

- [ ] No API key in client code or `NEXT_PUBLIC_*`
- [ ] Upload-session and signed-URL routes enforce **your** auth
- [ ] Errors from Storage API are not blindly reflected with secrets
- [ ] Private links expire (`expiresIn` sensible, e.g. 60–300s)
- [ ] AbortSignal / progress handled if UX requires it
- [ ] Original uploaded to Storage; conversion (if any) runs in app with Sharp/FFmpeg
- [ ] Default conversion preset documented in app config; per-request overrides validated and bounded
- [ ] Public files use `publicUrl`; private files go through app auth + `signedUrl`
- [ ] Visibility changes use `assets.update`; public→private cache warning understood

---

## Reference

- [KIT.md](KIT.md) — install, invoke, related skills
- [reference.md](reference.md) — trust zones, auth matrix, pipelines, anti-patterns

When the storage monorepo is available:

- `examples/nextjs-app/` — patterns
- `docs/sdk-distribution.md` — publish/consume
- `docs/api.md` — HTTP details

Canonical packages: `@kenmark/storage-contracts`, `@kenmark/storage`.
