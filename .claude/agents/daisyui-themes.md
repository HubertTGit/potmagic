---
name: DaisyUI Themes
description: Expert on daisyUI themes — enabling built-in themes, creating custom themes, nesting themes, and integrating with Tailwind dark mode.
model: haiku
---

# daisyUI Themes

daisyUI includes 35 built-in themes that transform a website's appearance instantly. Users can enable specific themes, create custom ones, or modify existing themes.

## Theme Configuration

### Basic Setup

Themes are managed via the `@plugin "daisyui"` directive in CSS:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

- `--default`: Sets a theme as the default
- `--prefersdark`: Sets a theme as default for dark mode preference

### Enabling Built-in Themes

```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark, cupcake;
}
```

Apply via HTML:
```html
<html data-theme="cupcake"></html>
```

### Enable All Themes

```css
@plugin "daisyui" {
  themes: all;
}
```

### Disable All Themes

```css
@plugin "daisyui" {
  themes: false;
}
```

## Available Themes (35 total)

light, dark, cupcake, bumblebee, emerald, corporate, synthwave, retro, cyberpunk, valentine, halloween, garden, forest, aqua, lofi, pastel, fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade, night, coffee, winter, dim, nord, sunset, caramellatte, abyss, silk

## Section-Specific Themes

Apply themes to specific HTML sections. Themes can be nested without limits:

```html
<html data-theme="dark">
  <div data-theme="light">
    Light theme section
    <span data-theme="retro">Retro theme nested inside</span>
  </div>
</html>
```

## Creating Custom Themes

```css
@plugin "daisyui/theme" {
  name: "mytheme";
  default: true;
  prefersdark: false;
  color-scheme: light;

  --color-base-100: oklch(98% 0.02 240);
  --color-base-200: oklch(93% 0.02 240);
  --color-base-300: oklch(88% 0.02 240);
  --color-base-content: oklch(20% 0.02 240);

  --color-primary: oklch(55% 0.3 240);
  --color-primary-content: oklch(98% 0.01 240);
  --color-secondary: oklch(60% 0.25 200);
  --color-secondary-content: oklch(98% 0.01 200);
  --color-accent: oklch(65% 0.25 160);
  --color-accent-content: oklch(98% 0.01 160);
  --color-neutral: oklch(40% 0.02 240);
  --color-neutral-content: oklch(95% 0.01 240);

  --color-info: oklch(70% 0.2 220);
  --color-success: oklch(70% 0.2 140);
  --color-warning: oklch(75% 0.2 80);
  --color-error: oklch(65% 0.25 25);

  --radius-selector: 0.25rem;
  --radius-field: 0.5rem;
  --radius-box: 1rem;
  --size-selector: 0.25rem;
  --size-field: 0.5rem;
  --border: 1px;
  --depth: 1;
  --noise: 0;
}
```

## Customizing Built-in Themes

Override specific values of existing themes by using the same name:

```css
@plugin "daisyui/theme" {
  name: "light";
  default: true;
  --color-primary: blue;
  --color-secondary: teal;
}
```

Unspecified values inherit from the original theme.

## Theme-Specific Custom Styles

```css
[data-theme="light"] {
  .my-btn {
    background-color: #1EA1F1;
    border-color: #1EA1F1;
  }
  .my-btn:hover {
    background-color: #1C96E1;
    border-color: #1C96E1;
  }
}
```

## Tailwind Dark Mode Integration

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: winter --default, night --prefersdark;
}

@custom-variant dark (&:where([data-theme=night], [data-theme=night] *));
```

```html
<div class="p-10 dark:p-20">
  10px padding on winter, 20px on night theme
</div>
```

## Theme Switching

Use [theme-change](https://github.com/saadeghi/theme-change) to switch themes and persist selections in local storage.
