# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

always use pnpm never use npm

**Never commit changes unless the user explicitly asks you to.** Always show what would be committed and wait for confirmation first.

```bash
pnpm dev          # Start development server
pnpm build        # TypeScript check + production build
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## Overview

**potmagic** is an online collaborative theater platform for storytelling. Groups perform interactive stories together using animated Konva canvas characters, with a public LiveKit broadcast stream for audiences. See `SPEC.md` for full product specification and `SPEC_LIVE.md` specifically for LiveKit implementation.

## Tech Stack

- **React 19** + **TypeScript 5** — UI
- **Konva / react-konva** — 2D canvas rendering and interaction
- **Vite 7** — build tool
- **TanStack Start** — fullstack framework (SSR, server functions, file-based routing)
- **TanStack Router** — file-based routing with `beforeLoad` auth guards
- **TanStack Query** — data fetching/caching
- **Tailwind CSS v4** + Sass — styling
- **better-auth** — email/password + magic link authentication, Drizzle adapter (PostgreSQL)
- **Drizzle ORM** — type-safe PostgreSQL schema and queries
- **DaisyUI v5** — primary UI component library; Tailwind CSS plugin (`@plugin "daisyui"` in index.css); use daisyUI component classes for all UI elements
- **clsx + tailwind-merge** — conditional class composition via `cn()` helper (`src/lib/cn.ts`)
- **@dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities** — drag-and-drop (scene reordering)
- **LiveKit** (`livekit-client`, `@livekit/components-react`) — real-time multi-user sessions
- **Rive** (`@rive-app/canvas`, `@rive-app/react-webgl2`) — animated prop support
- **Vercel Blob** (`@vercel/blob`) — file storage for prop assets (`props/` prefix) and user avatars (`avatars/` prefix)
- **Resend** — transactional email (magic links, password reset)
- **PostgreSQL** — database via Drizzle ORM

## User Roles

- **Director** — creates stories, manages props library, assigns characters to actors, starts/ends LiveKit sessions
- **Actor** — authenticated user with one assigned character per story; manipulates character on canvas
- **Viewer** — unauthenticated; watch-only via public broadcast URL

## Routes

| Route | Auth | Description |
|---|---|---|
| `/login` | Public | Email/password login |
| `/` | Auth required | Root; redirects to stories |
| `/stories` | Auth required | Story list; directors can create/delete |
| `/stories/$storyId` | Auth required | Story detail with Scenes / Cast tabs |
| `/stories/$storyId/scenes/$sceneId` | Auth required | Scene detail; manage scene cast assignments |
| `/stage` | Auth required | Empty state with navigation guide |
| `/stage/$sceneId` | Assigned actors + Director | Theater canvas for a specific scene |
| `/director` | Director only | Dashboard + Library tabs; manage stories and props |
| `/profile` | Auth required | User profile page |
| `/broadcast/:roomId` | Public | Watch-only LiveKit stream |

All authenticated routes are wrapped by `_app.tsx` which calls `requireAuth()` server function.

## Data Models (PostgreSQL)

- **users** — id, name, email, emailVerified, image, role (`actor` | `director`), timestamps — managed by better-auth
- **sessions, accounts, verifications** — better-auth internal tables
- **stories** — id, title, directorId, status (`draft`|`active`|`ended`), livekitRoomName, broadcastAt, timestamps
- **scenes** — id, storyId, title, order (for sequencing within story), timestamps
- **props** — id, storyId, name, type (`character` | `background`), imageUrl, timestamps — global library
- **cast** — id, storyId, userId, propId — one actor = one prop per story
- **sceneCast** — id, sceneId, castId — which cast members appear in each scene (one background per scene enforced)

## Authentication

- `src/lib/auth.ts` — better-auth server config with email/password plugin + Resend for password reset emails
- `src/lib/auth-client.ts` — better-auth client; use `authClient.useSession()` in components
- `src/lib/auth-guard.ts` — `requireAuth()` server function used in route `beforeLoad`
- Custom `role` field on users; route guards via TanStack Router `beforeLoad`

## Backend (TanStack Start Server Functions)

All server logic is implemented as TanStack Start server functions using `createServerFn()`. No separate Hono server — TanStack Start handles the server entry point at `src/server.ts`.

Key server function files:

- `src/lib/stories.fns.ts` — `listStories`, `createStory`, `deleteStory`
- `src/lib/story-detail.fns.ts` — `getStoryDetail`, `updateStoryStatus`, `updateStoryTitle`, `addCast`, `removeCast`, `assignProp`, `addScene`, `removeScene`
- `src/lib/scenes.fns.ts` — `getSceneDetail`, `updateSceneTitle`, `addSceneCast`, `removeSceneCast`, `getSceneStage`
- `src/lib/props.fns.ts` — `getSignedUploadUrl`, `createProp`, `listProps`, `deleteProp`
- `src/lib/auth-guard.ts` — `requireAuth`

Auth is still mounted at `/api/auth/*` via better-auth's handler in the server entry point.

## LiveKit

- Director starts session → backend creates LiveKit room (room name stored on story)
- Actors receive publisher tokens; viewers receive subscribe-only tokens
- Character state (position, rotation, scale) synced via LiveKit data messages to all participants
- Canvas renders scene-level cast (`sceneCast`) not story-level cast

## Component Structure

- `src/components/stage.component.tsx` — Konva `Stage` + `Layer`; renders `DraggableCharacter` per scene cast member
- `src/components/draggable-character.component.tsx` — interactive Konva `Image`:
  - Drag to move (only by assigned actor — per-user drag control)
  - Two-finger touch → rotate + pan
  - Double-click/tap → horizontal mirror (`scaleX` flip)
  - `mousedown`/`touchstart` → bring to top (z-index)
  - Backgrounds are constrained to bottom of canvas
  - Publishes state changes via LiveKit data messages
- `src/components/cast-preview.component.tsx` — fixed overlay (top-right) showing scene cast avatars; current user highlighted with gold ring
- `src/components/sidebar.component.tsx` — navigation (Stories, Stage, Director links), theme toggle, logout button; uses HeroIcons
- `src/components/breadcrumb.component.tsx` — hierarchical navigation for story/scene pages
- `src/components/status-badge.component.tsx` — colored badge for story status (`draft` | `active` | `ended`)
- `src/components/password-input.component.tsx` — styled password input with show/hide toggle
- `src/components/toaster.component.tsx` — toast notifications (error/success from mutations)

## Hooks

- `useWindowSize` — responsive canvas dimensions
- `useTheme` — light/dark toggle, persists to `localStorage`

## Library / Utilities

- `src/lib/cn.ts` — `cn()` helper wrapping `clsx` + `tailwind-merge`
- `src/lib/toast.ts` — toast notification helpers
- `src/lib/props.fns.ts` — uses `@vercel/blob` `put`/`del` for prop asset storage (`props/` prefix)
- `src/lib/avatar.fns.ts` — uses `@vercel/blob` `put` for user avatar storage (`avatars/` prefix)
- `src/db/schema.ts` — full Drizzle schema (users, sessions, stories, scenes, props, cast, sceneCast)
- `src/db/migrations/` — Drizzle migration files

## Styling Rules

- **No inline styles** — never use the `style` prop in React components; use Tailwind classes only
- **Conditional classes** — always use `cn()` from `src/lib/cn.ts` (wraps `clsx` + `tailwind-merge`) for conditional or merged class names
- **Custom utilities** — complex multi-property styles (gradients, shadows, fonts) go in `src/index.css` as `@utility` blocks, not inline
- **Design tokens** — use semantic CSS variables (`--gold`, `--base-100`, etc.) defined in `src/index.css`; extend via `@theme` to make them available as Tailwind classes

## Import Paths

- Always use the `@/` prefix for imports from `src/` (configured in `tsconfig.json` as `"@/*": ["./src/*"]`)
- Example: `import { cn } from '@/lib/cn'` not `import { cn } from '../../lib/cn'`

## Key Patterns

- Konva nodes manipulated imperatively via refs (not React state) for performance
- Multi-touch angles/midpoints computed manually from `TouchEvent` coordinates
- `scaleX` sign flip for mirroring (preserves absolute scale magnitude)
- Characters initially positioned at `x: 100 + index * 200, y: 100`
- Backgrounds pinned to bottom of canvas regardless of drag position
- All data access through TanStack Start server functions (`createServerFn`) — never direct DB calls from components
- Server function files use `.fns.ts` or `.server.ts` suffix convention

## Skills & Agents (.claude/)

### Skills (`src/.claude/skills/`)
Available skills to invoke with the `Skill` tool during development:

- `tanstack-start-best-practices` — TanStack Start execution model, server functions, routing, middleware, SEO, import protection, hosting
- `livekit-best-practices` — LiveKit rooms, tokens, multi-user video/voice/data exchange patterns
- `react-best-practices` — Function components, Context API over prop drilling
- `tailwind-dark-mode` — Dark/light mode with Tailwind v4, `data-theme` attribute
- `rive-best-practices` — Rive animations: `@rive-app/react-webgl2`, CJS import workaround, `useRive` hook, state machines, layout/fit, asset loading, `RiveCanvas` wrapper pattern

### Agents (`.claude/agents/`)
Specialized reference agents for documentation lookup:

**TanStack Start** (model: sonnet):
- `tanstack-start-routing` — File-based routing, loaders, route config
- `tanstack-start-server-function` — `createServerFn` API, validation, error handling
- `tanstack-start-server-routes` — HTTP endpoints alongside router routes
- `tanstack-start-middleware` — Composable middleware, context flow
- `tanstack-start-execution-model` — Isomorphic-by-default, server vs client
- `tanstack-start-code-execution-pattern` — Server-only, client-only, isomorphic patterns
- `tanstack-start-environment-functions` — `createIsomorphicFn`, `createServerOnlyFn`
- `tanstack-start-import-protection` — Vite plugin, server/client bundle safety
- `tanstack-start-databases` — Database integration patterns
- `tanstack-start-hosting` — Deployment presets (Vercel, Cloudflare, Node, Bun)
- `tanstack-start-seo` — Meta tags, SSR, JSON-LD, canonical URLs
- `tanstack-start-server-entry-point` — Custom server bootstrap

**better-auth** (reference agents):
- `better-auth-docs` — General better-auth documentation
- `better-auth-email-password` — Email/password plugin
- `better-auth-email-service` — Email sending (Resend integration)
- `better-auth-drizzle` — Drizzle ORM adapter
- `better-auth-postgres` — PostgreSQL setup

**DaisyUI v5** (model: haiku):
- `daisyui-use` — Core usage, component classes, combining with Tailwind utilities
- `daisyui-config` — Plugin config options (themes, root, include/exclude, prefix, logs)
- `daisyui-themes` — Built-in themes, custom themes, nesting, dark mode integration
- `daisyui-colors` — Semantic color system, CSS variables, opacity modifiers
- `daisyui-customize` — Customization methods (daisyUI classes, Tailwind utilities, `@apply`)
- `daisyui-utilities` — Utility classes, border radius tokens, glass effect, CSS variables
- `daisyui-base` — Base styles and how to exclude them
- `daisyui-layout-and-typography` — Tailwind layout utilities + Typography plugin integration

## Figma MCP Integration Rules

These rules define how to translate Figma inputs into code for this project. Follow them for every Figma-driven change.

### Figma Account Constraints

- The authenticated Figma account (`hubert.talib@gmail.com`) is on a **Starter plan / View seat** — **6 MCP tool calls per month**. Use calls sparingly.
- **IMPORTANT:** Only `figma.com/design/` URLs are supported. `figma.com/site/` (Figma Sites) and `figma.com/board/` URLs will fail — ask the user for the underlying design file link.
- Call order to minimize wasted calls: `get_design_context` (returns both code + screenshot by default) → `get_metadata` only if context is too large → never call `get_screenshot` separately unless `get_design_context` explicitly failed to include one.

### Required Flow (do not skip)

1. Call `get_design_context` first to fetch the structured representation for the exact node(s)
2. If the response is too large or truncated, call `get_metadata` to get the high-level node map, then re-fetch only the required node(s) with `get_design_context`
3. Call `get_screenshot` for a visual reference of the node being implemented
4. Only after you have both `get_design_context` and `get_screenshot`, download any assets needed and start implementation
5. Translate the output (usually React + Tailwind) into this project's conventions, styles, and framework
6. Validate against the Figma screenshot for 1:1 visual parity before marking complete

### Component Organization

- All UI components live in `src/components/`; file names use `.component.tsx` suffix for named components (e.g. `sidebar.component.tsx`) and plain `.tsx` for simpler primitives (e.g. `confirm-modal.tsx`, `data-list.tsx`)
- **IMPORTANT:** Before creating a new component, search `src/components/` for an existing one that can be reused or extended
- Export components as named exports (not default exports): `export function MyComponent(...)`
- No Storybook — validate visually against the running app and Figma screenshots

### Styling Rules

- **IMPORTANT: Never use the `style` prop** — use Tailwind utility classes only
- **IMPORTANT: Never hardcode colors** — use DaisyUI semantic color classes (`text-base-content`, `bg-base-200`, `text-primary`, `text-accent`, `text-success`, `text-error`, etc.) or Tailwind utilities mapped to theme tokens
- Conditional/merged class names must always use `cn()` from `src/lib/cn.ts` (wraps `clsx` + `tailwind-merge`)
- DaisyUI v5 is the primary component library — use its component classes (`btn`, `card`, `modal`, `badge`, `input`, `table`, `dropdown`, `loading`, etc.) before writing custom markup
- Tailwind CSS v4 is used via `@import "tailwindcss"` in `src/index.css`; no `tailwind.config.js` — extend via `@theme` in CSS
- Custom multi-property utilities (gradients, shadows, fonts) go in `src/index.css` as `@utility` blocks, never inline

### Design Tokens

- **Themes:** DaisyUI custom themes set via `data-theme` attribute on `<html>`. The two project themes are:
  - `potmagic-dark` — deep velvet stage, dark color-scheme (default)
  - `potmagic-light` — warm ivory parchment, light color-scheme
  - Toggled by `useTheme` hook in `src/hooks/useTheme.ts`
- **Dark mode variant:** `@custom-variant dark` targets `[data-theme=potmagic-dark]` — use `dark:` Tailwind prefix to target the dark theme specifically
- **DaisyUI v5 semantic color tokens** (defined via `--color-*` CSS vars in `src/index.css`; use Tailwind class equivalents):

  | Purpose | Tailwind class | Example use |
  |---|---|---|
  | Surface base | `bg-base-100` | page background |
  | Sunken surface | `bg-base-200` | sidebar, input background |
  | Deeply sunken | `bg-base-300` | dividers, avatar placeholder |
  | Body text | `text-base-content` | default text |
  | Muted text | `text-base-content/60` | secondary labels |
  | Faint text | `text-base-content/30` | placeholders, hints |
  | Primary action | `bg-primary` / `text-primary` | buttons, active nav links |
  | Primary muted bg | `bg-primary/10` | active nav highlight |
  | Accent / brand | `bg-accent` / `text-accent` | warm orange/gold accent |
  | Success | `text-success` / `badge-success` | active/live states |
  | Warning | `text-warning` / `badge-warning` | draft states |
  | Error | `text-error` / `badge-error` | destructive actions |
  | Neutral | `bg-neutral` / `text-neutral-content` | muted surfaces |
  | Info | `text-info` | informational states |

- **IMPORTANT: No `--gold` token** — use `text-accent` / `bg-accent` / `border-accent` for the warm accent color; there is no separate `--gold` variable
- **Borders:** standard divider is `border border-base-300`; use `border-base-300` not hardcoded colors
- **Opacity modifiers:** use Tailwind opacity syntax (`text-base-content/60`, `bg-base-100/80`) for muted variants — never hardcode rgba

### Typography

- Primary font: **Lexend** (variable weight 100–900), loaded from Google Fonts in `src/index.css`
- Display/heading text uses `font-display` class (maps to Lexend via `--font-display` in `@theme`)
- Label/tracking patterns: `uppercase tracking-wider` for section labels (badges, status), `tracking-wide` for buttons
- Link hover pattern: `hover:text-primary transition-colors` — do not use underlines for navigation links

### Icon System

- Icons come from `lucide-react`
- Import named icon components: `import { BookOpen } from 'lucide-react'`
- Render with size utility: `<BookOpen className="size-4" />` (use `size-*` not `w-* h-*`)
- **IMPORTANT: Do NOT install new icon packages** — use Lucide exclusively; inline SVG only as a last resort for custom shapes not available in Lucide

### Asset Handling

- Prop assets (characters, backgrounds, sounds, animations) are stored in **Vercel Blob** under the `props/` path prefix; user avatars under `avatars/{userId}/`. Both are referenced via public Vercel Blob URLs on the `props.imageUrl` / `users.image` columns
- Static app assets live in `public/`
- **IMPORTANT:** If the Figma MCP server returns a `localhost` source for an image or SVG, use that source directly — do not create placeholders
- Rive animations (`.riv` files) are rendered via `<RiveCanvas>` component (`src/components/rive-canvas.component.tsx`)

### Responsive Design

- Layout is sidebar + main content: sidebar is `w-14` (collapsed) / `w-52` (expanded), controlled by `Sidebar` component
- Stage/canvas route auto-collapses the sidebar
- Use Tailwind responsive prefixes (`md:`, `lg:`) for breakpoint variants; the canvas (`Stage`) uses `useWindowSize` hook for dynamic sizing

### Project Structure Summary

```
src/
  components/       # All UI components
  routes/           # TanStack file-based routes
    _app/           # Authenticated layout (wraps Sidebar)
    auth.tsx        # Auth pages
    show/           # Public broadcast viewer
  lib/              # Server functions (*.fns.ts), utilities, auth config
  db/               # Drizzle schema + migrations
  hooks/            # React hooks (useTheme, useWindowSize)
  index.css         # Global styles, Tailwind + DaisyUI config, theme tokens
```

### Key Patterns

```tsx
// Class composition
import { cn } from '@/lib/cn'
<div className={cn('btn btn-sm btn-primary', isActive && 'btn-accent', className)} />

// DaisyUI modal
<dialog className="modal modal-open">
  <div className="modal-box">...</div>
  <form method="dialog" className="modal-backdrop"><button>close</button></form>
</dialog>

// DaisyUI badge with semantic color
<span className={cn('badge badge-sm font-semibold uppercase tracking-wider', 'badge-success')}>
  Active
</span>

// DaisyUI dropdown
<div className="dropdown dropdown-end">
  <button tabIndex={0} className="btn btn-sm">Trigger</button>
  <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box border border-base-300 shadow-lg z-10 p-1 w-32 mt-1">
    <li><button className="text-xs">Action</button></li>
  </ul>
</div>

// DaisyUI card
<div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow duration-200">
  <div className="card-body gap-3">
    <h2 className="card-title font-display text-base">Title</h2>
    <div className="card-actions"><button className="btn btn-sm btn-primary w-full">Action</button></div>
  </div>
</div>

// Active nav link (TanStack Router adds .active class)
<Link className="btn btn-ghost btn-sm [&.active]:bg-primary/10 [&.active]:text-primary" to="/stories/">
  Stories
</Link>

// Lucide icon usage
import { X } from 'lucide-react'
<X className="size-4" />

// Muted/dimmed text hierarchy
<p className="text-base-content">Primary text</p>
<p className="text-base-content/60">Secondary text</p>
<p className="text-base-content/30">Hint / placeholder text</p>

// Standard border divider
<div className="border-b border-base-300" />

// TanStack Router navigation (never use <a> tags)
import { Link } from '@tanstack/react-router'
<Link to="/stories/$storyId" params={{ storyId: id }} className="hover:text-primary transition-colors">
  Title
</Link>
```

### Figma → DaisyUI Translation Guide

When Figma MCP returns raw HTML + Tailwind, map common patterns to DaisyUI equivalents before writing code:

| Figma pattern | DaisyUI equivalent | Notes |
|---|---|---|
| Button with bg color | `btn btn-primary` / `btn btn-ghost` | Never build raw `<button>` with bg classes |
| Pill / tag / chip | `badge badge-sm` | Add `badge-success`, `badge-warning`, etc. for color variants |
| Input field | `input` | Add `bg-base-200 border-base-300` |
| Table | `table table-sm` | Wrap in `overflow-x-auto` |
| Dropdown menu | `dropdown` + `dropdown-content menu` | Use `dropdown-end` for right-aligned |
| Modal / dialog | `modal modal-open` + `modal-box` + `modal-backdrop` | See key patterns above |
| Card / panel | `card` + `card-body` or `bg-base-200 border border-base-300 rounded-xl` | |
| Spinner / loading | `loading loading-spinner loading-xs/sm/md` | Never use a custom SVG spinner |
| Avatar / user image | `avatar` + inner `div` with `rounded-full` | Match existing `cast-preview.component.tsx` pattern |
| Navbar / top bar | `navbar bg-base-100 border-b border-base-300` | |
| Tabs | Manual `role="tablist"` + border-b pattern | See `director.tsx` for the tab pattern used here |
| Toast / alert | `toast` via `src/lib/toast.ts` helpers — `toast.error()` / `toast.success()` | Never build inline alerts |

### Border Radius Tokens

DaisyUI v5 exposes radius tokens — use Tailwind's `rounded-*` utilities that map to them:

| Token | Tailwind class | Usage |
|---|---|---|
| `--radius-selector` | `rounded` / `rounded-md` | Buttons, badges, selectors |
| `--radius-field` | `rounded-xl` | Inputs, textareas |
| `--radius-box` | `rounded-xl` / `rounded-2xl` | Cards, modals, panels |
