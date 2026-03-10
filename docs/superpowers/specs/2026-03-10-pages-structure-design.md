# Pages Structure Design

Date: 2026-03-10

## Overview

Add profile, stories list, story detail, and scene detail pages to honeypotmagic. UI only — no database connections in this phase. Refactor root layout to use a persistent left sidebar.

## Decisions

- **Navigation**: Left sidebar (replacing top-nav-only approach)
- **Stories list**: Table/list view with status badges and action links
- **Story detail**: Tabs separating Cast and Scenes management
- **Scene detail**: Props grouped by type (Backgrounds / Characters)

## Routes & Files

| Route | File | Auth | Description |
|---|---|---|---|
| `/profile` | `src/routes/profile.tsx` | Required | Edit user profile |
| `/stories` | `src/routes/stories/index.tsx` | Required | List all stories |
| `/stories/$storyId` | `src/routes/stories/$storyId/index.tsx` | Required | Story detail with tabs |
| `/stories/$storyId/scenes/$sceneId` | `src/routes/stories/$storyId/scenes/$sceneId/index.tsx` | Required | Scene detail |

Stage (`/stage`) and broadcast (`/broadcast/:roomId`) routes keep full-screen layout with no sidebar.

## Layout

### Sidebar

Persistent left sidebar (~200px wide) on all authenticated routes except stage/broadcast.

Contents (top to bottom):
- App name "honeypotmagic"
- Nav links: Stories, Stage, Director (director role only)
- Bottom: Profile link, theme toggle, Logout

Active link highlighted with left border accent.

### Root Layout Change

`__root.tsx` splits into:
- Sidebar layout (authenticated app pages)
- Full-screen layout (stage, broadcast, login)

## Pages

### Profile (`/profile`)

- Avatar placeholder (circular, initials fallback)
- Editable name field
- Read-only email field
- Role badge (`actor` | `director`)
- Save button (disabled until changed)

### Stories List (`/stories`)

Table layout:

| Title | Status | Actors | Scenes | Actions |
|---|---|---|---|---|
| The Haunted Ballroom | ACTIVE | 3 | 5 | Edit · Delete |

- Status badges: DRAFT (yellow), ACTIVE (green), ENDED (neutral)
- Director only: "+ New Story" button opens inline form or modal (title input + submit)
- Director only: Delete action per row
- Actor view: same table, filtered to stories they are cast in (no add/delete)
- Clicking title or Edit navigates to `/stories/$storyId`

### Story Detail (`/stories/$storyId`)

Header row:
- Editable title input
- Status badge
- Save button (disabled until changed)

Tabs: **Cast** | **Scenes**

**Cast tab:**
- Table: Actor name | Character prop | Remove button
- "+ Add Actor" button → modal with user list (actors only) and character prop selector

**Scenes tab:**
- Ordered list of scenes: `{order}. {title}` with "→ View" link navigating to scene detail
- "+ Add Scene" button → inline input for scene title, appended at end

### Scene Detail (`/stories/$storyId/scenes/$sceneId`)

Header row:
- Editable scene title input
- "Scene N of M" indicator (read-only)
- Save button (disabled until changed)

**Backgrounds section:**
- List of background props: icon thumbnail + name, Remove button per row
- "+ Add Background" button → modal/dropdown selecting from story's background props

**Characters section:**
- Same pattern as backgrounds
- "+ Add Character" button → modal selecting from story's character props

## Mock Data

All pages use hardcoded mock data arrays (no API calls) to demonstrate UI structure. Mock data shaped to match the Drizzle schema types.

## Components

New shared components to extract:
- `StatusBadge` — renders story status with appropriate color
- `PropTypeBadge` — renders prop type (background/character)
- `SidebarLayout` — sidebar + outlet wrapper

## Out of Scope (this phase)

- API/database connections
- Form validation beyond basic disabled-state
- Drag-to-reorder scenes
- Image upload for props/profile avatar
- LiveKit session controls on story page
