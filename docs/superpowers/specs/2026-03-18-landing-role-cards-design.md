# Landing Page — Role-Based Cards Section

**Date:** 2026-03-18
**Status:** Approved (post-review)

## Goal

Enrich the existing landing page (`src/routes/index.tsx`) with a "Who is it for?" section below the hero. The section uses three DaisyUI cards — one per role — each paired with a storybook concept illustration and short copy drawn from `docs/concept.md`.

## Page Structure

```
LandingNavbar
<main>
  Hero (unchanged inner content)
  ─────── DaisyUI divider (decorative, no label) ───────
  Who is it for? (3 role cards)
</main>
LandingFooter
```

### `<main>` restructuring

The existing `<main className="flex flex-1 items-center">` must be changed. The `items-center` and `flex-1` only make sense when the hero is the sole content. Replace with:

```tsx
<main className="flex-1">
  {/* Hero */}
  <section className="flex items-center py-16">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* existing hero content unchanged */}
    </div>
  </section>

  {/* Divider */}
  <div className="divider mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" />

  {/* Role cards */}
  <section className="py-16">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* cards content */}
    </div>
  </section>
</main>
```

## Role Cards Section

### Section heading

```tsx
<h2 className="font-display text-3xl text-center mb-10">Who is it for?</h2>
```

### Card grid

```tsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
  {/* three cards */}
</div>
```

### Cards

| Card | Image | Alt text | Role |
|------|-------|----------|------|
| 1 | `/concept1.png` | `"Red Riding Hood walks through the deep forest with the wolf nearby"` | The Director |
| 2 | `/concept2.png` | `"Red Riding Hood arrives at grandmother's cottage bedroom"` | The Actor |
| 3 | `/concept3.png` | `"A huntsman with dogs approaches a glowing cottage in the forest"` | The Audience |

### Card anatomy (DaisyUI)

```tsx
<div className="card bg-base-100 border border-base-300 hover:shadow-md transition-shadow duration-200">
  <figure>
    <img
      src="/concept1.png"
      alt="Red Riding Hood walks through the deep forest with the wolf nearby"
      className="aspect-video w-full object-cover"
      loading="lazy"
    />
  </figure>
  <div className="card-body">
    <h3 className="card-title font-display">The Director</h3>
    <ul className="space-y-2 text-sm text-base-content/70">
      <li className="flex items-start gap-2"><Icon className="size-4 text-accent mt-0.5 shrink-0" /> description</li>
    </ul>
  </div>
</div>
```

### Bullet points with icons

**The Director** (concept1):

| Icon (Lucide) | Copy |
|---------------|------|
| `Layers` | Design scenes and set the atmosphere |
| `Package` | Curate characters and virtual props |
| `UserPlus` | Cast actors and send secure invite links |
| `Sliders` | Orchestrate the show live as it unfolds |

**The Actor** (concept2):

| Icon (Lucide) | Copy |
|---------------|------|
| `Link` | Enter your role via a unique invitation link |
| `Move` | Control your character's movement on stage |
| `Mic` | Perform with live voice from anywhere |
| `Sparkles` | React to audience energy in real time |

**The Audience** (concept3):

| Icon (Lucide) | Copy |
|---------------|------|
| `Eye` | Watch the live performance via a public link |
| `Smile` | Send emoji reactions during the show |
| `Globe` | Experience live collaborative theatre from anywhere |
| `Heart` | Connect with stories told by real people |

> Note: Audience interactivity (voting, sound effects) is an aspirational roadmap feature not yet implemented. Bullets above are scoped to what the platform currently supports (public broadcast + emoji reactions) plus the core value proposition.

## Styling

- No inline styles; Tailwind utility classes only
- Colors: DaisyUI semantic tokens (`bg-base-100`, `border-base-300`, `text-base-content`, `text-accent`)
- Divider: `<div className="divider" />` — decorative horizontal rule, no label text
- Bullet icons: Lucide at `size-4 text-accent mt-0.5 shrink-0` (shrink-0 prevents icon squeeze on long text)
- Card hover: `hover:shadow-md transition-shadow duration-200`
- Section heading spacing: `mb-10` between heading and card grid
- Images: `loading="lazy"` on all three (below the fold)

## Constraints

- Single file change: `src/routes/index.tsx` only
- No new components — inline within `LandingPage` function
- Images already exist in `public/` — reference as `/concept1.png` etc.
- Must pass existing `pnpm lint` with no errors
- Icons imported from `lucide-react` (already a project dependency)
