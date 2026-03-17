---
name: daisyui-themes
description: Use when creating custom daisyUI themes, enabling or disabling built-in themes, switching between light and dark variants, configuring data-theme attributes, or setting CSS color tokens for a daisyUI v5 project.
---

# daisyUI v5 Themes

## Overview

daisyUI themes set a palette of CSS custom properties (`--color-*`, `--radius-*`, etc.) scoped to a `data-theme` attribute. Built-in themes are enabled via `@plugin "daisyui"`. Custom themes use a separate `@plugin "daisyui/theme"` block.

## Quick Reference

### Theme plugin config

| Option | Values | Effect |
|--------|--------|--------|
| `themes: all` | — | Include all 35 built-in themes |
| `themes: false` | — | Disable all built-in themes |
| `themes: light --default, dark --prefersdark` | space-separated list | Include only named themes with flags |

### Custom theme options

| Property | Values | Description |
|----------|--------|-------------|
| `name` | string | `data-theme` value (required) |
| `default: true` | bool | Applied when no `data-theme` is set |
| `prefersdark: true` | bool | Applied when OS prefers dark |
| `color-scheme` | `light` \| `dark` | Controls scrollbars/native UI chrome |

## Built-in Themes (35)

`light` `dark` `cupcake` `bumblebee` `emerald` `corporate` `synthwave` `retro` `cyberpunk` `valentine` `halloween` `garden` `forest` `aqua` `lofi` `pastel` `fantasy` `wireframe` `black` `luxury` `dracula` `cmyk` `autumn` `business` `acid` `lemonade` `night` `coffee` `winter` `dim` `nord` `sunset` `caramellatte` `abyss` `silk`

## Custom Theme

```css
@import "tailwindcss";

@plugin "daisyui" {
  themes: false;
}

@plugin "daisyui/theme" {
  name: "my-theme-dark";
  default: true;
  color-scheme: dark;

  /* Base layers */
  --color-base-100: oklch(18% 0.02 260);
  --color-base-200: oklch(22% 0.02 260);
  --color-base-300: oklch(27% 0.02 260);
  --color-base-content: oklch(93% 0.01 80);

  /* Brand colors */
  --color-primary: oklch(70% 0.18 75);
  --color-primary-content: oklch(18% 0.08 75);
  --color-secondary: oklch(62% 0.13 300);
  --color-secondary-content: oklch(97% 0.01 300);
  --color-accent: oklch(72% 0.18 350);
  --color-accent-content: oklch(15% 0.04 350);
  --color-neutral: oklch(30% 0.03 260);
  --color-neutral-content: oklch(88% 0.01 260);

  /* Semantic */
  --color-info: oklch(76% 0.12 215);
  --color-info-content: oklch(18% 0.03 215);
  --color-success: oklch(72% 0.15 148);
  --color-success-content: oklch(18% 0.04 148);
  --color-warning: oklch(80% 0.16 75);
  --color-warning-content: oklch(18% 0.06 75);
  --color-error: oklch(65% 0.22 22);
  --color-error-content: oklch(15% 0.05 22);

  /* Shape */
  --radius-selector: 1rem;
  --radius-field: 0.5rem;
  --radius-box: 1rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 0;
  --noise: 0;
}

@plugin "daisyui/theme" {
  name: "my-theme-light";
  color-scheme: light;

  --color-base-100: oklch(98% 0.01 85);
  --color-base-200: oklch(93% 0.02 85);
  --color-base-300: oklch(86% 0.03 85);
  --color-base-content: oklch(22% 0.04 260);
  /* ... other tokens */
}
```

## Applying Themes

```html
<!-- Entire page -->
<html data-theme="my-theme-dark">

<!-- Section override -->
<div data-theme="my-theme-light">...</div>
```

```js
// Toggle at runtime
document.documentElement.setAttribute('data-theme', 'my-theme-dark');
```

## Tailwind dark: Variant

Point `@custom-variant dark` at your dark theme name so `dark:` utilities respond to it:

```css
@custom-variant dark (&:where([data-theme=my-theme-dark], [data-theme=my-theme-dark] *));
```

## OKLCH Color Format

daisyUI v5 uses oklch — the recommended format:

```
oklch(lightness% chroma hue)
  lightness  0–100%     (0 = black, 100 = white)
  chroma     0–0.4      (0 = gray, 0.4 = vivid)
  hue        0–360      (degrees: 0/360=red, 120=green, 240=blue)
```

Examples: `oklch(78% 0.16 75)` = warm amber · `oklch(18% 0.02 260)` = near-black blue-tint

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `themes: all` left in when using custom themes | Set `themes: false` to avoid bundling all 35 built-in themes |
| Using `[data-theme=dark]` in `@custom-variant` after renaming theme | Update to match your custom theme name |
| Missing `color-scheme` property | Required — controls native browser UI chrome (scrollbars, inputs) |
| Forgetting `-content` counterpart | Every color needs a `-content` variant for text on that background |
| Hardcoded hex/rgba in components | Use `var(--color-primary)` / Tailwind classes (`text-primary`) instead |
