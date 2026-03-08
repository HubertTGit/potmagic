---
name: tailwind-dark-mode
description: Use when implementing dark/light mode toggling with Tailwind CSS, adding a theme switcher, using dark: utilities, or setting up manual dark mode with class or data attribute selectors instead of system preference.
---

# Tailwind Dark Mode

## Overview

Tailwind supports dark mode via `dark:` utilities. By default it uses the OS `prefers-color-scheme` media query. For manual toggling, override with `@custom-variant`.

Source: https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually

## Quick Reference

| Approach | CSS Setup | HTML Trigger |
|----------|-----------|--------------|
| CSS class | `@custom-variant dark (&:where(.dark, .dark *));` | `<html class="dark">` |
| Data attribute | `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` | `<html data-theme="dark">` |
| System (default) | Nothing needed | OS preference |

## Setup: CSS Class Toggle

**app.css**
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

**HTML**
```html
<html class="dark">
  <body>
    <div class="bg-white dark:bg-black">...</div>
  </body>
</html>
```

## Setup: Data Attribute Toggle

**app.css**
```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

**HTML**
```html
<html data-theme="dark">
  <body>
    <div class="bg-white dark:bg-black">...</div>
  </body>
</html>
```

## Three-Way Toggle (Light / Dark / System)

Persist preference in `localStorage`, fall back to system when unset.

**On page load (place before first paint to avoid flash):**
```javascript
document.documentElement.classList.toggle(
  "dark",
  localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
);
```

**User actions:**
```javascript
// Force light
localStorage.theme = "light";
document.documentElement.classList.remove("dark");

// Force dark
localStorage.theme = "dark";
document.documentElement.classList.add("dark");

// Follow system
localStorage.removeItem("theme");
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `@custom-variant` in CSS | Required when using class/data-attribute mode |
| Only toggling class without persisting | Use `localStorage` to survive page reloads |
| Running toggle script after DOM load | Must run before first paint to avoid flash |
| Using `dark-mode: class` (v3 syntax) | v4 uses `@custom-variant dark` in CSS |
