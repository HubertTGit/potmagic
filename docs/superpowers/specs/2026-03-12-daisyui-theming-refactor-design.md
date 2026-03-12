# daisyUI Official Theming Refactor

**Date:** 2026-03-12
**Status:** Approved

## Problem

`src/index.css` manually defines all daisyUI semantic color variables (`--color-base-100`, `--color-primary`, etc.) inside custom `[data-theme="light"]` and `[data-theme="dark"]` CSS blocks instead of using daisyUI's built-in theme system. This creates unnecessary maintenance overhead and should be replaced with daisyUI's official theming.

## Solution

Remove the manual `[data-theme="light"]` and `[data-theme="dark"]` CSS blocks from `src/index.css`. The `@plugin "daisyui"` directive already defaults to enabling the built-in `light` and `dark` themes (equivalent to `themes: ["light --default", "dark --prefersdark"]`), so removing the blocks hands theme colors back to daisyUI.

## Scope

**One file changed:** `src/index.css`

**Remove:** Lines 12–56 — the `[data-theme="light"]` and `[data-theme="dark"]` CSS variable blocks.

**Keep unchanged:**

- `@plugin "daisyui"` directive (already correct as-is)
- `@custom-variant dark` — infrastructure for `dark:` Tailwind utilities with `data-theme` attribute
- `@theme` block — custom `--font-display` and `--color-gold` tokens
- All `@utility` blocks — `login-bg`, `login-card`, `gold-glow`, `btn-gold`

**No changes to:** `useTheme.ts`, `__root.tsx`, components, or any other files.

## Visual Impact

This is a **deliberate palette change**. The current blocks define a custom blue-toned palette that diverges significantly from daisyUI defaults. Notable differences after removal:

- `secondary` and `accent` shift from blue tones to daisyUI's pink/teal defaults
- `neutral` lightness inverts in the dark theme
- `base` colors lighten slightly in both themes

The `login-bg` and `login-card` utilities use hardcoded dark-palette colors that may look slightly inconsistent with the new lighter daisyUI dark base. These are acceptable given the deliberate scope of this refactor.

## What Does Not Change

The `data-theme` toggling mechanism (localStorage persistence, system preference detection, FOUC prevention script) remains identical.
