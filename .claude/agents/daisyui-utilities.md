---
name: DaisyUI Utilities
description: Expert on daisyUI utility classes — color utilities, border radius tokens, glass effect, theme CSS variables, and component-specific variables.
model: haiku
---

# daisyUI Utility Classes and CSS Variables

## Color Utility Classes

daisyUI extends Tailwind CSS with color utilities for all theme colors. Apply colors using standard Tailwind patterns:

```html
<div class="bg-primary text-primary-content">Primary</div>
<div class="bg-secondary text-secondary-content">Secondary</div>
<div class="bg-accent text-accent-content">Accent</div>
<div class="bg-neutral text-neutral-content">Neutral</div>
<div class="bg-base-100 text-base-content">Base</div>
<div class="bg-info text-info-content">Info</div>
<div class="bg-success text-success-content">Success</div>
<div class="bg-warning text-warning-content">Warning</div>
<div class="bg-error text-error-content">Error</div>
```

Opacity modifiers: `bg-primary/60` applies 60% opacity.

## Border Radius System

daisyUI provides three tokenized border-radius values that scale with themes:

| Class | Variable | Purpose |
|-------|----------|---------|
| `rounded-box` | `var(--radius-box)` | Large components (cards, modals, alerts) |
| `rounded-field` | `var(--radius-field)` | Medium components (buttons, inputs, tabs) |
| `rounded-selector` | `var(--radius-selector)` | Small components (checkboxes, toggles, badges) |

```html
<div class="rounded-box p-4">Card-like rounding</div>
<button class="btn rounded-field">Button rounding</button>
<input class="checkbox rounded-selector" type="checkbox" />
```

## Glass Effect

The `glass` utility creates a frosted glass effect:

```html
<div class="glass p-6">Frosted glass element</div>
```

## Theme CSS Variables

Core theme variables that control the design system:

### Color Variables
```css
--color-primary
--color-primary-content
--color-secondary
--color-secondary-content
--color-accent
--color-accent-content
--color-neutral
--color-neutral-content
--color-base-100
--color-base-200
--color-base-300
--color-base-content
--color-info
--color-info-content
--color-success
--color-success-content
--color-warning
--color-warning-content
--color-error
--color-error-content
```

### Sizing Variables
```css
--size-selector   /* controls small component scale */
--size-field      /* controls medium component scale */
--radius-selector /* corner roundness for small components */
--radius-field    /* corner roundness for medium components */
--radius-box      /* corner roundness for large components */
```

### Effect Variables
```css
--border   /* component border width */
--depth    /* enables depth/shadow effects (0 or 1) */
--noise    /* enables noise texture effect (0 or 1) */
```

## Component-Specific Variables

Advanced customization uses internal variables like `--alert-color`, `--btn-color`, `--input-color`. These can be overridden inline:

```html
<div class="alert [--alert-color:blue]">Custom alert color</div>
```

Or via CSS:
```css
.my-component {
  --btn-color: var(--color-accent);
}
```

> Note: Component-specific variables are not semantically versioned and may change in minor updates.
