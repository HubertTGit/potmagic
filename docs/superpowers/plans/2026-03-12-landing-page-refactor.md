# Landing Page Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default `/` route with a public landing page showing all stories, move login to `/auth`, and add a blank `/show/$storyId` stub.

**Architecture:** The public landing (`src/routes/index.tsx`) lives outside the `_app` pathless layout so it requires no auth. A new `listPublicStories` server function returns only `id/title/status` with no session requirement. The existing `login.tsx` moves to `auth.tsx` with two internal redirect targets updated. All references to `/login` across the codebase are updated to `/auth`.

**Tech Stack:** TanStack Start, TanStack Router, TanStack Query, Drizzle ORM, DaisyUI v5, Tailwind CSS v4

---

## Chunk 1: Data layer and route scaffolding

### Task 1: Add `listPublicStories` server function

**Files:**
- Modify: `src/lib/stories.fns.ts`

- [ ] **Step 1: Add the function** — append to the bottom of `src/lib/stories.fns.ts`:

```ts
export const listPublicStories = createServerFn({ method: 'GET' }).handler(async () => {
  return db
    .select({ id: stories.id, title: stories.title, status: stories.status })
    .from(stories)
    .orderBy(stories.createdAt)
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no type errors in `stories.fns.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/stories.fns.ts
git commit -m "feat: add listPublicStories server function (no auth)"
```

---

### Task 2: Move login page to `/auth`

**Files:**
- Create: `src/routes/auth.tsx`
- Delete: `src/routes/login.tsx`
- Modify: `src/lib/auth-guard.ts` — update redirect target
- Modify: `src/components/sidebar.component.tsx` — update logout redirect
- Modify: `src/middleware/auth.ts` — update /login references to /auth

- [ ] **Step 1: Create `src/routes/auth.tsx`** — copy the full content of `src/routes/login.tsx` and make two changes:

  1. Change route name: `createFileRoute('/login')` → `createFileRoute('/auth')`
  2. Both post-auth navigates: `router.navigate({ to: '/' })` → `router.navigate({ to: '/stories' })` (appears twice — after sign-in and after register)

- [ ] **Step 2: Delete `src/routes/login.tsx`**

```bash
git rm src/routes/login.tsx
```

- [ ] **Step 3: Update auth guard** — in `src/lib/auth-guard.ts` line 8, change:

```ts
// Before
if (!session) throw redirect({ to: '/login' });
// After
if (!session) throw redirect({ to: '/auth' });
```

- [ ] **Step 4: Update sidebar logout** — in `src/components/sidebar.component.tsx` line 49, change:

```ts
// Before
router.navigate({ to: '/login' });
// After
router.navigate({ to: '/auth' });
```

- [ ] **Step 5: Update auth middleware** — in `src/middleware/auth.ts`, replace lines 15–21:

```ts
// Before
if (pathname.startsWith('/stage') && !session) {
  throw new Response(null, { status: 302, headers: { Location: '/login' } })
}

if (pathname === '/login' && session) {
  throw new Response(null, { status: 302, headers: { Location: '/' } })
}

// After
if (pathname.startsWith('/stage') && !session) {
  throw new Response(null, { status: 302, headers: { Location: '/auth' } })
}

if (pathname === '/auth' && session) {
  throw new Response(null, { status: 302, headers: { Location: '/stories' } })
}
```

This updates the unauthenticated `/stage` redirect and replaces the logged-in-on-auth-page guard (previously redirected to `/`, now redirects to `/stories`).

- [ ] **Step 6: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors. The `/login` route no longer exists and all references now point to `/auth`.

- [ ] **Step 7: Commit**

```bash
git add src/routes/auth.tsx src/lib/auth-guard.ts src/components/sidebar.component.tsx src/middleware/auth.ts
git commit -m "feat: move login page to /auth and update all /login references"
```

---

### Task 3: Replace `_app` index with redirect

**Files:**
- Modify: `src/routes/_app/index.tsx`

- [ ] **Step 1: Replace the entire content of `src/routes/_app/index.tsx`** with:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  beforeLoad: () => { throw redirect({ to: '/stories' }) },
})
```

This removes the stories grid that was previously the authenticated home. Authenticated users hitting `/` will now be redirected to `/stories`.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/_app/index.tsx
git commit -m "feat: redirect authenticated / to /stories"
```

---

### Task 4: Create blank `/show/$storyId` stub

**Files:**
- Create: `src/routes/show/$storyId.tsx` (requires creating `src/routes/show/` directory)

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/routes/show
```

Create `src/routes/show/$storyId.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/show/$storyId')({
  component: ShowPage,
})

function ShowPage() {
  return null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors; `/show/$storyId` route registered.

- [ ] **Step 3: Commit**

```bash
git add src/routes/show/$storyId.tsx
git commit -m "feat: add blank /show/\$storyId route stub"
```

---

## Chunk 2: Public landing page

### Task 5: Build the public landing page

**Files:**
- Create: `src/routes/index.tsx`

- [ ] **Step 1: Create `src/routes/index.tsx`** with the full landing page:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { listPublicStories } from '@/lib/stories.fns'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

type StoryStatus = 'draft' | 'active' | 'ended'

const STATUS_BADGE: Record<StoryStatus, string> = {
  draft: 'badge-warning',
  active: 'badge-success',
  ended: 'badge-neutral',
}

const STATUS_LABEL: Record<StoryStatus, string> = {
  draft: 'Draft',
  active: 'Live',
  ended: 'Ended',
}

function LandingPage() {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['public-stories'],
    queryFn: () => listPublicStories(),
  })

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5">
        <span className="font-display italic font-semibold text-2xl text-gold gold-glow tracking-[-0.01em]">
          potmagic
        </span>
        <Link to="/auth" className="btn btn-sm btn-outline">
          Sign In
        </Link>
      </div>

      {/* Stories grid */}
      <div className="px-8 pb-12">
        {isLoading ? (
          <div className="flex items-center gap-2 text-base-content/40 text-sm mt-16 justify-center">
            <span className="loading loading-spinner loading-xs" />
            Loading…
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 text-base-content/30">
            <svg
              className="size-12 mx-auto mb-3 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <p className="text-sm">No stories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stories.map((story) => {
              const status = story.status as StoryStatus
              return (
                <div
                  key={story.id}
                  className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="card-body gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="card-title font-display text-base leading-snug line-clamp-2">
                        {story.title}
                      </h2>
                      <span
                        className={cn(
                          'badge badge-sm font-semibold uppercase tracking-wider shrink-0',
                          STATUS_BADGE[status],
                        )}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>

                    {status === 'active' && (
                      <div className="card-actions mt-auto pt-1">
                        <Link
                          to="/show/$storyId"
                          params={{ storyId: story.id }}
                          className="btn btn-sm btn-gold w-full font-display tracking-wide"
                        >
                          View Show
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors; `/` route is now the public landing.

- [ ] **Step 3: Smoke test in browser**

```bash
pnpm dev
```

Verify:
- `http://localhost:3000/` shows the landing page with brand + "Sign In" button (no sidebar)
- "Sign In" navigates to `/auth`
- Stories grid loads and renders title + status badge per card
- Active stories show "View Show" button; clicking navigates to `/show/<id>` (blank page)
- `http://localhost:3000/auth` shows the login/register/forgot-password forms
- Logging in redirects to `/stories`, not `/`
- Logging out redirects to `/auth`
- Visiting `/` while authenticated still shows the public landing (no forced redirect)

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: add public landing page at / with stories grid"
```
