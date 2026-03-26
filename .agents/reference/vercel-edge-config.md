---
name: vercel-edge-config
model: haiku
description: Reference agent for Vercel Edge Config — global ultra-low-latency key-value store for feature flags, A/B testing, redirects, and runtime config. Use when reading or writing Edge Config data, setting up the SDK, or managing items via the REST API.
---

# Vercel Edge Config

**Docs:** https://vercel.com/docs/edge-config
**SDK Docs:** https://vercel.com/docs/edge-config/edge-config-sdk
**REST API:** https://vercel.com/docs/edge-config/vercel-api

## What it is

A global data store optimised for **frequent reads, infrequent writes**. Reads complete at negligible latency — P99 ≤ 15ms, often < 1ms — by serving data from the region closest to the user without hitting an upstream server.

Works in **Edge Runtime, Node.js runtime, and the browser**.

### Good use cases

- Feature flags / A/B test configuration
- IP allow/block lists
- Critical redirects
- Dynamic routing rules
- Config that must change without a redeploy

### Not a good fit for

- Data written frequently → use Upstash Redis instead
- Large binary assets → use Vercel Blob

---

## Setup

### 1. Install the SDK

```bash
pnpm i @vercel/edge-config
```

### 2. Create an Edge Config

Via [Dashboard](https://vercel.com/docs/edge-config/edge-config-dashboard) or [REST API](https://vercel.com/docs/edge-config/vercel-api#create-an-edge-config).

### 3. Connection string

Pull the `EDGE_CONFIG` environment variable (connection string) into your project:

```bash
vercel env pull
```

The connection string format: `https://edge-config.vercel.com/<id>?token=<read-token>`

---

## SDK Methods

All methods are async and throw on invalid token, missing Edge Config, or network error.

### Default client (uses `EDGE_CONFIG` env var)

```typescript
import { get, getAll, has, digest } from '@vercel/edge-config';

// Read a single value
const value = await get('my-key'); // → value | undefined

// Read all items
const all = await getAll(); // → Record<string, unknown>

// Read specific keys only
const some = await getAll(['keyA', 'keyB']); // → { keyA: ..., keyB: ... }

// Check if a key exists
const exists = await has('my-key'); // → boolean

// Get the config version hash (changes when config updates)
const version = await digest(); // → string
```

### Multiple Edge Configs (`createClient`)

```typescript
import { createClient } from '@vercel/edge-config';

const flagsConfig = createClient(process.env.FLAGS_EDGE_CONFIG);
const redirectsConfig = createClient(process.env.REDIRECTS_EDGE_CONFIG);

const isEnabled = await flagsConfig.get('new-checkout');
const allRedirects = await redirectsConfig.getAll();
```

---

## Writing Items

**The SDK is read-only.** Writes go through the Vercel REST API using a Vercel Access Token (not the read token).

### Update items via REST API

```typescript
await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      { operation: 'upsert', key: 'my-flag', value: true },
      { operation: 'delete', key: 'old-key' },
    ],
  }),
});
```

Operations: `upsert` (create or update), `delete`.

---

## Common Patterns

### Feature flag in Middleware

```typescript
// middleware.ts
import { get } from '@vercel/edge-config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const isEnabled = await get<boolean>('new-feature');
  if (!isEnabled) {
    return NextResponse.redirect(new URL('/coming-soon', request.url));
  }
  return NextResponse.next();
}
```

### Typed access

```typescript
import { get } from '@vercel/edge-config';

type MaintenanceConfig = { enabled: boolean; message: string };

const config = await get<MaintenanceConfig>('maintenance');
if (config?.enabled) {
  // config.message is typed
}
```

### Cache digest to avoid redundant reads

```typescript
import { digest, getAll } from '@vercel/edge-config';

let cachedDigest: string | null = null;
let cachedData: Record<string, unknown> = {};

async function getConfig() {
  const current = await digest();
  if (current !== cachedDigest) {
    cachedData = await getAll();
    cachedDigest = current;
  }
  return cachedData;
}
```

---

## Limits

| Plan       | Edge Configs | Items per Config | Item size | Total size |
| ---------- | ------------ | ---------------- | --------- | ---------- |
| Hobby      | 1            | 500              | 64 KB     | 512 KB     |
| Pro        | 10           | 10,000           | 64 KB     | 10 MB      |
| Enterprise | Custom       | Custom           | 64 KB     | Custom     |

Full limits: https://vercel.com/docs/edge-config/edge-config-limits

---

## Environment Variables

| Variable        | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| `EDGE_CONFIG`   | Default connection string read by the SDK                          |
| Any custom name | Pass to `createClient(process.env.MY_CONFIG)` for multiple configs |

The connection string is auto-provisioned by `vercel env pull` when you link a project to an Edge Config from the Dashboard.
