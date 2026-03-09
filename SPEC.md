# HoneypotMagic — Theater App Specification

## Overview

HoneypotMagic is an online collaborative theater platform for storytelling. Groups of people can perform interactive stories together using animated canvas characters, with a public broadcast stream for audiences.

Two access modes:
- **Authenticated** — actors and directors perform and manage stories
- **Public** — anyone can watch a live broadcast via a unique URL (no login required)

---

## User Roles

### Director
- Creates and manages stories
- Assigns characters to registered actors
- Starts and ends LiveKit sessions (the performance)
- Controls the broadcast room

### Actor
- Must be authenticated (email/password)
- Has exactly one character assigned per story
- Can only join a stage if they have been assigned a character for that story
- Manipulates their character on the Konva canvas (drag, rotate, mirror)

### Viewer (Public)
- No authentication required
- Accesses broadcast page via a unique public URL (`/broadcast/:roomId`)
- Watch-only — cannot interact with the canvas or session

---

## Pages & Routes

| Route | Auth Required | Role | Description |
|---|---|---|---|
| `/login` | No | Any | Email/password login form |
| `/` | Yes | Actor, Director | Dashboard — lists available stories |
| `/stage/:storyId` | Yes | Assigned actors + Director | Theater stage — canvas + live session |
| `/director` | Yes | Director only | Create stories, assign characters, manage sessions |
| `/broadcast/:roomId` | No | Viewer | Watch-only LiveKit stream |

Route guards are enforced via TanStack Router `beforeLoad` hooks. Unauthenticated users are redirected to `/login`. Non-directors attempting `/director` get a 403.

---

## Data Models (PostgreSQL + Drizzle ORM)

All tables are defined as Drizzle schemas. The `users` table is managed by better-auth via the Drizzle adapter; custom tables (`characters`, `stories`, `cast`) use Drizzle directly.

### users _(managed by better-auth via Drizzle adapter)_
| Field | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| email | TEXT | Unique |
| password | TEXT | Hashed |
| role | TEXT | `actor` or `director` |
| created_at | DATETIME | |

### characters
| Field | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| name | TEXT | Display name (e.g. "Bear", "Crocodile") |
| image_url | TEXT | Path or URL to character asset |
| created_at | DATETIME | |

### stories
| Field | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| title | TEXT | Story name |
| description | TEXT | Optional summary |
| director_id | TEXT | FK → users.id |
| status | TEXT | `draft`, `active`, or `ended` |
| livekit_room_name | TEXT | Unique room identifier for LiveKit |
| broadcast_id | TEXT (UUID) | Public broadcast URL identifier |
| created_at | DATETIME | |

### cast
| Field | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| story_id | TEXT | FK → stories.id |
| user_id | TEXT | FK → users.id |
| character_id | TEXT | FK → characters.id |

Constraints:
- One user can only be assigned one character per story (`UNIQUE(story_id, user_id)`)
- One character can only be assigned to one user per story (`UNIQUE(story_id, character_id)`)

---

## Authentication

- Provider: **better-auth** with Drizzle adapter (PostgreSQL)
- Method: **Email + password only** (no OAuth)
- Custom field: `role` (`actor` | `director`) added to the users table
- Sessions managed by better-auth (cookie-based)
- Client: `src/lib/auth-client.ts`
- Server: `src/lib/auth.ts` mounted at `/api/auth/*`

---

## LiveKit Integration

### Session Flow
1. Director opens a story in `/director` and clicks "Start Performance"
2. Backend creates (or reuses) a LiveKit room named by `stories.livekit_room_name`
3. Assigned actors visit `/stage/:storyId` → backend issues them a **publisher token** with their `user_id` as participant identity
4. Director receives a **publisher token** with full room control permissions
5. Broadcast viewers visit `/broadcast/:roomId` → backend issues a **subscribe-only token** (no publish permission)

### Token Generation
- All LiveKit tokens are generated server-side via the LiveKit Node SDK
- Endpoint: `POST /api/livekit/token` — requires auth (actor/director)
- Endpoint: `GET /api/livekit/broadcast-token/:roomId` — public, subscribe-only

### Canvas Sync
- Each actor's character movements (position, rotation, scale) are broadcast to other participants via LiveKit data messages
- Other actors' characters update in real-time on the canvas
- Broadcast viewers receive the same data messages and see the full canvas state

---

## Backend Architecture

The backend server runs alongside (or proxied through) the Vite dev server.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| ALL | `/api/auth/*` | — | better-auth handler |
| GET | `/api/stories` | Actor, Director | List stories (actor sees assigned only) |
| POST | `/api/stories` | Director | Create story |
| PATCH | `/api/stories/:id` | Director | Update story (status, details) |
| GET | `/api/stories/:id/cast` | Director | List cast assignments |
| POST | `/api/stories/:id/cast` | Director | Assign character to user |
| DELETE | `/api/stories/:id/cast/:castId` | Director | Remove cast assignment |
| GET | `/api/characters` | Director | List available characters |
| POST | `/api/livekit/token` | Actor, Director | Get publisher token |
| GET | `/api/livekit/broadcast-token/:roomId` | Public | Get subscribe-only token |

---

## Frontend Architecture

- **React 19** + **TypeScript**
- **TanStack Router** — file-based routing with `beforeLoad` auth guards
- **Konva / react-konva** — interactive canvas for character manipulation
- **@livekit/components-react** — LiveKit room/participant UI components
- **Tailwind CSS v4** + **DaisyUI v5** — styling with semantic tokens and dark/light mode support
- **clsx + tailwind-merge** — conditional class composition via `cn()` (`src/lib/cn.ts`)
- **Drizzle ORM** — type-safe PostgreSQL schema and queries

### Character Interaction (existing)
- **Drag** — move character around canvas
- **Double-click / double-tap** — horizontal mirror (flip `scaleX`)
- **Two-finger touch** — rotate + pan simultaneously
- **Mouse down** — brings character to top (z-index)

### Canvas Sync (new)
- On each character state change, the actor publishes a data message via LiveKit
- All participants (including viewers) receive and apply remote character states

---

## Tech Stack Summary

| Concern | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript |
| Routing | TanStack Router |
| Canvas | Konva + react-konva |
| Styling | Tailwind CSS v4 + DaisyUI v5 + clsx/tailwind-merge |
| Authentication | better-auth (email/password) |
| Real-time session | LiveKit |
| Database | PostgreSQL via Drizzle ORM |
| Build tool | Vite 7 |

---

## Out of Scope

- Social login (OAuth, magic links)
- Chat or text messaging between actors
- Story scripting or scene management (title + cast only)
- Recording or replay of performances
- Multiple characters per user
