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

**honeypotmagic** is an online collaborative theater platform for storytelling. Groups perform interactive stories together using animated Konva canvas characters, with a public LiveKit broadcast stream for audiences. See `SPEC.md` for full product specification.

## Tech Stack

- **React 19** + **TypeScript 5** — UI
- **Konva / react-konva** — 2D canvas rendering and interaction
- **Vite 7** — build tool
- **Tailwind CSS v4** + Sass — styling
- **TanStack Router** — file-based routing with `beforeLoad` auth guards
- **TanStack Query** — data fetching/caching
- **better-auth** — email/password authentication, Drizzle adapter (SQLite)
- **Drizzle ORM** — type-safe SQLite schema and queries
- **DaisyUI v5** — Tailwind CSS component plugin (`@plugin "daisyui"` in index.css)
- **clsx + tailwind-merge** — conditional class composition via `cn()` helper (`src/lib/cn.ts`)
- **LiveKit** (`livekit-client`, `@livekit/components-react`) — real-time multi-user sessions
- **Hono** — backend server (API + auth endpoints)
- **SQLite** — database via Drizzle ORM (users, characters, stories, cast)

## User Roles

- **Director** — creates stories, assigns characters to actors, starts/ends LiveKit sessions
- **Actor** — authenticated user with one assigned character per story; manipulates character on canvas
- **Viewer** — unauthenticated; watch-only via public broadcast URL

## Routes

| Route | Auth | Description |
|---|---|---|
| `/login` | Public | Email/password login |
| `/` | Actor, Director | Dashboard — list of stories |
| `/stage/:storyId` | Assigned actors + Director | Theater stage — canvas + live session |
| `/director` | Director only | Manage stories, assign characters, control session |
| `/broadcast/:roomId` | Public | Watch-only LiveKit stream |

## Data Models (SQLite)

- **users** — id, email, password, role (`actor` | `director`) — managed by better-auth
- **characters** — id, name, image_url
- **stories** — id, title, description, director_id, status (`draft`|`active`|`ended`), livekit_room_name, broadcast_id
- **cast** — story_id + user_id + character_id (one user = one character per story)

## Authentication

- `src/lib/auth-client.ts` — better-auth client
- `src/lib/auth.ts` — better-auth server config, mounted at `/api/auth/*`
- Custom `role` field on users; route guards via TanStack Router `beforeLoad`

## Backend (Hono)

Key API endpoints (see `SPEC.md` for full list):

- `ALL /api/auth/*` — better-auth handler
- `GET/POST /api/stories` — list/create stories
- `POST/DELETE /api/stories/:id/cast` — assign/remove actors
- `POST /api/livekit/token` — publisher token (authenticated)
- `GET /api/livekit/broadcast-token/:roomId` — subscribe-only token (public)

## LiveKit

- Director starts session → backend creates LiveKit room
- Actors receive publisher tokens; viewers receive subscribe-only tokens
- Character state (position, rotation, scale) synced via LiveKit data messages to all participants

## Component Structure

- `components/stage.component.tsx` — Konva `Stage` + `Layer`; uses `useWindowSize`; renders `DraggableCharacter` per assigned character
- `components/draggable-character.component.tsx` — interactive Konva `Image`:
  - Drag to move
  - Two-finger touch → rotate + pan
  - Double-click/tap → horizontal mirror (`scaleX` flip)
  - `mousedown`/`touchstart` → bring to top (z-index)
  - Publishes state changes via LiveKit data messages

## Hooks

- `useWindowSize` — responsive canvas dimensions
- `useTheme` — light/dark toggle, persists to `localStorage`

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
