# Landing Page Refactor — Design Spec

**Date:** 2026-03-12
**Status:** Approved

## Overview

Refactor the app's default route from an auth-gated stories list to a public landing page that showcases all stories. Move the login page to `/auth`. Add a blank `/show/$storyId` route stub.

## Route Changes

| Route | File | Auth | Description |
|---|---|---|---|
| `/` | `src/routes/index.tsx` | Public | New landing page with stories grid |
| `/auth` | `src/routes/auth.tsx` | Public | Current login page, moved from `/login` |
| `/show/$storyId` | `src/routes/show/$storyId.tsx` | Public | Blank stub for future show viewer |
| `/_app/` | `src/routes/_app/index.tsx` | Auth | Redirects to `/stories` |

The old `/login` route (`src/routes/login.tsx`) is deleted.

## Data Layer

**New server function:** `listPublicStories` in `src/lib/stories.fns.ts`

- No authentication required
- Returns: `id`, `title`, `status` for all stories, ordered by `createdAt` ascending
- Separate from existing `listStories` (which remains auth-gated and returns cast/scene counts)

## Landing Page (`/`)

**Layout:**
- Full-page public view, no sidebar (lives outside `_app` layout)
- Top bar: brand name `"potmagic"` on the left (intentional display name, matching the existing login page); "Sign In" button (links to `/auth`) on the top right
- Responsive story grid: 1 col → 2 col (sm) → 3 col (lg) → 4 col (xl), matching existing grid breakpoints

**Story cards (inlined in `index.tsx`, no new component file):**
- Show: story title + status badge only
- Status badge uses existing DaisyUI badge styles: `badge-warning` (draft), `badge-success` (active), `badge-neutral` (ended)
- Cards with `status === 'active'`: show a "View Show" button → navigates to `/show/$storyId`
- Cards with `draft` or `ended` status: no action button

**Loading/empty states:**
- Loading: spinner with "Loading…" text
- Empty: centered placeholder message

## Auth Page (`/auth`)

Identical to current `src/routes/login.tsx`. Only the file path and route change. Two updates required inside the file:
- All internal links referencing `/login` updated to `/auth`
- After successful sign-in and registration, `router.navigate({ to: '/' })` updated to `router.navigate({ to: '/stories' })` so authenticated users land on their stories list, not the public landing

## Show Route (`/show/$storyId`)

Public — no auth guard. Blank stub: `createFileRoute('/show/$storyId')` with an empty component returning `null`. No `beforeLoad`. Requires creating the `src/routes/show/` directory.

## `_app` Index

`src/routes/_app/index.tsx` replaced with a TanStack Router `beforeLoad` redirect:

```ts
beforeLoad: () => { throw redirect({ to: '/stories' }) }
```

Do not use a component-based redirect — it would flash content and break SSR.

## What Does Not Change

- Existing `listStories` server function and all authenticated story management
- `StoryCard` component (used only in authenticated routes)
- All `_app/*` routes and layouts
- Login form components (`LoginForm`, `RegisterForm`, `ForgotPasswordForm`)
