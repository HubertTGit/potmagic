# Landing Page Role Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Who is it for?" role-based cards section below the hero on the landing page, using the three concept illustration images.

**Architecture:** Single-file edit to `src/routes/index.tsx`. Restructure `<main>` from a vertically-centered flex container into a block container with two `<section>` children (hero + cards), separated by a DaisyUI divider. The cards section renders three DaisyUI cards inline — no new components.

**Tech Stack:** React 19, TanStack Start, DaisyUI v5, Tailwind CSS v4, Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-18-landing-role-cards-design.md`

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `src/routes/index.tsx` | Restructure `<main>`, add divider + role cards section |

---

### Task 1: Restructure `<main>` and add role cards section

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Replace the file contents**

Open `src/routes/index.tsx` and replace it entirely with the following:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import {
  Layers,
  Package,
  UserPlus,
  Sliders,
  Link as LinkIcon,
  Move,
  Mic,
  Sparkles,
  Eye,
  Smile,
  Globe,
  Heart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "potmagic" }] }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base-100 text-base-content">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="flex items-center py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">

              {/* Left — copy */}
              <div className="flex flex-col gap-6 lg:flex-1">
                <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                  Live Community Theatre.{" "}
                  <span className="text-base-content/60">Whenever, wherever.</span>
                </h1>
                <p className="max-w-md text-base text-base-content/50 leading-relaxed">
                  Step into the digital spotlight. Perform live interactive stories
                  with your community from anywhere in the world.
                </p>
                <div>
                  <Link
                    to="/auth"
                    search={{ token: undefined }}
                    className="btn btn-accent btn-md font-display px-8 tracking-wide rounded-full"
                  >
                    Join Our Theatre
                  </Link>
                </div>
              </div>

              {/* Right — teaser image */}
              <div className="w-full lg:flex-1">
                <div className="overflow-hidden rounded-2xl border border-base-300 shadow-xl">
                  <img
                    src="/teaser.png"
                    alt="Live community theatre stage"
                    className="w-full object-cover"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="divider" />
        </div>

        {/* Who is it for? */}
        <section className="py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl text-center mb-10">
              Who is it for?
            </h2>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* The Director */}
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
                    <li className="flex items-start gap-2">
                      <Layers className="size-4 text-accent mt-0.5 shrink-0" />
                      Design scenes and set the atmosphere
                    </li>
                    <li className="flex items-start gap-2">
                      <Package className="size-4 text-accent mt-0.5 shrink-0" />
                      Curate characters and virtual props
                    </li>
                    <li className="flex items-start gap-2">
                      <UserPlus className="size-4 text-accent mt-0.5 shrink-0" />
                      Cast actors and send secure invite links
                    </li>
                    <li className="flex items-start gap-2">
                      <Sliders className="size-4 text-accent mt-0.5 shrink-0" />
                      Orchestrate the show live as it unfolds
                    </li>
                  </ul>
                </div>
              </div>

              {/* The Actor */}
              <div className="card bg-base-100 border border-base-300 hover:shadow-md transition-shadow duration-200">
                <figure>
                  <img
                    src="/concept2.png"
                    alt="Red Riding Hood arrives at grandmother's cottage bedroom"
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                  />
                </figure>
                <div className="card-body">
                  <h3 className="card-title font-display">The Actor</h3>
                  <ul className="space-y-2 text-sm text-base-content/70">
                    <li className="flex items-start gap-2">
                      <LinkIcon className="size-4 text-accent mt-0.5 shrink-0" />
                      Enter your role via a unique invitation link
                    </li>
                    <li className="flex items-start gap-2">
                      <Move className="size-4 text-accent mt-0.5 shrink-0" />
                      Control your character's movement on stage
                    </li>
                    <li className="flex items-start gap-2">
                      <Mic className="size-4 text-accent mt-0.5 shrink-0" />
                      Perform with live voice from anywhere
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="size-4 text-accent mt-0.5 shrink-0" />
                      React to audience energy in real time
                    </li>
                  </ul>
                </div>
              </div>

              {/* The Audience */}
              <div className="card bg-base-100 border border-base-300 hover:shadow-md transition-shadow duration-200">
                <figure>
                  <img
                    src="/concept3.png"
                    alt="A huntsman with dogs approaches a glowing cottage in the forest"
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                  />
                </figure>
                <div className="card-body">
                  <h3 className="card-title font-display">The Audience</h3>
                  <ul className="space-y-2 text-sm text-base-content/70">
                    <li className="flex items-start gap-2">
                      <Eye className="size-4 text-accent mt-0.5 shrink-0" />
                      Watch the live performance via a public link
                    </li>
                    <li className="flex items-start gap-2">
                      <Smile className="size-4 text-accent mt-0.5 shrink-0" />
                      Send emoji reactions during the show
                    </li>
                    <li className="flex items-start gap-2">
                      <Globe className="size-4 text-accent mt-0.5 shrink-0" />
                      Experience live collaborative theatre from anywhere
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="size-4 text-accent mt-0.5 shrink-0" />
                      Connect with stories told by real people
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 2: Run lint to verify no errors**

```bash
pnpm lint
```

Expected: no errors or warnings related to `index.tsx`.

- [ ] **Step 3: Run build to verify TypeScript is clean**

```bash
pnpm build
```

Expected: build completes without TypeScript errors.

- [ ] **Step 4: Start dev server and visually verify**

```bash
pnpm dev
```

Open `http://localhost:3000` and confirm:
- Hero section renders unchanged (h1, paragraph, CTA button, teaser image)
- A horizontal divider appears below the hero
- Three cards appear in a row on desktop, stacked on mobile
- Each card has the correct illustration image at the top
- Each card has the role title and 4 bullet points with accent-colored icons
- Hover over each card to confirm shadow transition

- [ ] **Step 5: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: add role-based cards section to landing page"
```
