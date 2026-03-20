import { createFileRoute } from '@tanstack/react-router';
import { Ruler } from 'lucide-react';

export const Route = createFileRoute('/docs/size-guidelines')({
  head: () => ({ meta: [{ title: 'Size Guidelines — potmagic: Live Story Theater' }, { name: 'description', content: 'Recommended sizes and dimensions for character, background, and prop assets on the potmagic stage.' }] }),
  component: SizeGuidelinesPage,
});

function SizeGuidelinesPage() {
  return (
    <div className="space-y-10">

      <div>
        <div className="mb-4 flex items-center gap-3">
          <Ruler className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Size Guidelines</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          Follow these guidelines when preparing prop assets to ensure characters and backgrounds
          look great on the stage canvas.
        </p>
      </div>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">Stage Canvas</h2>
        <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-display text-3xl font-bold text-primary">1280 × 720</span>
            <span className="text-base-content/50 text-sm">px (16:9)</span>
          </div>
          <p className="text-base-content/60 text-sm leading-relaxed">
            The stage is fixed at 1280 × 720 pixels regardless of screen size. All positions and
            dimensions for props are relative to this coordinate space.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">Character Props</h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          {[
            {
              label: 'Recommended size',
              value: '200 – 400 px tall',
              desc: 'Characters shorter than 200 px may be hard to see; taller than 400 px may dominate the stage.',
            },
            {
              label: 'Aspect ratio',
              value: 'Any',
              desc: 'Characters are displayed at their native size. No automatic scaling is applied.',
            },
            {
              label: 'File format',
              value: 'PNG or WebP',
              desc: 'Use transparent backgrounds (PNG or WebP with alpha) for clean character cutouts.',
            },
            {
              label: 'Max file size',
              value: '2 MB',
              desc: 'Keep files small for fast loading on stage join. Compress assets before uploading.',
            },
          ].map(({ label, value, desc }) => (
            <div key={label} className="flex items-start gap-4 px-5 py-4">
              <div className="w-40 shrink-0">
                <p className="font-display text-sm font-semibold">{label}</p>
                <p className="text-primary text-sm font-medium">{value}</p>
              </div>
              <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">Background Props</h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          {[
            {
              label: 'Recommended size',
              value: '1280 × 720 px',
              desc: 'Match the stage dimensions exactly for a full-bleed background. Wider images allow horizontal scrolling by the director.',
            },
            {
              label: 'Position',
              value: 'Bottom-anchored',
              desc: 'Backgrounds are pinned to the bottom of the canvas. Only horizontal dragging is allowed.',
            },
            {
              label: 'File format',
              value: 'PNG, WebP, or JPG',
              desc: 'JPG is suitable for photographic backgrounds without transparency requirements.',
            },
            {
              label: 'Max file size',
              value: '4 MB',
              desc: 'Backgrounds are shared with all participants — keep them compressed to reduce load times.',
            },
          ].map(({ label, value, desc }) => (
            <div key={label} className="flex items-start gap-4 px-5 py-4">
              <div className="w-40 shrink-0">
                <p className="font-display text-sm font-semibold">{label}</p>
                <p className="text-primary text-sm font-medium">{value}</p>
              </div>
              <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">Rive Animations</h2>
        <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
          <p className="text-base-content/60 text-sm leading-relaxed">
            Rive files (<code className="bg-base-300 rounded px-1 py-0.5 text-xs">.riv</code>) are
            rendered at their exported artboard size. Export artboards at 1× scale. State machine
            names and artboard names must match the values set in the prop assignment panel.
            Keep Rive files under <strong className="text-base-content">1 MB</strong> where possible.
          </p>
        </div>
      </section>

    </div>
  );
}
