# daisyUI Official Theming Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove manual `[data-theme]` CSS variable blocks from `src/index.css` and let daisyUI's built-in `light` and `dark` themes provide the semantic color tokens.

**Architecture:** The `@plugin "daisyui"` directive already defaults to enabling the built-in `light` and `dark` themes. The custom CSS blocks (lines 12–56) override those built-in colors with a custom blue-toned palette. Deleting those blocks restores daisyUI's native palette. No other files need changes.

**Tech Stack:** Tailwind CSS v4, daisyUI v5

---

## Chunk 1: Remove custom theme blocks

### Task 1: Delete `[data-theme]` CSS blocks

**Files:**
- Modify: `src/index.css:12-56`

- [ ] **Step 1: Delete lines 12–56 from `src/index.css`**

Remove the following two blocks entirely (blank line between them included):

```css
[data-theme="light"] {
  --color-base-100:          oklch(100% 0 0);
  --color-base-200:          oklch(96% 0.002 264.542);
  --color-base-300:          oklch(91% 0.004 264.542);
  --color-base-content:      oklch(13% 0.028 261.692);
  --color-primary:           oklch(55% 0.233 277.117);
  --color-primary-content:   oklch(100% 0 0);
  --color-secondary:         oklch(52% 0.046 257.417);
  --color-secondary-content: oklch(100% 0 0);
  --color-accent:            oklch(58% 0.214 259.815);
  --color-accent-content:    oklch(100% 0 0);
  --color-neutral:           oklch(91% 0.004 264.542);
  --color-neutral-content:   oklch(13% 0.028 261.692);
  --color-info:              oklch(65% 0.154 211.53);
  --color-info-content:      oklch(100% 0 0);
  --color-success:           oklch(62% 0.152 181.912);
  --color-success-content:   oklch(100% 0 0);
  --color-warning:           oklch(65% 0.183 55.934);
  --color-warning-content:   oklch(100% 0 0);
  --color-error:             oklch(60% 0.202 349.761);
  --color-error-content:     oklch(100% 0 0);
}

[data-theme="dark"] {
  --color-base-100:          oklch(13% 0.028 261.692);
  --color-base-200:          oklch(21% 0.034 264.665);
  --color-base-300:          oklch(27% 0.033 256.848);
  --color-base-content:      oklch(96% 0.003 264.542);
  --color-primary:           oklch(58% 0.233 277.117);
  --color-primary-content:   oklch(96% 0.018 272.314);
  --color-secondary:         oklch(55% 0.046 257.417);
  --color-secondary-content: oklch(98% 0.003 247.858);
  --color-accent:            oklch(62% 0.214 259.815);
  --color-accent-content:    oklch(97% 0.014 254.604);
  --color-neutral:           oklch(27% 0.033 256.848);
  --color-neutral-content:   oklch(98% 0.002 247.839);
  --color-info:              oklch(78% 0.154 211.53);
  --color-info-content:      oklch(30% 0.056 229.695);
  --color-success:           oklch(77% 0.152 181.912);
  --color-success-content:   oklch(27% 0.046 192.524);
  --color-warning:           oklch(75% 0.183 55.934);
  --color-warning-content:   oklch(26% 0.079 36.259);
  --color-error:             oklch(71% 0.202 349.761);
  --color-error-content:     oklch(28% 0.109 3.907);
}
```

The resulting file should begin with:

```css
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap');
@import "tailwindcss";
@plugin "daisyui";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));


@theme {
  --font-display: 'Lexend', Georgia, serif;
  --color-gold: oklch(78% 0.16 75);
}

/* Login page utilities */
@utility login-bg {
```

- [ ] **Step 2: Verify the dev server compiles without errors**

```bash
pnpm dev
```

Expected: Server starts, no CSS compilation errors in terminal output.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "refactor: use daisyUI built-in light/dark themes instead of custom CSS vars"
```
