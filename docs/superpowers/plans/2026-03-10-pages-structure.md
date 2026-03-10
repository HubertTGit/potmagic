# Pages Structure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add profile, stories list, story detail, and scene detail pages with mock data and a persistent left sidebar layout — UI only, no database connections.

**Architecture:** Refactor root layout to a bare HTML shell; introduce a TanStack Router pathless layout route `_app.tsx` providing the sidebar for all authenticated app pages. Login, stage, and broadcast routes stay outside `_app` and render full-screen. All new pages use hardcoded mock data shaped to match Drizzle schema types.

**Tech Stack:** React 19, TypeScript, TanStack Start (file-based routing), Tailwind v4, DaisyUI v5, `cn()` helper, `authClient.useSession()`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/routes/__root.tsx` | Strip header from `RootLayout`; keep only HTML shell + `<Outlet />` |
| Create | `src/components/sidebar.component.tsx` | Persistent left sidebar with nav links, theme toggle, logout |
| Create | `src/routes/_app.tsx` | Pathless layout route — sidebar + `<Outlet />` for all app pages |
| Create | `src/routes/_app/index.tsx` | Dashboard (replaces `src/routes/index.tsx`) |
| Delete | `src/routes/index.tsx` | Moved to `_app/index.tsx` |
| Create | `src/lib/mock-data.ts` | Typed mock data for all pages |
| Create | `src/components/status-badge.component.tsx` | Story status badge |
| Create | `src/routes/_app/profile.tsx` | Profile page |
| Create | `src/routes/_app/stories/index.tsx` | Stories list page |
| Create | `src/routes/_app/stories/$storyId/index.tsx` | Story detail page (tabs) |
| Create | `src/routes/_app/stories/$storyId/scenes/$sceneId.tsx` | Scene detail page |

---

> **Note on PropTypeBadge:** The spec mentions a `PropTypeBadge` component. The plan intentionally omits it — the scene detail page uses inline button styling for prop type grouping (backgrounds and characters are in separate sections, not labeled with a badge). This is equivalent in function and simpler.

> **Note on scene-to-prop assignments in mock data:** `sceneProps` in the scene detail page intentionally starts empty. The schema does not include a `scene_props` join table (props live at the story level, not scene level). The scene detail UI lets you assign story-level props to a scene; mock data does not pre-populate this assignment.

---

## Chunk 1: Layout Refactor

### Task 1: Strip header from `__root.tsx`

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Open `src/routes/__root.tsx`** and remove all header/nav markup from `RootLayout`. Replace the body with just `<Outlet />`. Keep `RootDocument` and `useTheme` import intact.

Replace the `RootLayout` function with:

```tsx
function RootLayout() {
  return <Outlet />
}
```

Remove unused imports: `Link`, `SunIcon`, `MoonIcon`, `FilmIcon`, `LockClosedIcon`, `ArrowRightEndOnRectangleIcon`, `authClient` (if no longer used in root).

- [ ] **Step 2: Verify build compiles**

```bash
pnpm build
```

Expected: TypeScript compiles without errors (route tree may warn about missing index route — that's OK, fixed in Task 3).

- [ ] **Step 3: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "refactor: strip header from root layout"
```

---

### Task 2: Create sidebar component

**Files:**
- Create: `src/components/sidebar.component.tsx`

- [ ] **Step 1: Create `src/components/sidebar.component.tsx`**

```tsx
import { Link, useRouter } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { useTheme } from '../hooks/useTheme'
import { cn } from '../lib/cn'
import {
  BookOpenIcon,
  FilmIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowRightEndOnRectangleIcon,
} from '@heroicons/react/24/outline'

export function Sidebar() {
  const { data: session } = authClient.useSession()
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const isDirector = session?.user?.role === 'director'

  const handleLogout = async () => {
    await authClient.signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <aside className="w-52 shrink-0 flex flex-col bg-base-200 border-r border-base-300 min-h-screen">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-base-300">
        {/* Stylistic truncation matching the login page brand — intentional */}
        <span className="font-display italic font-semibold text-gold text-lg leading-none">
          potmagic
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        <SidebarLink to="/stories" icon={<BookOpenIcon className="size-4" />}>
          Stories
        </SidebarLink>
        {/* /stage is a flat route (no storyId param at this point in the codebase) */}
        <SidebarLink to="/stage" icon={<FilmIcon className="size-4" />}>
          Stage
        </SidebarLink>
        {isDirector && (
          <SidebarLink to="/director" icon={<Cog6ToothIcon className="size-4" />}>
            Director
          </SidebarLink>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-base-300 flex flex-col gap-1">
        <SidebarLink to="/profile" icon={<UserCircleIcon className="size-4" />}>
          Profile
        </SidebarLink>
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-base-content hover:bg-base-300 transition-colors w-full text-left"
        >
          {theme === 'dark' ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {session && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-error hover:bg-base-300 transition-colors w-full text-left"
          >
            <ArrowRightEndOnRectangleIcon className="size-4" />
            Logout
          </button>
        )}
      </div>
    </aside>
  )
}

function SidebarLink({
  to,
  icon,
  children,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60',
        'hover:text-base-content hover:bg-base-300 transition-colors',
        '[&.active]:text-base-content [&.active]:bg-base-300 [&.active]:border-l-2 [&.active]:border-gold [&.active]:pl-[10px]',
      )}
    >
      {icon}
      {children}
    </Link>
  )
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
pnpm build
```

Expected: no errors in `sidebar.component.tsx`.

---

### Task 3: Create `_app.tsx` pathless layout route and move index

**Files:**
- Create: `src/routes/_app.tsx`
- Create: `src/routes/_app/index.tsx`
- Delete: `src/routes/index.tsx`

- [ ] **Step 1: Create `src/routes/_app.tsx`**

This layout route adds an auth guard so unauthenticated users are redirected to `/login`. All routes under `_app/` inherit this guard.

```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '../lib/auth'
import { Sidebar } from '../components/sidebar.component'

const requireAuth = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw redirect({ to: '/login' })
})

export const Route = createFileRoute('/_app')({
  beforeLoad: () => requireAuth(),
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/routes/_app/index.tsx`** (replaces `src/routes/index.tsx`)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '../../lib/auth-client'

export const Route = createFileRoute('/_app/')({
  component: IndexPage,
})

function IndexPage() {
  const { data: session } = authClient.useSession()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
      <p className="text-base-content/60 text-sm">
        {session?.user?.email ?? 'Loading...'}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Delete `src/routes/index.tsx`**

```bash
rm src/routes/index.tsx
```

- [ ] **Step 4: Run dev server and verify sidebar appears at `/`**

```bash
pnpm dev
```

Navigate to `http://localhost:3000` — if authenticated, sidebar should appear on the left with index content on the right. If unauthenticated, expect redirect to `/login`. Login page at `/login` should be full-screen with no sidebar.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_app.tsx src/routes/_app/index.tsx src/components/sidebar.component.tsx
git rm src/routes/index.tsx
git commit -m "feat: add sidebar layout with pathless _app route"
```

---

## Chunk 2: Mock Data + Shared Components

### Task 4: Create mock data

**Files:**
- Create: `src/lib/mock-data.ts`

- [ ] **Step 1: Create `src/lib/mock-data.ts`**

```ts
// Typed mock data matching Drizzle schema shapes (UI-only, no DB)

export type StoryStatus = 'draft' | 'active' | 'ended'
export type PropType = 'background' | 'character'
export type UserRole = 'actor' | 'director'

export interface MockUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface MockProp {
  id: string
  storyId: string
  name: string
  type: PropType
  imageUrl: string | null
}

export interface MockCast {
  id: string
  storyId: string
  userId: string
  propId: string
  name: string
  imageUrl: string | null
  user: MockUser
  prop: MockProp
}

export interface MockScene {
  id: string
  storyId: string
  title: string
  order: number
}

export interface MockStory {
  id: string
  title: string
  directorId: string
  status: StoryStatus
  scenes: MockScene[]
  cast: MockCast[]
  props: MockProp[]
}

export const MOCK_USERS: MockUser[] = [
  { id: 'u1', name: 'Hubert', email: 'hubert@example.com', role: 'director' },
  { id: 'u2', name: 'Anna', email: 'anna@example.com', role: 'actor' },
  { id: 'u3', name: 'Marco', email: 'marco@example.com', role: 'actor' },
]

export const MOCK_STORIES: MockStory[] = [
  {
    id: 's1',
    title: 'The Haunted Ballroom',
    directorId: 'u1',
    status: 'active',
    props: [
      { id: 'p1', storyId: 's1', name: 'Castle Hall', type: 'background', imageUrl: null },
      { id: 'p2', storyId: 's1', name: 'Bear', type: 'character', imageUrl: null },
      { id: 'p3', storyId: 's1', name: 'Croc', type: 'character', imageUrl: null },
    ],
    cast: [
      {
        id: 'c1', storyId: 's1', userId: 'u2', propId: 'p2', name: 'Anna as Bear', imageUrl: null,
        user: { id: 'u2', name: 'Anna', email: 'anna@example.com', role: 'actor' },
        prop: { id: 'p2', storyId: 's1', name: 'Bear', type: 'character', imageUrl: null },
      },
      {
        id: 'c2', storyId: 's1', userId: 'u3', propId: 'p3', name: 'Marco as Croc', imageUrl: null,
        user: { id: 'u3', name: 'Marco', email: 'marco@example.com', role: 'actor' },
        prop: { id: 'p3', storyId: 's1', name: 'Croc', type: 'character', imageUrl: null },
      },
    ],
    scenes: [
      { id: 'sc1', storyId: 's1', title: 'Opening Night', order: 1 },
      { id: 'sc2', storyId: 's1', title: 'The Twist', order: 2 },
      { id: 'sc3', storyId: 's1', title: 'Finale', order: 3 },
    ],
  },
  {
    id: 's2',
    title: 'Mystery at Sea',
    directorId: 'u1',
    status: 'draft',
    props: [
      { id: 'p4', storyId: 's2', name: 'Ocean Deck', type: 'background', imageUrl: null },
      { id: 'p5', storyId: 's2', name: 'Captain', type: 'character', imageUrl: null },
    ],
    cast: [
      {
        id: 'c3', storyId: 's2', userId: 'u2', propId: 'p5', name: 'Anna as Captain', imageUrl: null,
        user: { id: 'u2', name: 'Anna', email: 'anna@example.com', role: 'actor' },
        prop: { id: 'p5', storyId: 's2', name: 'Captain', type: 'character', imageUrl: null },
      },
    ],
    scenes: [
      { id: 'sc4', storyId: 's2', title: 'Departure', order: 1 },
    ],
  },
  {
    id: 's3',
    title: 'Forest Dreams',
    directorId: 'u1',
    status: 'ended',
    props: [],
    cast: [],
    scenes: [],
  },
]

export function getStory(id: string): MockStory | undefined {
  return MOCK_STORIES.find((s) => s.id === id)
}

export function getScene(storyId: string, sceneId: string) {
  return MOCK_STORIES.find((s) => s.id === storyId)?.scenes.find((sc) => sc.id === sceneId)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "feat: add typed mock data for UI pages"
```

---

### Task 5: Create StatusBadge component

**Files:**
- Create: `src/components/status-badge.component.tsx`

- [ ] **Step 1: Create `src/components/status-badge.component.tsx`**

```tsx
import { cn } from '../lib/cn'
import type { StoryStatus } from '../lib/mock-data'

const STATUS_STYLES: Record<StoryStatus, string> = {
  draft: 'badge-warning',
  active: 'badge-success',
  ended: 'badge-neutral',
}

export function StatusBadge({ status }: { status: StoryStatus }) {
  return (
    <span className={cn('badge badge-sm font-semibold uppercase tracking-wider', STATUS_STYLES[status])}>
      {status}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/status-badge.component.tsx
git commit -m "feat: add StatusBadge component"
```

---

## Chunk 3: Profile Page

### Task 6: Profile page

**Files:**
- Create: `src/routes/_app/profile.tsx`

- [ ] **Step 1: Create `src/routes/_app/profile.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../../lib/auth-client'
import { cn } from '../../lib/cn'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session } = authClient.useSession()
  const user = session?.user
  const [name, setName] = useState(user?.name ?? '')
  const isDirty = name !== (user?.name ?? '')

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="size-16 rounded-full bg-base-300 flex items-center justify-center text-2xl font-semibold text-base-content/60 select-none">
          {(user?.name ?? user?.email ?? '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{user?.name ?? '—'}</p>
          <p className="text-sm text-base-content/50">{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <fieldset className="fieldset gap-1">
          <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
            Display Name
          </legend>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="input w-full bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
          />
        </fieldset>

        <fieldset className="fieldset gap-1">
          <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
            Email
          </legend>
          <input
            type="email"
            value={user?.email ?? ''}
            readOnly
            className="input w-full bg-base-200 border-base-300 text-sm opacity-50 cursor-not-allowed"
          />
        </fieldset>

        <fieldset className="fieldset gap-1">
          <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
            Role
          </legend>
          <div className="flex items-center gap-2 h-10">
            <span className={cn(
              'badge font-semibold uppercase tracking-wider',
              user?.role === 'director' ? 'badge-primary' : 'badge-neutral',
            )}>
              {user?.role ?? '—'}
            </span>
          </div>
        </fieldset>

        <button
          disabled={!isDirty}
          className={cn(
            'btn btn-gold w-fit mt-2 font-display tracking-[0.08em]',
            !isDirty && 'opacity-40 cursor-not-allowed',
          )}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/profile`. Expect: sidebar visible, profile form rendered with initials avatar, name editable, email read-only, role badge, Save disabled until name changes.

- [ ] **Step 3: Commit**

```bash
git add src/routes/_app/profile.tsx
git commit -m "feat: add profile page (UI only)"
```

---

## Chunk 4: Stories List Page

### Task 7: Stories list page

**Files:**
- Create: `src/routes/_app/stories/index.tsx`

- [ ] **Step 1: Create `src/routes/_app/stories/index.tsx`**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../../../lib/auth-client'
import { MOCK_STORIES, type MockStory } from '../../../lib/mock-data'
import { StatusBadge } from '../../../components/status-badge.component'
import { cn } from '../../../lib/cn'

export const Route = createFileRoute('/_app/stories/')({
  component: StoriesPage,
})

function StoriesPage() {
  const { data: session } = authClient.useSession()
  const isDirector = session?.user?.role === 'director'
  const [stories, setStories] = useState<MockStory[]>(MOCK_STORIES)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const visibleStories = isDirector
    ? stories
    : stories.filter((s) => s.cast.some((c) => c.userId === session?.user?.id))

  const handleAdd = () => {
    if (!newTitle.trim()) return
    const story: MockStory = {
      id: `s${Date.now()}`,
      title: newTitle.trim(),
      directorId: session?.user?.id ?? '',
      status: 'draft',
      props: [],
      cast: [],
      scenes: [],
    }
    setStories((prev) => [...prev, story])
    setNewTitle('')
    setAdding(false)
  }

  const handleDelete = (id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Stories</h1>
        {isDirector && (
          <button
            onClick={() => setAdding(true)}
            className="btn btn-sm btn-gold font-display tracking-[0.05em]"
          >
            + New Story
          </button>
        )}
      </div>

      {/* Inline add form */}
      {adding && (
        <div className="flex gap-2 mb-4 items-center">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Story title…"
            className="input input-sm bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10 w-64"
          />
          <button onClick={handleAdd} className="btn btn-sm btn-gold font-display">Add</button>
          <button onClick={() => setAdding(false)} className="btn btn-sm btn-ghost text-base-content/50">Cancel</button>
        </div>
      )}

      {visibleStories.length === 0 ? (
        <p className="text-base-content/40 text-sm">No stories yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                <th>Title</th>
                <th>Status</th>
                <th>Actors</th>
                <th>Scenes</th>
                {isDirector && <th />}
              </tr>
            </thead>
            <tbody>
              {visibleStories.map((story) => (
                <tr key={story.id} className="hover:bg-base-200 transition-colors">
                  <td>
                    <Link
                      to="/stories/$storyId"
                      params={{ storyId: story.id }}
                      className="font-medium hover:text-gold transition-colors"
                    >
                      {story.title}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={story.status} />
                  </td>
                  <td className="text-base-content/50">{story.cast.length}</td>
                  <td className="text-base-content/50">{story.scenes.length}</td>
                  {isDirector && (
                    <td className="text-right">
                      <Link
                        to="/stories/$storyId"
                        params={{ storyId: story.id }}
                        className="text-xs text-base-content/50 hover:text-base-content mr-4 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="text-xs text-error/60 hover:text-error transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/stories`. Expect: table of 3 mock stories with status badges, actor/scene counts. "+ New Story" visible if director. Clicking title navigates to `/stories/s1`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/_app/stories/index.tsx
git commit -m "feat: add stories list page with mock data (UI only)"
```

---

## Chunk 5: Story Detail Page

### Task 8: Story detail page

**Files:**
- Create: `src/routes/_app/stories/$storyId/index.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/routes/_app/stories/\$storyId
```

- [ ] **Step 2: Create `src/routes/_app/stories/$storyId/index.tsx`**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getStory, MOCK_USERS, type MockCast, type MockScene } from '../../../../lib/mock-data'
import { StatusBadge } from '../../../../components/status-badge.component'
import { cn } from '../../../../lib/cn'

export const Route = createFileRoute('/_app/stories/$storyId/')({
  component: StoryDetailPage,
})

function StoryDetailPage() {
  const { storyId } = Route.useParams()
  const story = getStory(storyId)

  const [title, setTitle] = useState(story?.title ?? '')
  const [activeTab, setActiveTab] = useState<'cast' | 'scenes'>('cast')
  const [cast, setCast] = useState<MockCast[]>(story?.cast ?? [])
  const [scenes, setScenes] = useState<MockScene[]>(story?.scenes ?? [])
  const [newSceneTitle, setNewSceneTitle] = useState('')

  const isTitleDirty = title !== (story?.title ?? '')

  if (!story) {
    return (
      <div className="p-8">
        <p className="text-base-content/40">Story not found.</p>
      </div>
    )
  }

  const actorUsers = MOCK_USERS.filter((u) => u.role === 'actor')
  const castUserIds = new Set(cast.map((c) => c.userId))
  const availableActors = actorUsers.filter((u) => !castUserIds.has(u.id))

  const handleRemoveCast = (castId: string) => {
    setCast((prev) => prev.filter((c) => c.id !== castId))
  }

  const handleAddActor = (userId: string) => {
    const user = MOCK_USERS.find((u) => u.id === userId)
    if (!user) return
    const availableProp = story.props.find(
      (p) => p.type === 'character' && !cast.some((c) => c.propId === p.id),
    )
    if (!availableProp) return
    const newCast: MockCast = {
      id: `c${Date.now()}`,
      storyId: story.id,
      userId,
      propId: availableProp.id,
      name: `${user.name} as ${availableProp.name}`,
      imageUrl: null,
      user,
      prop: availableProp,
    }
    setCast((prev) => [...prev, newCast])
  }

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return
    const scene: MockScene = {
      id: `sc${Date.now()}`,
      storyId: story.id,
      title: newSceneTitle.trim(),
      order: scenes.length + 1,
    }
    setScenes((prev) => [...prev, scene])
    setNewSceneTitle('')
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
        />
        <StatusBadge status={story.status} />
        <button
          disabled={!isTitleDirty}
          className={cn(
            'btn btn-sm btn-gold font-display tracking-[0.05em]',
            !isTitleDirty && 'opacity-40 cursor-not-allowed',
          )}
        >
          Save
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-border mb-6 border-base-300">
        {(['cast', 'scenes'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'tab font-display tracking-[0.05em] capitalize',
              activeTab === tab ? 'tab-active text-gold' : 'text-base-content/40',
            )}
          >
            {tab} ({tab === 'cast' ? cast.length : scenes.length})
          </button>
        ))}
      </div>

      {/* Cast tab */}
      {activeTab === 'cast' && (
        <div>
          {cast.length === 0 ? (
            <p className="text-base-content/40 text-sm mb-4">No actors cast yet.</p>
          ) : (
            <table className="table table-sm w-full mb-4">
              <thead>
                <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                  <th>Actor</th>
                  <th>Character</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cast.map((c) => (
                  <tr key={c.id} className="hover:bg-base-200 transition-colors">
                    <td>{c.user.name}</td>
                    <td className="text-base-content/70">{c.prop.name}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handleRemoveCast(c.id)}
                        className="text-xs text-error/60 hover:text-error transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {availableActors.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {availableActors.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleAddActor(u.id)}
                  className="btn btn-xs btn-outline btn-gold font-display"
                >
                  + {u.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scenes tab */}
      {activeTab === 'scenes' && (
        <div>
          <div className="flex flex-col gap-2 mb-4">
            {scenes.length === 0 ? (
              <p className="text-base-content/40 text-sm">No scenes yet.</p>
            ) : (
              scenes
                .sort((a, b) => a.order - b.order)
                .map((scene) => (
                  <div
                    key={scene.id}
                    className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
                  >
                    <span className="text-sm">
                      <span className="text-base-content/40 mr-2">{scene.order}.</span>
                      {scene.title}
                    </span>
                    <Link
                      to="/stories/$storyId/scenes/$sceneId"
                      params={{ storyId, sceneId: scene.id }}
                      className="text-xs text-gold hover:text-gold/70 transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                ))
            )}
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddScene() }}
              placeholder="Scene title…"
              className="input input-sm bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10 w-56"
            />
            <button onClick={handleAddScene} className="btn btn-sm btn-gold font-display">
              + Add Scene
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/stories/s1`. Expect: editable title "The Haunted Ballroom", status badge ACTIVE, Cast/Scenes tabs. Cast tab shows Anna and Marco. Scenes tab shows 3 scenes with "View →" links.

- [ ] **Step 4: Commit**

```bash
git add "src/routes/_app/stories/\$storyId/index.tsx"
git commit -m "feat: add story detail page with cast/scenes tabs (UI only)"
```

---

## Chunk 6: Scene Detail Page

### Task 9: Scene detail page

**Files:**
- Create: `src/routes/_app/stories/$storyId/scenes/$sceneId.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/routes/_app/stories/\$storyId/scenes"
```

- [ ] **Step 2: Create `src/routes/_app/stories/$storyId/scenes/$sceneId.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getScene, getStory, type MockProp } from '../../../../../lib/mock-data'
import { cn } from '../../../../../lib/cn'

export const Route = createFileRoute('/_app/stories/$storyId/scenes/$sceneId')({
  component: SceneDetailPage,
})

function SceneDetailPage() {
  const { storyId, sceneId } = Route.useParams()
  const story = getStory(storyId)
  const scene = getScene(storyId, sceneId)

  const [title, setTitle] = useState(scene?.title ?? '')
  // Intentionally empty: scene-prop assignments are not in the schema.
  // The UI lets the director assign story-level props to this scene.
  const [sceneProps, setSceneProps] = useState<MockProp[]>([])

  const isTitleDirty = title !== (scene?.title ?? '')

  if (!story || !scene) {
    return (
      <div className="p-8">
        <p className="text-base-content/40">Scene not found.</p>
      </div>
    )
  }

  const totalScenes = story.scenes.length
  const sceneOrder = scene.order

  const backgrounds = sceneProps.filter((p) => p.type === 'background')
  const characters = sceneProps.filter((p) => p.type === 'character')

  const availableBackgrounds = story.props.filter(
    (p) => p.type === 'background' && !sceneProps.some((sp) => sp.id === p.id),
  )
  const availableCharacters = story.props.filter(
    (p) => p.type === 'character' && !sceneProps.some((sp) => sp.id === p.id),
  )

  const handleAddProp = (prop: MockProp) => {
    setSceneProps((prev) => [...prev, prop])
  }

  const handleRemoveProp = (propId: string) => {
    setSceneProps((prev) => prev.filter((p) => p.id !== propId))
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
        />
        <span className="text-sm text-base-content/40 whitespace-nowrap">
          Scene {sceneOrder} of {totalScenes}
        </span>
        <button
          disabled={!isTitleDirty}
          className={cn(
            'btn btn-sm btn-gold font-display tracking-[0.05em]',
            !isTitleDirty && 'opacity-40 cursor-not-allowed',
          )}
        >
          Save
        </button>
      </div>

      {/* Backgrounds */}
      <PropSection
        label="Backgrounds"
        props={backgrounds}
        available={availableBackgrounds}
        onAdd={handleAddProp}
        onRemove={handleRemoveProp}
        addLabel="+ Add Background"
      />

      {/* Characters */}
      <PropSection
        label="Characters"
        props={characters}
        available={availableCharacters}
        onAdd={handleAddProp}
        onRemove={handleRemoveProp}
        addLabel="+ Add Character"
      />
    </div>
  )
}

function PropSection({
  label,
  props,
  available,
  onAdd,
  onRemove,
  addLabel,
}: {
  label: string
  props: MockProp[]
  available: MockProp[]
  onAdd: (prop: MockProp) => void
  onRemove: (propId: string) => void
  addLabel: string
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
        {label}
      </h2>

      <div className="flex flex-col gap-2 mb-3">
        {props.length === 0 ? (
          <p className="text-base-content/30 text-sm">None added yet.</p>
        ) : (
          props.map((prop) => (
            <div
              key={prop.id}
              className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded bg-base-300 flex items-center justify-center text-base-content/40 text-xs font-mono">
                  img
                </div>
                <span className="text-sm font-medium">{prop.name}</span>
              </div>
              <button
                onClick={() => onRemove(prop.id)}
                className="text-xs text-error/60 hover:text-error transition-colors"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {available.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {available.map((prop) => (
            <button
              key={prop.id}
              onClick={() => onAdd(prop)}
              className="btn btn-xs btn-outline btn-gold font-display"
            >
              + {prop.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/stories/s1/scenes/sc1` (via the "View →" link on story detail). Expect: "Opening Night" scene, Scene 1 of 3 indicator, Backgrounds and Characters sections showing available props from the story as buttons to add.

- [ ] **Step 4: Commit**

```bash
git add "src/routes/_app/stories/\$storyId/scenes/\$sceneId.tsx"
git commit -m "feat: add scene detail page with grouped props (UI only)"
```

---

## Final Step: Add `.gitignore` entry for brainstorm files

- [ ] **Add `.superpowers/` to `.gitignore` if not already present**

```bash
echo '.superpowers/' >> .gitignore
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm files"
```
