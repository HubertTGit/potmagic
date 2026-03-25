import { createFileRoute } from "@tanstack/react-router";
import { Ruler, ArrowLeftRight } from "lucide-react";
import { useRef } from "react";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";

const BASE_URL = 'https://potmagic.com';

export const Route = createFileRoute("/($lang)/docs/size-guidelines")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "meta.docs.sizeGuidelines.title") },
        { name: "description", content: getMeta(locale, "meta.docs.sizeGuidelines.description") },
      ],
      links: [
        { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/docs/size-guidelines` },
        { rel: 'alternate', hrefLang: 'de', href: `${BASE_URL}/de/docs/size-guidelines` },
      ],
    };
  },
  component: SizeGuidelinesPage,
});

function PanDemo() {
  const { t } = useLanguage();
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
              {t('docs.sizeGuidelines.panning.viewportEdge')}
            </span>
          </div>

          {/* Dimension labels */}
          <div className="absolute top-2.5 left-[2%] font-mono text-[9px] text-white/70 drop-shadow">
            {t('docs.sizeGuidelines.panning.viewportLabel')}
          </div>
          <div className="absolute top-2.5 left-[66%] font-mono text-[9px] text-white/50 drop-shadow">
            {t('docs.sizeGuidelines.panning.panAreaLabel')}
          </div>

          {/* Drag hint pill */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-sm">
              <ArrowLeftRight className="size-3 text-white/70" />
              <span className="text-[10px] font-medium text-white/80">
                {t('docs.sizeGuidelines.panning.dragHint')}
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
        <span>{t('docs.sizeGuidelines.panning.footerLeft')}</span>
        <span>{t('docs.sizeGuidelines.panning.footerRight')}</span>
      </div>
    </div>
  );
}

function SizeGuidelinesPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Ruler className="text-primary size-7" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t('docs.sizeGuidelines.title')}
          </h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          {t('docs.sizeGuidelines.subtitle')}
        </p>
      </div>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">
          {t('docs.sizeGuidelines.stageCanvas.heading')}
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
          {t('docs.sizeGuidelines.characters.heading')}
        </h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          {[
            {
              label: t('docs.sizeGuidelines.char.size.label'),
              value: t('docs.sizeGuidelines.char.size.value'),
              desc: t('docs.sizeGuidelines.char.size.desc'),
            },
            {
              label: t('docs.sizeGuidelines.char.ratio.label'),
              value: t('docs.sizeGuidelines.char.ratio.value'),
              desc: t('docs.sizeGuidelines.char.ratio.desc'),
            },
            {
              label: t('docs.sizeGuidelines.char.format.label'),
              value: t('docs.sizeGuidelines.char.format.value'),
              desc: t('docs.sizeGuidelines.char.format.desc'),
            },
            {
              label: t('docs.sizeGuidelines.char.maxSize.label'),
              value: t('docs.sizeGuidelines.char.maxSize.value'),
              desc: t('docs.sizeGuidelines.char.maxSize.desc'),
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
          {t('docs.sizeGuidelines.backgrounds.heading')}
        </h2>
        <PanDemo />
        <div className="bg-base-100 border-base-300 divide-base-300 mt-4 divide-y rounded-2xl border">
          {[
            {
              label: t('docs.sizeGuidelines.bg.size.label'),
              value: t('docs.sizeGuidelines.bg.size.value'),
              desc: t('docs.sizeGuidelines.bg.size.desc'),
            },
            {
              label: t('docs.sizeGuidelines.bg.position.label'),
              value: t('docs.sizeGuidelines.bg.position.value'),
              desc: t('docs.sizeGuidelines.bg.position.desc'),
            },
            {
              label: t('docs.sizeGuidelines.bg.format.label'),
              value: t('docs.sizeGuidelines.bg.format.value'),
              desc: t('docs.sizeGuidelines.bg.format.desc'),
            },
            {
              label: t('docs.sizeGuidelines.bg.maxSize.label'),
              value: t('docs.sizeGuidelines.bg.maxSize.value'),
              desc: t('docs.sizeGuidelines.bg.maxSize.desc'),
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
          {t('docs.sizeGuidelines.rive.heading')}
        </h2>
        <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
          <p className="text-base-content/60 text-sm leading-relaxed">
            {t('docs.sizeGuidelines.rive.body')}
          </p>
        </div>
      </section>
    </div>
  );
}
