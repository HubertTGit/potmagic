---
name: vercel-blob
model: claude-haiku-4-5-20251001
description: Reference agent for Vercel Blob — scalable object storage for images, videos, audio, and large files. Use when uploading, downloading, listing, deleting, or copying blobs; setting up server or client uploads; or working with the @vercel/blob SDK.
---

# Vercel Blob

**Docs:** https://vercel.com/docs/vercel-blob
**SDK Docs:** https://vercel.com/docs/vercel-blob/using-blob-sdk
**Private Storage:** https://vercel.com/docs/vercel-blob/private-storage
**Public Storage:** https://vercel.com/docs/vercel-blob/public-storage

## What it is

Object storage for files — images, videos, audio, documents, large assets. Backed by S3 (11 nines durability, 99.99% availability). Content is served from 20 regional hubs.

### Good use cases
- User-uploaded avatars, screenshots, cover images
- Large media files (video, audio)
- Files that would otherwise go to S3, Cloudinary, etc.
- Build-time or runtime file uploads

### Not a good fit for
- Tiny config data that must be read at ultra-low latency → use Edge Config instead
- Frequently written key-value data → use Upstash Redis

---

## Private vs Public storage

| | Private | Public |
|--|---------|--------|
| Write | Authenticated (`BLOB_READ_WRITE_TOKEN`) | Authenticated |
| Read | Through your Function via `get()` | Direct blob URL — anyone with the link |
| Delivery | Your Function streams the response | CDN direct |
| Best for | Sensitive docs, user content, custom auth | Media, images, videos, public assets |

> ⚠️ You **cannot change** the access mode after creating a store.

---

## Setup

### 1. Create a Blob store
Dashboard → Project → Storage → Create Database → Blob → choose Private or Public.

### 2. Install the SDK
```bash
pnpm i @vercel/blob
```

### 3. Pull environment variables
```bash
vercel env pull
```
This provisions `BLOB_READ_WRITE_TOKEN` in `.env.local`. All SDK methods default to this token automatically.

---

## SDK Methods (Server-side)

All methods are async. Import from `@vercel/blob`.

### `put()` — Upload a blob

```typescript
import { put } from '@vercel/blob';

const blob = await put('avatars/user-123.jpg', fileBody, {
  access: 'public',            // required: 'public' | 'private'
  addRandomSuffix: true,       // recommended — avoids collisions
  contentType: 'image/jpeg',   // auto-detected from extension if omitted
  cacheControlMaxAge: 3600,    // seconds (default: 1 month, min: 60)
  allowOverwrite: false,       // default: false — throws if pathname exists
  multipart: true,             // for files > 100MB
  onUploadProgress: ({ loaded, total, percentage }) => {},
  ifMatch: etag,               // conditional write — throws BlobPreconditionFailedError on mismatch
});

// Returns:
// { pathname, contentType, contentDisposition, url, downloadUrl, etag }
```

### `get()` — Retrieve blob content (private blobs)

```typescript
import { get } from '@vercel/blob';

const blob = await get('https://...blob-url...', {
  access: 'private',   // required
  ifNoneMatch: etag,   // returns { statusCode: 304, stream: null } if unchanged
});
// Returns null if not found, or { stream, contentType, contentLength, etag, ... }
```

### `head()` — Get blob metadata

```typescript
import { head } from '@vercel/blob';

const metadata = await head('https://...blob-url...');
// Returns { pathname, url, downloadUrl, size, uploadedAt, etag, contentType, ... }
// Throws BlobNotFoundError if not found
```

### `del()` — Delete one or multiple blobs

```typescript
import { del } from '@vercel/blob';

await del('https://...blob-url...');              // single
await del(['https://...url1...', 'https://...url2...']);  // batch — free operation

// del() is always void. Does not throw if blob doesn't exist.
// Cache propagation takes up to 60 seconds after delete.
```

### `list()` — List blobs

```typescript
import { list } from '@vercel/blob';

// All blobs
const { blobs, cursor, hasMore } = await list();

// Filtered by folder prefix
const { blobs } = await list({ prefix: 'avatars/' });

// Paginate
let cursor: string | undefined;
do {
  const result = await list({ cursor, limit: 1000 });
  // process result.blobs
  cursor = result.cursor;
} while (result.hasMore);

// Folded mode — returns folder entries + root-level blobs
const { blobs, folders } = await list({ mode: 'folded', prefix: 'uploads/' });
```

`list()` options: `limit` (default 1000), `prefix`, `cursor`, `mode` (`'expanded'` | `'folded'`).

Blobs are returned in **lexicographical order** by pathname, not creation date.

### `copy()` — Copy a blob to a new path

```typescript
import { copy } from '@vercel/blob';

const blob = await copy(
  'https://...source-url...',  // fromUrlOrPathname
  'new/path/file.jpg',         // toPathname
  {
    access: 'public',          // required
    addRandomSuffix: false,    // default false for copy (unlike put)
    allowOverwrite: false,
    cacheControlMaxAge: 3600,
    contentType: 'image/jpeg', // not copied from source — must be set explicitly
    ifMatch: etag,             // conditional copy
  }
);
// Returns same shape as put()
```

---

## Multipart Uploads (files > 100MB)

### Simple — pass `multipart: true` to `put()`

```typescript
const blob = await put('large-video.mp4', videoFile, {
  access: 'public',
  multipart: true,  // auto splits, uploads in parallel, retries failures
});
```

### Manual — full control

```typescript
import { createMultipartUpload, uploadPart, completeMultipartUpload } from '@vercel/blob';

// Phase 1
const { key, uploadId } = await createMultipartUpload('large-file.bin', {
  access: 'public',
});

// Phase 2 — each part must be >= 5MB except the last
const parts = await Promise.all(
  chunks.map((chunk, i) =>
    uploadPart('large-file.bin', chunk, {
      access: 'public',
      key,
      uploadId,
      partNumber: i + 1,
    })
  )
);

// Phase 3
const blob = await completeMultipartUpload('large-file.bin', parts, {
  access: 'public',
  key,
  uploadId,
});
```

---

## Client Uploads (browser → Blob store directly)

For uploading directly from the browser without proxying through your server. Requires a server-side token endpoint.

### Client side

```typescript
import { upload } from '@vercel/blob/client';

const blob = await upload('avatar.jpg', file, {
  access: 'public',
  handleUploadUrl: '/api/avatar/upload',  // your token endpoint
  multipart: true,                         // for large files
  onUploadProgress: ({ percentage }) => setProgress(percentage),
});
```

### Server side — token endpoint

```typescript
import { handleUpload } from '@vercel/blob/client';

export async function POST(request: Request) {
  const body = await request.json();
  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      // Validate the user is allowed to upload this file
      // Return upload constraints
      return {
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
        addRandomSuffix: true,
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      // Blob was uploaded — save blob.url to your database
      await db.user.update({ avatarUrl: blob.url });
    },
  });
  return Response.json(jsonResponse);
}
```

---

## Common Patterns

### Server upload from form (TanStack Start / server function)

```typescript
import { put } from '@vercel/blob';

export const uploadAvatar = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const file = data.get('file') as File;
    const blob = await put(`avatars/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    return blob.url;
  });
```

### Serve a private blob through a route

```typescript
import { get } from '@vercel/blob';

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url')!;
  const blob = await get(url, { access: 'private' });
  if (!blob) return new Response('Not found', { status: 404 });

  return new Response(blob.stream, {
    headers: {
      'Content-Type': blob.contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
```

### Conditional write (optimistic concurrency)

```typescript
import { head, put, BlobPreconditionFailedError } from '@vercel/blob';

const current = await head('config.json');
try {
  await put('config.json', JSON.stringify(newConfig), {
    access: 'private',
    allowOverwrite: true,
    ifMatch: current.etag,
  });
} catch (e) {
  if (e instanceof BlobPreconditionFailedError) {
    // another process updated it — retry or handle conflict
  }
}
```

### Sort blobs by date using pathname timestamps

```typescript
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
await put(`reports/${timestamp}-report.pdf`, file, { access: 'private' });
// lexicographical sort = chronological order
```

---

## Caching

- All blobs cached on CDN for **up to 1 month** by default
- Set `cacheControlMaxAge` in seconds to override (minimum 60s)
- Deletes/updates propagate through CDN cache in **up to 60 seconds**
- **Public blobs**: browser caches directly from CDN URL
- **Private blobs**: browser caching controlled by your Function's `Cache-Control` response header

To bust browser cache after overwrite, append a query param: `?v=<timestamp>`

**Best practice: treat blobs as immutable.** Use `addRandomSuffix: true` or timestamp-based pathnames instead of overwriting.

---

## Limits (Hobby / Pro)

| | Hobby | Pro |
|--|-------|-----|
| Max blob size | 500MB | 5TB |
| Stores per account | Unlimited | Unlimited |

Storage billed as GB-month (15-min snapshot average). Deletes are free. Downloads (outbound) billed as Blob Data Transfer (~3x cheaper than Fast Data Transfer for large assets).

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `BLOB_READ_WRITE_TOKEN` | Default token for all SDK methods — auto-provisioned on Vercel, pulled locally via `vercel env pull` |

Pass a custom token via the `token` option on any method if using multiple stores or deploying outside Vercel.
