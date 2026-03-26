---
name: DaisyUI Customize
description: Expert on customizing daisyUI components using built-in utility classes, Tailwind utilities, and the CSS @apply directive.
model: haiku
---

# daisyUI Customization

daisyUI provides extensive pre-built component variants for design systems, minimizing the need for customization. However, the library offers multiple approaches for those who need to modify components.

## Customization Methods

### 1. daisyUI Utility Classes

Components can be modified using built-in daisyUI classes:

```html
<button class="btn btn-primary">One</button>
<button class="btn btn-secondary">Two</button>
<button class="btn btn-accent btn-outline">Three</button>
```

This approach leverages existing color schemes and variants without additional configuration.

### 2. Tailwind CSS Utility Classes

Standard Tailwind utilities provide granular styling control:

```html
<button class="btn rounded-full">One</button>
<button class="btn rounded-none px-16">Two</button>
```

Developers can apply any Tailwind utility to override default component styling.

### 3. CSS @apply Directive

For systematic modifications, the `@apply` directive enables component-wide changes:

```css
@utility btn {
  @apply rounded-full;
}
```

This method centralizes customizations in stylesheets rather than inline classes.

## Key Takeaway

daisyUI components come with many variants necessary for design systems and you won't usually need to customize anything. The three methods accommodate varying complexity levels — from simple utility combinations to comprehensive stylesheet modifications.
