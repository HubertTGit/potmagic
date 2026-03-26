---
name: tanstack-query-best-practices
description: Use when fetching, caching, or synchronizing server state with @tanstack/react-query — covers QueryClient setup, useQuery, query keys, queryOptions, caching lifecycle, parallel queries, render optimizations, network mode, and SSR/hydration patterns.
---

# TanStack Query Best Practices

Apply these patterns when using `@tanstack/react-query` (v5). Install with `pnpm add @tanstack/react-query`.

---

## 1. Setup

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 minute — tune per app
      retry: 2,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  )
}
```

---

## 2. Important Defaults (know these)

| Default | Value | Meaning |
|---|---|---|
| `staleTime` | `0` | Data is immediately stale after fetching — refetches on every mount/focus |
| `gcTime` | `5 min` | Unused cache entries are garbage-collected after 5 minutes |
| `retry` | `3` | Failed queries retry 3 times with exponential backoff |
| `refetchOnWindowFocus` | `true` | Refetches when the browser tab regains focus |
| `refetchOnReconnect` | `true` | Refetches when network connection is restored |
| `networkMode` | `'online'` | Queries pause when offline; resume when reconnected |

> **Gotcha:** `staleTime: 0` means every `useQuery` mount triggers a background refetch if data exists in cache. Set a higher `staleTime` for stable data.

---

## 3. useQuery

```tsx
import { useQuery } from '@tanstack/react-query'

function UserProfile({ userId }: { userId: string }) {
  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  })

  if (isPending) return <span className="loading loading-spinner" />
  if (isError) return <em>Error: {error.message}</em>

  return <div>{data.name}</div>
}
```

### Key status properties

| Property | Description |
|---|---|
| `isPending` | No data yet (first load) |
| `isFetching` | Any fetch in-flight (including background) |
| `isSuccess` | Data available |
| `isError` | Fetch failed (after retries) |
| `isStale` | Cached data is stale |
| `fetchStatus` | `'fetching'` \| `'paused'` \| `'idle'` |

> Use `isFetching` (not `isPending`) to show background refresh indicators.

---

## 4. Query Keys

Query keys uniquely identify cached data. They must be **arrays** in v5.

```tsx
// Simple key
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// Key with params — refetches automatically when userId changes
useQuery({ queryKey: ['users', userId], queryFn: () => fetchUser(userId) })

// Hierarchical / filter key
useQuery({ queryKey: ['users', userId, 'posts', { status: 'active' }], queryFn: ... })

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: ['users'] })

// Invalidate a specific user
queryClient.invalidateQueries({ queryKey: ['users', userId] })
```

### Rules

1. **All query function variables go in the key** — treat it like a `useEffect` dependency array
2. **Use a consistent factory pattern** to avoid typos:

```tsx
// keys.ts — centralize query key factories
export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
  posts: (id: string) => ['users', id, 'posts'] as const,
}

useQuery({ queryKey: userKeys.detail(userId), queryFn: () => fetchUser(userId) })
queryClient.invalidateQueries({ queryKey: userKeys.all })
```

---

## 5. Query Functions

The `queryFn` must:
- Return a resolved value (data)
- **Throw an error** on failure (TanStack Query tracks errors via throws)

```tsx
// Fetch API — always throw on non-2xx
const queryFn = async ({ signal }: { signal: AbortSignal }) => {
  const res = await fetch(`/api/users/${userId}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Axios handles this automatically — errors are thrown by default
const queryFn = () => axios.get(`/api/users/${userId}`).then(r => r.data)
```

> The `signal` parameter enables automatic request cancellation when a query is unmounted or superseded.

---

## 6. queryOptions Helper

Use `queryOptions()` to define reusable, type-safe query config shared between hooks, prefetchers, and the query client.

```tsx
// src/lib/queries/user.queries.ts
import { queryOptions } from '@tanstack/react-query'

export function userQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,
  })
}

// In a component
const { data } = useQuery(userQueryOptions(userId))

// In a route loader (TanStack Start / Router)
await queryClient.prefetchQuery(userQueryOptions(userId))

// Set data manually
queryClient.setQueryData(userQueryOptions(userId).queryKey, updatedUser)
```

---

## 7. Caching Lifecycle

```
mount with no cache → isPending=true → fetches → data cached, stale immediately (staleTime=0)
                                                         ↓
mount again (same key) → returns cached data instantly + refetches in background (isFetching=true)
                                                         ↓
all subscribers unmount → gcTime timer starts (5 min default)
                                                         ↓
gcTime expires → cache entry deleted
```

### staleTime vs gcTime

| Config | Controls |
|---|---|
| `staleTime` | How long until cached data is considered stale (triggers background refetch) |
| `gcTime` | How long unused cache entries live before deletion |

```tsx
// Stable reference data — rarely changes
useQuery({ queryKey: ['config'], queryFn: fetchConfig, staleTime: Infinity })

// User data — refresh every 5 minutes
useQuery({ queryKey: ['me'], queryFn: fetchMe, staleTime: 5 * 60 * 1000 })

// Real-time feed — always fresh
useQuery({ queryKey: ['feed'], queryFn: fetchFeed, staleTime: 0 })
```

---

## 8. Network Mode

| Mode | Behavior | Use when |
|---|---|---|
| `'online'` (default) | Queries pause when offline, resume on reconnect | REST APIs, standard web apps |
| `'always'` | Queries always fire, ignores network state | AsyncStorage, local functions, non-HTTP data |
| `'offlineFirst'` | Tries once regardless of network, then pauses if it fails | Service worker caching, PWAs |

```tsx
// Set globally
new QueryClient({ defaultOptions: { queries: { networkMode: 'always' } } })

// Or per query
useQuery({ queryKey: ['local'], queryFn: readFromStorage, networkMode: 'always' })
```

---

## 9. Parallel Queries

```tsx
// Static — just call useQuery multiple times
const postsQuery = useQuery({ queryKey: ['posts'], queryFn: fetchPosts })
const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: fetchTags })

// Dynamic count — use useQueries
import { useQueries } from '@tanstack/react-query'

function UserList({ userIds }: { userIds: string[] }) {
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['users', id],
      queryFn: () => fetchUser(id),
    })),
  })

  const isLoading = userQueries.some((q) => q.isPending)
  const users = userQueries.map((q) => q.data).filter(Boolean)
}
```

---

## 10. Render Optimizations

TanStack Query re-renders only when subscribed properties change. Tune further with:

### `select` — transform / narrow data

```tsx
// Only re-renders when the count changes, not on any todo update
const { data: count } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => data.filter((t) => !t.done).length,
})
```

### `notifyOnChangeProps` — track specific props

```tsx
// Only re-renders when `data` changes, not `isFetching`
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  notifyOnChangeProps: ['data'],
})
```

### Structural sharing (default on)

TanStack Query performs deep equality checks on returned data and preserves object references that haven't changed. This prevents unnecessary re-renders downstream. Don't disable unless you have a specific reason.

---

## 11. SSR & Hydration (TanStack Start / Next.js)

### Pattern: prefetch on server → dehydrate → hydrate on client

```tsx
// In a server function / route loader
import { dehydrate, QueryClient } from '@tanstack/react-query'
import { userQueryOptions } from '@/lib/queries/user.queries'

export async function loader({ params }) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(userQueryOptions(params.userId))
  return { dehydratedState: dehydrate(queryClient) }
}

// In the page component
import { HydrationBoundary } from '@tanstack/react-query'

export default function UserPage({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <UserProfile />  {/* useQuery here gets data immediately, no waterfall */}
    </HydrationBoundary>
  )
}
```

### SSR rules

- Create a **new `QueryClient` per request** — never share one across requests (state leaks)
- Use `prefetchQuery` (not `fetchQuery`) in loaders — it swallows errors gracefully
- `dehydrate` serializes the cache; `HydrationBoundary` rehydrates it on the client
- Data prefetched server-side must have `staleTime > 0` or it will immediately refetch on client mount

```tsx
// TanStack Start — set staleTime on the server QueryClient to match the client
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
})
```

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| String query keys (`queryKey: 'todos'`) | Always use arrays: `queryKey: ['todos']` |
| Not including all deps in query key | Treat query key like `useEffect` deps — missing vars = stale data |
| Checking `isPending` for background refresh UI | Use `isFetching` for spinners/loading indicators on cached-but-refetching data |
| Not throwing errors in `queryFn` | `fetch` doesn't throw on 4xx/5xx — check `res.ok` and throw manually |
| Sharing one `QueryClient` instance across SSR requests | Create a new `QueryClient` per request to prevent state leaks |
| Low `staleTime` with `refetchOnWindowFocus: true` | Results in excessive requests — set `staleTime` appropriately for your data |
