import { createFileRoute } from "@tanstack/react-router";
import { Ruler, ArrowLeftRight } from "lucide-react";
import { useRef } from "react";

const BASE_URL = 'https://potmagic.com';

export const Route = createFileRoute("/($lang)/docs/size-guidelines")({
  head: () => ({
    meta: [
      { title: "Size Guidelines — potmagic: Live Story Theater" },
      { name: "description", content: "Recommended sizes and dimensions for character, background, and prop assets on the potmagic stage." },
    ],
    links: [
      { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/docs/size-guidelines` },
      { rel: 'alternate', hrefLang: 'de', href: `${BASE_URL}/de/docs/size-guidelines` },
    ],
  }),
  component: SizeGuidelinesPage,
});

function PanDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const s = useRef({ dragging: false, startX: 0, panX: 0 });

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  function applyPan(panX: number) {
    const inner = innerRef.current;
    const outer = containerRef.current;
    const thumb = thumbRef.current;
    if (!inner || !outer) return;
    const maxPan = -(inner.offsetWidth - outer.offsetWidth);
    const clamped = clamp(panX, maxPan, 0);
    s.current.panX = clamped;
    inner.style.transform = `translateX(${clamped}px)`;
    // Update scrollbar thumb: viewport is 64% of total (1280/2000)
    if (thumb && maxPan < 0) {
      const ratio = clamped / maxPan; // 0 → 1
      thumb.style.left = `${ratio * 36}%`; // 36 = 100 - 64 (thumb width)
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    s.current.dragging = true;
    s.current.startX = e.clientX - s.current.panX;
    e.preventDefault();
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!s.current.dragging) return;
    applyPan(e.clientX - s.current.startX);
  }
  function onMouseUp() {
    s.current.dragging = false;
  }

  function onTouchStart(e: React.TouchEvent) {
    s.current.dragging = true;
    s.current.startX = e.touches[0].clientX - s.current.panX;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!s.current.dragging) return;
    applyPan(e.touches[0].clientX - s.current.startX);
  }
  function onTouchEnd() {
    s.current.dragging = false;
  }

  return (
    <div className="mt-5 space-y-2">
      {/* Stage viewport */}
      <div
        ref={containerRef}
        className="border-base-300 relative mx-auto h-62.5 w-full cursor-grab overflow-hidden rounded-xl border select-none active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Inner: 2000 / 1280 = 156.25% wide */}
        <div
          ref={innerRef}
          className="relative h-full w-[156.25%] bg-[url('/panable-image.png')] bg-cover bg-top"
        >
          {/* Viewport boundary at 64% (1280 / 2000) */}
          <div className="absolute top-0 left-[64%] h-full border-l-2 border-dashed border-white/60">
            <span className="absolute top-0 left-0 -translate-x-1/2 rounded-b-md bg-black/30 px-1.5 py-0.5 font-mono text-[9px] whitespace-nowrap text-white backdrop-blur-sm">
              viewport edge
            </span>
          </div>

          {/* Dimension labels */}
          <div className="absolute top-2.5 left-[2%] font-mono text-[9px] text-white/70 drop-shadow">
            ← 1280 px (stage viewport)
          </div>
          <div className="absolute top-2.5 left-[66%] font-mono text-[9px] text-white/50 drop-shadow">
            +720 px (pan area) →
          </div>

          {/* Drag hint pill */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-sm">
              <ArrowLeftRight className="size-3 text-white/70" />
              <span className="text-[10px] font-medium text-white/80">
                drag to pan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollbar indicator */}
      <div className="bg-base-300 relative h-1 overflow-hidden rounded-full">
        {/* Thumb width = 64% (1280/2000) */}
        <div
          ref={thumbRef}
          className="bg-primary/50 absolute top-0 left-0 h-full w-[64%] rounded-full"
        />
      </div>

      <div className="text-base-content/30 flex justify-between font-mono text-[10px]">
        <span>1280 px viewport</span>
        <span>2000 px background (example)</span>
      </div>
    </div>
  );
}

function SizeGuidelinesPage() {
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Ruler className="text-primary size-7" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Size Guidelines
          </h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          Follow these guidelines when preparing prop assets to ensure
          characters and backgrounds look great on the stage canvas.
        </p>
      </div>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">
          Stage Canvas
        </h2>
        <div className="w-full max-w-sm">
          <div className="border-base-content/30 flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed">
            <span className="font-display text-primary text-2xl font-bold">
              1280 × 720 px
            </span>
            <span className="text-base-content/50 text-sm">16:9</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">
          Character Props
        </h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          {[
            {
              label: "Recommended size",
              value: "200 – 400 px tall",
              desc: "Characters shorter than 200 px may be hard to see; taller than 400 px may dominate the stage.",
            },
            {
              label: "Aspect ratio",
              value: "Any",
              desc: "Characters are displayed at their native size. No automatic scaling is applied.",
            },
            {
              label: "File format",
              value: "PNG or WebP",
              desc: "Use transparent backgrounds (PNG or WebP with alpha) for clean character cutouts.",
            },
            {
              label: "Max file size",
              value: "2 MB",
              desc: "Keep files small for fast loading on stage join. Compress assets before uploading.",
            },
          ].map(({ label, value, desc }) => (
            <div key={label} className="flex items-start gap-4 px-5 py-4">
              <div className="w-40 shrink-0">
                <p className="font-display text-sm font-semibold">{label}</p>
                <p className="text-primary text-sm font-medium">{value}</p>
              </div>
              <p className="text-base-content/60 text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">
          Background Props
        </h2>
        <PanDemo />
        <div className="bg-base-100 border-base-300 divide-base-300 mt-4 divide-y rounded-2xl border">
          {[
            {
              label: "Recommended size",
              value: "1280 × 720 px",
              desc: "Matches the stage exactly for full-bleed coverage. For panning scenes, use a wider image — e.g. 2000 × 720 px. Backgrounds are automatically pannable; actors and the director can drag them horizontally to reveal off-screen areas.",
            },
            {
              label: "Position",
              value: "Bottom-anchored",
              desc: "Backgrounds are pinned to the bottom of the canvas. Only horizontal dragging is allowed.",
            },
            {
              label: "File format",
              value: "PNG, WebP, or JPG",
              desc: "JPG is suitable for photographic backgrounds without transparency requirements.",
            },
            {
              label: "Max file size",
              value: "4 MB",
              desc: "Backgrounds are shared with all participants — keep them compressed to reduce load times.",
            },
          ].map(({ label, value, desc }) => (
            <div key={label} className="flex items-start gap-4 px-5 py-4">
              <div className="w-40 shrink-0">
                <p className="font-display text-sm font-semibold">{label}</p>
                <p className="text-primary text-sm font-medium">{value}</p>
              </div>
              <p className="text-base-content/60 text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">
          Rive Animations
        </h2>
        <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
          <p className="text-base-content/60 text-sm leading-relaxed">
            Rive files (
            <code className="bg-base-300 rounded px-1 py-0.5 text-xs">
              .riv
            </code>
            ) are rendered at their exported artboard size. Export artboards at
            1× scale. State machine names and artboard names must match the
            values set in the prop assignment panel. Keep Rive files under{" "}
            <strong className="text-base-content">1 MB</strong> where possible.
          </p>
        </div>
      </section>
    </div>
  );
}
