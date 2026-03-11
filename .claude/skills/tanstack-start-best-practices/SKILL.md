---
name: tanstack-start-best-practices
description: Use when building features in TanStack Start — covers execution model, server functions, server routes, middleware, routing, import protection, SEO, and deployment patterns.
---

# TanStack Start Best Practices

Apply these patterns when writing any TanStack Start code. This skill synthesizes the core rules across the framework.

---

## 1. Execution Model

**Isomorphic by default** — all code runs on both server and client unless explicitly constrained.

### Control APIs

| API | Runs on | Use when |
|-----|---------|----------|
| `createServerFn` | Server only | Data fetching, mutations, DB access |
| `createServerOnlyFn` | Server only | Utilities that must never reach client |
| `createClientOnlyFn` | Client only | Browser APIs, DOM, `window` access |
| `createIsomorphicFn` | Both | Different logic per environment |
| `<ClientOnly>` | Client only | Components using browser-only APIs |

```ts
// Divergent behavior per environment
const getUser = createIsomorphicFn()
  .client(() => clientStore.getUser())
  .server(() => db.query.users.findFirst())
```

### Anti-patterns
```ts
// NEVER do this — unreliable and bypasses tree-shaking
if (typeof window === 'undefined') { /* server logic */ }

// NEVER expose secrets via process.env in isomorphic code
const secret = process.env.SECRET_KEY // leaks to client bundle
```

---

## 2. Server Functions

Use `createServerFn` for all server-only logic callable from components, loaders, or other functions.

```ts
// src/features/user.server.ts
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

export const getUser = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return db.query.users.findFirst({ where: eq(users.id, data.id) })
  })

export const createPost = createServerFn({ method: 'POST' })
  .validator(z.object({ title: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    // Access request context
    const req = getRequest()
    const auth = getRequestHeader('authorization')
    setResponseHeader('x-custom', 'value')

    return db.insert(posts).values({ title: data.title })
  })
```

### Rules
- Name server function files `.server.ts` or `.functions.ts`
- Always validate input with `.validator()` — use Zod schemas
- Use `redirect()` and `notFound()` for navigation from handlers
- Never return raw Error objects — throw them instead

```ts
import { redirect, notFound } from '@tanstack/react-router'

.handler(async ({ data }) => {
  const user = await getUser(data.id)
  if (!user) throw notFound()
  if (!user.isAdmin) throw redirect({ to: '/login' })
  return user
})
```

---

## 3. Server Routes

Use for raw HTTP endpoints: webhooks, OAuth callbacks, file downloads, REST APIs consumed externally.

```ts
// src/routes/api/webhook.ts  (file convention: api.*.ts)
import { createAPIFileRoute } from '@tanstack/start/api'

export const APIRoute = createAPIFileRoute('/api/webhook')({
  POST: async ({ request }) => {
    const payload = await request.json()
    await processWebhook(payload)
    return new Response('OK', { status: 200 })
  },
  GET: async ({ request, params }) => {
    return Response.json({ status: 'healthy' })
  },
})
```

### When to use server routes vs server functions
- **Server functions** — called from React components/loaders; type-safe RPC
- **Server routes** — external HTTP clients, file uploads, webhooks, OAuth

---

## 4. Middleware

Composable middleware for server functions and server routes.

```ts
// src/middleware/auth.ts
import { createMiddleware } from '@tanstack/start'

export const authMiddleware = createMiddleware()
  .server(async ({ next, context }) => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return next({ context: { user: session.user } })
  })

// Apply to server function
export const getProfile = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context.user // typed from middleware
  })
```

### Context flow
```ts
// Pass data from client → server
const fn = createServerFn()
  .middleware([
    createMiddleware()
      .client(async ({ next }) => next({ sendContext: { requestId: crypto.randomUUID() } }))
      .server(async ({ next, context }) => {
        console.log(context.requestId) // available on server
        return next({ context: { db } })
      })
  ])
```

### Global middleware
Register in `src/start.ts` — applies to all server functions:
```ts
// src/start.ts
import { createStartHandler, defaultStreamHandler } from '@tanstack/start/server'
export default createStartHandler({ middleware: [loggingMiddleware] })(defaultStreamHandler)
```

---

## 5. Routing

File-based routing via TanStack Router in `src/routes/`.

```
src/routes/
  __root.tsx          # Root layout
  index.tsx           # /
  posts/
    index.tsx         # /posts
    $postId.tsx       # /posts/:postId
  api/
    health.ts         # /api/health (server route)
```

### Data loading and auth guards

```ts
// src/routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
  },
  loader: async () => {
    return getDashboardData() // calls a server function
  },
  component: DashboardPage,
})
```

### Rules
- Use `loader` for data fetching — not `useEffect`
- Use `beforeLoad` for auth guards and redirects
- Prefer server functions in loaders over direct DB calls

---

## 6. Import Protection

TanStack Start's Vite plugin prevents server code from leaking to client bundles (enabled by default).

```ts
// src/lib/db.server.ts — add marker at top
import 'server-only'

// src/hooks/use-browser-api.ts — add marker at top
import 'client-only'
```

### Rules
- Never import `.server.ts` files directly in components — call server functions instead
- If you see a build error about server imports in client code, trace the import chain
- Use `'server-only'` on any file with DB connections, secrets, or Node.js APIs

---

## 7. Environment Functions

For utilities that need different implementations per environment without `createServerFn`:

```ts
import { createIsomorphicFn, createServerOnlyFn, createClientOnlyFn } from '@tanstack/start'

// Logs to server console or browser console
const log = createIsomorphicFn()
  .server((msg: string) => serverLogger.info(msg))
  .client((msg: string) => console.log('[client]', msg))

// Throws at runtime if called on wrong environment
const getSecret = createServerOnlyFn().fn(() => process.env.SECRET)
const getDeviceId = createClientOnlyFn().fn(() => localStorage.getItem('deviceId'))
```

---

## 8. SEO

```tsx
// src/routes/blog/$slug.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Meta } from '@tanstack/start'

export const Route = createFileRoute('/blog/$slug')({
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: 'description', content: loaderData.post.excerpt },
      { property: 'og:title', content: loaderData.post.title },
      { property: 'og:image', content: loaderData.post.coverImage },
    ],
    links: [
      { rel: 'canonical', href: `https://example.com/blog/${loaderData.post.slug}` },
    ],
  }),
  component: BlogPost,
})
```

### JSON-LD structured data
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
  })}}
/>
```

### Rules
- SSR is on by default — key content is crawlable without extra config
- Set canonical URLs on all indexable pages
- Use route `head` export, not Helmet or document.title

---

## 9. Databases

```ts
// src/db/queries.server.ts
import 'server-only'
import { db } from './client'

// Only ever call from server functions or server routes
export const getUserById = createServerFn({ method: 'GET' })
  .validator(z.string())
  .handler(async ({ data: id }) => {
    return db.query.users.findFirst({ where: eq(users.id, id) })
  })
```

### Rules
- All DB access inside server functions or server routes — never in components
- Mark DB files with `import 'server-only'`
- Use environment variables only on the server (`process.env` in server functions only)

---

## 10. Hosting & Deployment

Configure the target preset in `app.config.ts`:

```ts
// app.config.ts
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    preset: 'vercel',       // or 'cloudflare-workers', 'netlify', 'node-server', 'bun'
  },
})
```

### Common presets
| Preset | Use for |
|--------|---------|
| `node-server` | VPS, Railway, Docker |
| `vercel` | Vercel Edge/Serverless |
| `cloudflare-workers` | Cloudflare Workers |
| `netlify` | Netlify Functions |
| `bun` | Bun runtime |

### Custom server entry (optional)
```ts
// src/server.ts — only needed for custom behavior
import { createStartHandler, defaultStreamHandler } from '@tanstack/start/server'
import { getRouterManifest } from '@tanstack/start/router-manifest'

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler)
```

---

## Quick Reference: Common Mistakes

| Mistake | Fix |
|---------|-----|
| `typeof window` to detect environment | Use `createServerOnlyFn` / `createClientOnlyFn` |
| Calling DB in component body | Move to `createServerFn` + call in `loader` |
| `process.env.SECRET` in isomorphic code | Only access in `.server.ts` files |
| Importing `.server.ts` in components | Call the exported server function instead |
| `useEffect` for initial data fetch | Use route `loader` |
| No input validation on server functions | Always add `.validator(zodSchema)` |
| Setting `document.title` directly | Use route `head` export |
