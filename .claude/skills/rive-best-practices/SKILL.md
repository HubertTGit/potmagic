---
name: rive-best-practices
description: Use when working with Rive animations — @rive-app/react-webgl2, @rive-app/canvas, useRive hook, state machines, layouts, asset loading, and the RiveCanvas wrapper pattern used in this project.
---

# Rive Best Practices

Apply these patterns when adding, modifying, or debugging Rive animations in this project.

---

## 1. Package Choice

This project uses **`@rive-app/react-webgl2`** (WebGL2 renderer — hardware-accelerated, best for interactive animations on canvas).

| Package | Renderer | Use when |
|---------|----------|----------|
| `@rive-app/react-webgl2` | WebGL2 | ✅ This project — best performance, GPU-accelerated |
| `@rive-app/canvas` | Canvas 2D | Fallback for environments without WebGL2 |
| `@rive-app/react-canvas` | Canvas 2D | React wrapper for canvas renderer |

---

## 2. Critical: CJS Import Workaround

`@rive-app/react-webgl2` is a **CJS module**. Vite fails with "named export not found" when importing named exports directly. Always destructure from the default export:

```tsx
// ✅ Correct — avoids Vite CJS/ESM mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import pkg from '@rive-app/react-webgl2';
const { useRive, Layout, Fit, Alignment, RiveEventType } = pkg as any;

// ❌ Wrong — Vite will error on named imports from CJS package
import { useRive, Layout, Fit } from '@rive-app/react-webgl2';
```

---

## 3. The `RiveCanvas` Wrapper Pattern (Project Standard)

Rive requires a browser canvas — it **cannot render server-side**. Always wrap with an `isClient` guard:

```tsx
// src/components/rive-canvas.component.tsx — project standard
import pkg from '@rive-app/react-webgl2';
const { useRive, Layout, Fit } = pkg as any;
import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';

function RivePlayer({ src, buffer, className }: {
  src?: string;
  buffer?: ArrayBuffer;
  className?: string;
}) {
  const isCover = className?.includes('object-cover');
  const fit = isCover ? Fit.Cover : Fit.Contain;

  const { RiveComponent } = useRive({
    src,
    buffer,
    artboard: 'potmagicArtboard',
    stateMachines: 'potmagicStateMachine',
    layout: new Layout({ fit }),
    autoplay: true,
  });

  return (
    <div className={cn(className, 'overflow-hidden')}>
      <RiveComponent className="w-full h-full" />
    </div>
  );
}

export function RiveCanvas({ src, buffer, className }: {
  src?: string;
  buffer?: ArrayBuffer;
  className?: string;
}) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) return <div className={className} />;
  return <RivePlayer src={src} buffer={buffer} className={className} />;
}
```

**Key rules:**
- Always split into `RivePlayer` (inner) + `RiveCanvas` (outer with SSR guard)
- The `isClient` guard prevents SSR/hydration crashes in TanStack Start
- Pass `className` through to control sizing — never hardcode dimensions

---

## 4. `useRive` Hook API

```tsx
const { rive, RiveComponent } = useRive({
  // Asset source — use one of:
  src: '/animations/character.riv',   // URL (public/ folder or Vercel Blob URL)
  buffer: arrayBuffer,                 // ArrayBuffer — for dynamic/fetched .riv files

  // State machine (preferred — controls animation via inputs/triggers)
  stateMachines: 'potmagicStateMachine',  // string or string[]

  // Timeline animations (alternative — for simple, non-interactive animations)
  animations: 'idle',                     // string or string[]

  // Layout
  layout: new Layout({
    fit: Fit.Contain,                 // Fit.Contain | Fit.Cover | Fit.Fill | Fit.Layout
    alignment: Alignment.Center,      // Alignment.Center | TopLeft | etc.
  }),

  autoplay: true,                     // start playing immediately

  // Lifecycle callbacks
  onLoad: () => console.log('loaded'),
  onStateChange: (event) => console.log(event),
  onRiveEventReceived: (event) => console.log(event.data),
});
```

### Return values

| Value | Type | Description |
|-------|------|-------------|
| `rive` | `Rive \| null` | Raw Rive instance — null until loaded |
| `RiveComponent` | `React.FC` | Drop-in canvas component — use this to render |
| `canvas` | `HTMLCanvasElement \| null` | The underlying canvas element |

---

## 5. Fit Options

```tsx
import pkg from '@rive-app/react-webgl2';
const { Fit, Layout, Alignment } = pkg as any;

// Fit.Contain  — maintains aspect ratio, fits within bounds (default)
// Fit.Cover    — maintains aspect ratio, fills bounds (may clip)
// Fit.Fill     — stretches to fill, ignores aspect ratio
// Fit.FitWidth — fits to width
// Fit.FitHeight— fits to height
// Fit.Layout   — uses Rive's layout system (for responsive Rive files)
// Fit.None     — renders at native size

const layout = new Layout({
  fit: Fit.Cover,
  alignment: Alignment.Center,  // Center, TopLeft, TopRight, BottomLeft, BottomRight, etc.
});
```

---

## 6. State Machine Inputs

Interact with state machine inputs to control animation state:

```tsx
const { rive, RiveComponent } = useRive({
  src: '/character.riv',
  artboard: 'potmagicArtboard',
  stateMachines: 'potmagicStateMachine',
  autoplay: true,
});

// Get inputs after rive loads
const inputs = rive?.stateMachineInputs('potmagicStateMachine');
const hoverInput = inputs?.find(i => i.name === 'isHover');
const triggerInput = inputs?.find(i => i.name === 'onClick');
const speedInput = inputs?.find(i => i.name === 'speed');

// Boolean input
hoverInput?.value = true;

// Trigger input (fires once)
triggerInput?.fire();

// Number input
speedInput?.value = 2.5;
```

---

## 7. Rive Events

Listen to custom events fired from Rive state machines:

```tsx
const { rive, RiveComponent } = useRive({
  src: '/character.riv',
  artboard: 'potmagicArtboard',
  stateMachines: 'potmagicStateMachine',
  autoplay: true,
  onRiveEventReceived: (riveEvent) => {
    const eventName = riveEvent.data.name;       // event name from Rive editor
    const eventProperties = riveEvent.data.properties; // custom key-value pairs
    console.log('Rive event:', eventName, eventProperties);
  },
});
```

---

## 8. Asset Loading

### From `public/` folder (static assets)
```tsx
<RiveCanvas src="/duck.riv" className="w-32 h-32" />
```

### From Vercel Blob URL (dynamic prop assets)
```tsx
// Props are stored in Vercel Blob under props/ prefix
<RiveCanvas src={prop.imageUrl} className="w-full h-full object-cover" />
```

### From ArrayBuffer (fetched dynamically)
```tsx
const [buffer, setBuffer] = useState<ArrayBuffer>();

useEffect(() => {
  fetch(url)
    .then(r => r.arrayBuffer())
    .then(setBuffer);
}, [url]);

if (buffer) <RiveCanvas buffer={buffer} className="w-32 h-32" />;
```

---

## 9. Sizing & Responsive Layout

```tsx
// ✅ Use Tailwind classes for sizing — never inline styles
<RiveCanvas src="/anim.riv" className="w-full h-64" />
<RiveCanvas src="/anim.riv" className="size-32" />

// ✅ Cover mode — className must include 'object-cover'
// The RiveCanvas component detects this to set Fit.Cover
<RiveCanvas src="/anim.riv" className="w-full h-full object-cover" />

// ✅ Constrained within a sized container
<div className="w-48 h-48">
  <RiveCanvas src="/anim.riv" className="w-full h-full" />
</div>
```

---

## 10. Cleanup

`useRive` handles cleanup automatically when using `RiveComponent`. For manual `Rive` instances (low-level API), always call cleanup:

```tsx
useEffect(() => {
  return () => {
    rive?.cleanup(); // prevent WASM memory leaks
  };
}, [rive]);
```

---

## 11. Low-Level WASM API (rive-wasm / @rive-app/canvas)

Use this only when you need multiple artboards or a custom render loop. Not needed for standard prop animations.

```typescript
import Rive, { Layout, Fit } from '@rive-app/canvas';

const r = new Rive({
  src: '/animation.riv',
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  layout: new Layout({ fit: Fit.Contain }),
  autoplay: true,
  artboard: 'potmagicArtboard',
  stateMachines: 'potmagicStateMachine',
  onLoad: () => {
    r.resizeDrawingSurfaceToCanvas();
  },
});

// Later — always clean up
r.cleanup();
```

---

## 12. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Named imports from `@rive-app/react-webgl2` | Use `import pkg from '...'` + destructure — it's CJS |
| Rendering Rive without `isClient` guard in SSR | Always wrap with `useState(false)` + `useEffect` guard |
| No explicit size on the container | Rive canvas needs a sized parent — use Tailwind `w-*`/`h-*` |
| Forgetting `autoplay: true` | Without it, the animation won't start |
| Using `stateMachines` and `animations` together | Use one or the other — state machines are preferred |
| Not calling `rive.cleanup()` on manual instances | WASM memory leak — always cleanup in `useEffect` return |
| Using `src` with a relative path that doesn't start with `/` | Use absolute paths from `public/` or full Vercel Blob URLs |
| Accessing state machine inputs before `rive` is loaded | `rive` is null until `EventType.Load` fires — check for null |
