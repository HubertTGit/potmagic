import { createFileRoute } from '@tanstack/react-router';
import {
  BookOpen,
  Drama,
  Clapperboard,
  Eye,
  MousePointerClick,
  RotateCcw,
  FlipHorizontal,
  Volume2,
  Radio,
} from 'lucide-react';

export const Route = createFileRoute('/docs/')({
  head: () => ({
    meta: [
      { title: 'Docs — potmagic: Live Story Theater' },
      { name: 'description', content: 'Learn how to use potmagic — guides for Directors, Actors, and Viewers to get the most out of the live story theater platform.' },
      { property: 'og:title', content: 'Documentation — potmagic' },
      { property: 'og:description', content: 'Guides for Directors, Actors, and Viewers to get the most out of the potmagic live story theater platform.' },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: DocsOverviewPage,
});

function DocsOverviewPage() {
  return (
    <div className="space-y-14">

      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <BookOpen className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Documentation</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          Everything you need to perform, direct, and watch stories on potmagic.
        </p>
      </div>

      {/* Roles */}
      <section>
        <h2 className="font-display mb-6 text-xl font-semibold">Roles</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <RoleCard
            icon={<Clapperboard className="size-5" />}
            title="Director"
            description="Creates stories, builds scenes, assigns characters to actors, and controls the live session."
          />
          <RoleCard
            icon={<Drama className="size-5" />}
            title="Actor"
            description="Assigned one character per story. Moves, rotates, and performs their character on the canvas."
          />
          <RoleCard
            icon={<Eye className="size-5" />}
            title="Viewer"
            description="Watches the live broadcast via a public URL. No account required."
          />
        </div>
      </section>

      {/* Stage controls */}
      <section>
        <h2 className="font-display mb-6 text-xl font-semibold">Stage Controls</h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          <ControlRow
            icon={<MousePointerClick className="size-4" />}
            label="Drag"
            description="Click and drag your character anywhere on the stage."
          />
          <ControlRow
            icon={<RotateCcw className="size-4" />}
            label="Rotate"
            description="Use two fingers on a touch screen to rotate and pan your character simultaneously."
          />
          <ControlRow
            icon={<FlipHorizontal className="size-4" />}
            label="Mirror"
            description="Double-click or double-tap to flip your character horizontally."
          />
          <ControlRow
            icon={<Volume2 className="size-4" />}
            label="Voice"
            description="Your microphone is live when you join the stage. Use the mute button in the cast overlay to toggle."
          />
        </div>
      </section>

      {/* Session lifecycle */}
      <section>
        <h2 className="font-display mb-6 text-xl font-semibold">Session Lifecycle</h2>
        <ol className="space-y-4">
          {[
            { step: '1', text: 'Director creates a story and adds scenes.' },
            { step: '2', text: 'Director assigns characters from the prop library to each actor.' },
            { step: '3', text: 'Actors join the stage — voice and canvas sync start automatically.' },
            { step: '4', text: 'Director sets status to Active to begin public broadcast.' },
            { step: '5', text: 'Viewers watch via the public broadcast URL.' },
            { step: '6', text: 'Director ends the session — all participants are disconnected.' },
          ].map(({ step, text }) => (
            <li key={step} className="flex items-start gap-4">
              <span className="bg-primary/10 text-primary font-display flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {step}
              </span>
              <p className="text-base-content/80 pt-0.5 text-sm leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Broadcast */}
      <section>
        <h2 className="font-display mb-4 text-xl font-semibold">Public Broadcast</h2>
        <div className="bg-base-100 border-base-300 flex items-start gap-4 rounded-2xl border p-6">
          <Radio className="text-accent mt-0.5 size-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Share your show</p>
            <p className="text-base-content/60 text-sm leading-relaxed">
              When a story goes live, a public broadcast URL is generated. Share it with your
              audience — no login required to watch. Viewers receive the canvas stream and
              voice audio in real time.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
      <div className="text-primary mb-3">{icon}</div>
      <h3 className="font-display mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-base-content/60 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ControlRow({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="text-primary mt-0.5 shrink-0">{icon}</div>
      <div>
        <span className="font-display text-sm font-semibold">{label}</span>
        <p className="text-base-content/60 mt-0.5 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
