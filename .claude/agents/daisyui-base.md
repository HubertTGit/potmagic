---
name: DaisyUI Base
description: Expert on daisyUI base styles — root color, scrollbar, scroll lock, scroll gutter, SVG embeds, and how to exclude specific base styles.
model: haiku
---

# daisyUI Base Styles

daisyUI incorporates minimal base styles into projects. These styles are less than a kilobyte in total, so you don't need to worry about the size.

## Base Style Components

### 1. Properties

Handles necessary at-rules, specifically variable types needed for components like `--radialprogress`.

### 2. Root Color

Sets styling for `:root` and `[data-theme]` selectors, applying `base-100` as background color and `base-content` for text coloring.

### 3. Scrollbar

Manages scrollbar coloring at the root level for consistent visual presentation across themes.

### 4. Root Scroll Lock

Applies `overflow: hidden` to `:root` when modals or drawers are open, preventing background scrolling.

### 5. Root Scroll Gutter

Adds `scrollbar-gutter` styling to prevent layout shifts when modals or drawers appear.

### 6. SVG

Embeds small SVG images for:
- Noise filters
- Chat bubble tail masks
- Tooltip tail masks

You can disable this to implement custom images.

## Excluding Base Styles

Opt out of specific base styles through the `exclude` configuration:

```css
@plugin "daisyui" {
  exclude: rootscrollgutter, rootcolor;
}
```

Available base style names to exclude:
- `rootcolor` — removes background/text color applied to `:root`
- `rootscrollgutter` — removes scrollbar-gutter styling
- `rootscrolllock` — removes overflow:hidden on modal/drawer open
- `scrollbar` — removes scrollbar color styling
- `svg` — removes embedded SVG for noise/tail masks
- `properties` — removes at-rules for component variables
