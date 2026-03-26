---
name: DaisyUI Layout and Typography
description: Expert on layout and typography with daisyUI — using Tailwind CSS utilities for layout, and the Typography plugin for semantic HTML styling with daisyUI theme compatibility.
model: haiku
---

# daisyUI Layout and Typography

## Layout

Layout, sizing, grids, spacing, etc. are all handled by Tailwind CSS's utility classes. Refer to the Tailwind CSS documentation for:

- Layout utilities (`container`, `columns`, `aspect-ratio`)
- Sizing controls (`w-*`, `h-*`, `min-*`, `max-*`)
- Flexbox (`flex`, `flex-row`, `flex-col`, `justify-*`, `items-*`, `gap-*`)
- Grid systems (`grid`, `grid-cols-*`, `col-span-*`)
- Box alignment
- Spacing (`p-*`, `m-*`, `space-*`)

## Typography

daisyUI integrates with the [TailwindCSS Typography plugin](https://tailwindcss.com/docs/typography-plugin) and ensures all parts are compatible with daisyUI themes.

### Setup

Install the Typography plugin and use the `prose` class:

```html
<article class="prose">
  <h1>Heading 1</h1>
  <p>Paragraph text with <strong>bold</strong> and <em>italic</em>.</p>
  <blockquote>A blockquote</blockquote>
  <ul>
    <li>List item one</li>
    <li>List item two</li>
  </ul>
</article>
```

### Supported Elements

The Typography plugin handles styling for:

- **Headers**: `h1` through `h6`
- **Text formatting**: bold, italic, combined emphasis
- **Blockquotes**: styled quoted content
- **Lists**: ordered and unordered, including nested items
- **Links**: styled anchor elements
- **Images**: responsive image handling
- **Inline code**: `<code>` elements
- **Code blocks**: `<pre><code>` blocks
- **Tables**: structured data tables
- **HR**: horizontal rules

### Theme Color Integration

Use daisyUI color utilities within prose content:

```html
<p class="text-primary">Primary colored text</p>
<p class="text-secondary">Secondary colored text</p>
<span class="text-accent">Accent text</span>
<span class="text-info">Info text</span>
<span class="text-success">Success text</span>
<span class="text-warning">Warning text</span>
<span class="text-error">Error text</span>
```

### Prose Sizes

```html
<article class="prose prose-sm">Small prose</article>
<article class="prose">Base prose (default)</article>
<article class="prose prose-lg">Large prose</article>
<article class="prose prose-xl">Extra large prose</article>
<article class="prose prose-2xl">2XL prose</article>
```
