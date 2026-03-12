# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

always use pnpm never use npm

```bash
pnpm dev          # Start development server
pnpm build        # TypeScript check + production build
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## Overview

**honeypotmagic** is an online collaborative theater platform for storytelling. Groups perform interactive stories together using animated Konva canvas characters, with a public LiveKit broadcast stream for audiences. See `SPEC.md` for full product specification and `SPEC_LIVE.md` specifically for LiveKit implementation.

## Tech Stack

- **React 19** + **TypeScript 5** — UI
- **Konva / react-konva** — 2D canvas rendering and interaction
- **Vite 7** — build tool
- **TanStack Start** — fullstack framework (SSR, server functions, file-based routing)
- **TanStack Router** — file-based routing with `beforeLoad` auth guards
- **TanStack Query** — data fetching/caching
- **Tailwind CSS v4** + Sass — styling
- **better-auth** — email/password authentication, Drizzle adapter (PostgreSQL)
- **Drizzle ORM** — type-safe PostgreSQL schema and queries
- **DaisyUI v5** — primary UI component library; Tailwind CSS plugin (`@plugin "daisyui"` in index.css); use daisyUI component classes for all UI elements
- **clsx + tailwind-merge** — conditional class composition via `cn()` helper (`src/lib/cn.ts`)
- **LiveKit** (`livekit-client`, `@livekit/components-react`) — real-time multi-user sessions
- **Supabase Storage** — file storage for prop images (bucket: `props`)
- **Resend** — transactional email (password reset)
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
- `src/lib/supabase.server.ts` — Supabase client (server-only) for signed upload URLs and storage ops
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
