---
name: DaisyUI Config
description: Expert on daisyUI plugin configuration options — themes, root selector, include/exclude, prefix, and logs settings.
model: haiku
---

# daisyUI Config

daisyUI configuration allows you to customize the plugin's default behavior through CSS directives. Configuration is applied by replacing the semicolon after `@plugin "daisyui"` with curly braces containing your settings.

## Default Configuration

```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
  root: ":root";
  include: ;
  exclude: ;
  prefix: ;
  logs: true;
}
```

## Configuration Options

### `themes`
**Type:** String, comma-separated list, `false`, or `all`
**Default:** `light --default, dark --prefersdark`

Specifies which themes are enabled. Use flags to control behavior:
- `--default`: Sets the theme as the default
- `--prefersdark`: Sets as default for dark mode preference

**Examples:**
- `themes: all;` — Enable all 35 available themes
- `themes: false;` — Disable all themes (useful for custom-only setups)
- `themes: nord --default, abyss --prefersdark;` — Mix and match with specific defaults

### `root`
**Type:** String
**Default:** `":root"`

Defines the CSS selector receiving theme variables. Useful for scoping daisyUI to specific elements like web components or shadow DOM sections.

**Example:** `root: "#my-app";` scopes all variables to that selector.

### `include`
**Type:** Comma-separated list

Specifies which components to bundle. Only listed components are included; all others are excluded.

**Example:** `include: button, input, select;`

### `exclude`
**Type:** Comma-separated list

Removes specific components from the build. Useful for avoiding conflicts with other libraries or opting out of particular features.

**Example:** `exclude: checkbox, footer, glass;`

### `prefix`
**Type:** String
**Default:** Empty string

Adds a prefix to all daisyUI class names. Combine with Tailwind's prefix option if needed — daisyUI classes receive both prefixes.

**Example:** `prefix: "d-";` transforms `btn` to `d-btn`

### `logs`
**Type:** Boolean
**Default:** `true`

Controls console output during build. Set to `false` to suppress daisyUI logs.
