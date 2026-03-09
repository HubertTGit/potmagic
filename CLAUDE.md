# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # TypeScript check + production build
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## Architecture

**honeypotmagic** is a React + Konva canvas app for interactively manipulating character images (drag, rotate, mirror).

### Tech Stack
- **React 19** + **TypeScript 5** — UI
- **Konva / react-konva** — 2D canvas rendering and interaction
- **Vite 7** — build tool
- **Tailwind CSS v4** + Sass — styling

### Component Structure

- `App.tsx` — root; loads bear/crocodile assets, passes them to `StageComponent`
- `components/stage.component.tsx` — Konva `Stage` + `Layer`; uses `useWindowSize` to fill the viewport; renders one `DraggableCharacter` per image
- `components/draggable-character.component.tsx` — the core interactive element:
  - Konva `Image` with drag enabled
  - Two-finger touch → rotate + pan simultaneously
  - Double-click / double-tap → horizontal mirror (negative `scaleX`)
  - `mousedown` / `touchstart` → move node to top (z-index)
  - Uses refs + `layer.batchDraw()` for performance

### Hooks
- `useWindowSize` — window dimensions, updates on resize (responsive canvas)
- `useTheme` — light/dark toggle, persists to `localStorage`, defaults to system preference

### Key Patterns
- Konva nodes are manipulated imperatively via refs (not React state) for performance
- Multi-touch angles/midpoints are computed manually from `TouchEvent` coordinates
- `scaleX` sign flip is used for mirroring (preserves absolute scale magnitude)
- Characters are initially positioned at `x: 100 + index * 200, y: 100`
