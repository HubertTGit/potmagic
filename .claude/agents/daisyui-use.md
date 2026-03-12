---
name: DaisyUI Use
description: Expert on how to use daisyUI component classes — the basic concept, adding component classes to HTML, combining with Tailwind utilities, and available component categories.
model: haiku
---

# How to Use daisyUI

daisyUI is a Tailwind CSS component library that simplifies styling by providing pre-built component classes. Instead of writing lengthy utility class combinations, developers can use semantic component names.

## Basic Concept

### Without daisyUI

Creating a button required multiple utility classes:

```html
<button class="inline-block cursor-pointer rounded-md bg-gray-800 px-4 py-3 text-center text-sm font-semibold uppercase text-white transition duration-200 ease-in-out hover:bg-gray-900">
  Button
</button>
```

### With daisyUI

The same button simplifies to:

```html
<button class="btn">Button</button>
```

## Customization Methods

### Using daisyUI Modifiers

Add variant classes from daisyUI's component library:

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg">Large</button>
```

### Using Tailwind Utilities

Extend components with standard Tailwind CSS classes:

```html
<button class="btn w-64 rounded-full">Wide rounded button</button>
<button class="btn btn-primary mt-4 gap-2">
  <svg>...</svg>
  With icon
</button>
```

## Component Categories (40+ components)

### Actions
`btn`, `dropdown`, `modal`, `swap`, `theme-controller`

### Data Display
`accordion`, `avatar`, `badge`, `card`, `carousel`, `chat`, `collapse`, `countdown`, `diff`, `kbd`, `list`, `stat`, `table`, `timeline`

### Navigation
`breadcrumbs`, `bottom-nav`, `link`, `menu`, `navbar`, `pagination`, `steps`, `tab`

### Feedback
`alert`, `loading`, `progress`, `radial-progress`, `skeleton`, `toast`, `tooltip`

### Data Input
`checkbox`, `fieldset`, `file-input`, `input`, `radio`, `range`, `rating`, `select`, `textarea`, `toggle`

### Layout
`artboard`, `divider`, `drawer`, `footer`, `hero`, `indicator`, `join`, `mask`, `stack`

### Mockup
`browser`, `code`, `phone`, `window`

## Key Principles

- **Semantic Components**: Named classes like `btn`, `card`, `badge` communicate intent
- **Flexible Styling**: Combine daisyUI modifiers with Tailwind utilities freely
- **Reduced Boilerplate**: Minimizes repetitive utility class combinations
- **Theme-Aware**: All components automatically adapt to the active daisyUI theme
