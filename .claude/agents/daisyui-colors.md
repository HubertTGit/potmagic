---
name: DaisyUI Colors
description: Expert on daisyUI semantic color system — color names, CSS variables, utility classes, and opacity modifiers for theme-aware styling.
model: haiku
---

# daisyUI Colors

Rather than using constant Tailwind color utility classes like `bg-green-500` or `bg-orange-600`, daisyUI recommends semantic color utility classes such as `bg-primary`, `bg-secondary`, and `bg-accent`.

Each color name contains CSS variables, and themes apply color values to utility classes when activated.

## Benefits of Semantic Colors

- **Automatic dark mode support** without adding extra class names
- **Zero maintenance cost** when adding new themes
- **Fast development** and easy theme switching
- **Consistency** across the design system
- **Unlimited themes** instead of being restricted to light/dark variants

## Core Color Names

| Color | CSS Variable | Purpose |
|-------|-------------|---------|
| `primary` | `--color-primary` | Main brand color |
| `primary-content` | `--color-primary-content` | Text color on primary backgrounds |
| `secondary` | `--color-secondary` | Secondary brand color |
| `secondary-content` | `--color-secondary-content` | Text color on secondary backgrounds |
| `accent` | `--color-accent` | Accent brand color |
| `accent-content` | `--color-accent-content` | Text color on accent backgrounds |
| `neutral` | `--color-neutral` | Unsaturated UI elements |
| `neutral-content` | `--color-neutral-content` | Text color on neutral backgrounds |
| `base-100` | `--color-base-100` | Primary page background |
| `base-200` | `--color-base-200` | Elevated surface color |
| `base-300` | `--color-base-300` | Higher elevation color |
| `base-content` | `--color-base-content` | Default text color |
| `info` | `--color-info` | Informational messages |
| `success` | `--color-success` | Success/safe messages |
| `warning` | `--color-warning` | Warning/caution messages |
| `error` | `--color-error` | Error/danger messages |

## Usage Examples

Component modifier classes apply colors automatically:

```html
<button class="btn btn-primary">Button</button>
<input type="checkbox" class="checkbox checkbox-secondary" />
```

Utility classes work with color names:

```html
<div class="bg-primary">Primary background</div>
<div class="text-secondary">Secondary text</div>
<div class="border-accent">Accent border</div>
```

## Opacity Modifiers

Colors support opacity values using the format `{COLOR_NAME}/{OPACITY}`:

```html
<div class="bg-primary/50">50% opacity primary background</div>
<div class="text-base-content/70">70% opacity base text</div>
```

With the Tailwind plugin, any value 0-100 works. CDN versions support: 10, 20, 30, 40, 50, 60, 70, 80, 90.

## Available Utility Classes

- `bg-{COLOR}`, `text-{COLOR}`, `border-{COLOR}`
- `from-{COLOR}`, `via-{COLOR}`, `to-{COLOR}` (gradients)
- `ring-{COLOR}`, `fill-{COLOR}`, `stroke-{COLOR}`
- `shadow-{COLOR}`, `outline-{COLOR}`, `divide-{COLOR}`
- `accent-{COLOR}`, `caret-{COLOR}`, `decoration-{COLOR}`
- `placeholder-{COLOR}`, `ring-offset-{COLOR}`
