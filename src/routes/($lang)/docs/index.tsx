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
  Users,
  Layers,
  FlaskConical,
  CalendarClock,
  Tv2,
  CircleOff,
  Keyboard,
} from 'lucide-react';

const BASE_URL = 'https://potmagic.com';

export const Route = createFileRoute('/($lang)/docs/')({
  head: () => ({
    meta: [
      { title: 'Docs — potmagic: Live Story Theater' },
      { name: 'description', content: 'Learn how to use potmagic — guides for Directors, Actors, and Viewers to get the most out of the live story theater platform.' },
      { property: 'og:title', content: 'Documentation — potmagic' },
      { property: 'og:description', content: 'Guides for Directors, Actors, and Viewers to get the most out of the potmagic live story theater platform.' },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/docs` },
      { rel: 'alternate', hrefLang: 'de', href: `${BASE_URL}/de/docs` },
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
            icon={<Clapperboard className="size-8" />}
            title="Director"
            color="primary"
            description="The storyteller in charge. Creates the story, invites actors, assigns characters, curates scenes, and controls when the show goes live or ends."
            bullets={[
              'Initialize stories and invite actors',
              'Assign characters from the prop library',
              'Build and arrange scenes',
              'Rehearse in draft mode',
              'Broadcast to the public',
              'End the session when done',
            ]}
          />
          <RoleCard
            icon={<Drama className="size-8" />}
            title="Actor"
            color="accent"
            description="A performer with one assigned character per story. Joins the stage to move, rotate, mirror, and voice their character live in front of an audience."
            bullets={[
              'Receives a character assignment',
              'Joins rehearsal in draft mode',
              'Performs on the live stage',
              'Controls their character on canvas',
              'Communicates via live voice',
            ]}
          />
          <RoleCard
            icon={<Eye className="size-8" />}
            title="Viewer"
            color="success"
            description="The audience. Receives a unique broadcast link and watches the live show — no account or login required."
            bullets={[
              'No sign-up needed',
              'Accesses show via unique URL',
              'Watches canvas and hears voice',
              'Automatically disconnected when show ends',
            ]}
          />
        </div>
      </section>

      {/* Session lifecycle */}
      <section>
        <h2 className="font-display mb-8 text-xl font-semibold">How a Show Works</h2>
        <ul className="timeline timeline-vertical">

          <li>
            <div className="timeline-middle">
              <div className="bg-primary/15 border-primary/30 flex items-center justify-center rounded-full border p-2">
                <Clapperboard className="text-primary size-6" />
              </div>
            </div>
            <div className="timeline-end timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">Director creates the story</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                A Director initializes a new story and invites participants to join as actors. Each actor is linked to the story and awaits a character assignment.
              </p>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-start timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">Characters are assigned</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                The Director picks a character from the prop library for each actor. Every actor gets one unique character per story.
              </p>
            </div>
            <div className="timeline-middle">
              <div className="bg-primary/15 border-primary/30 flex items-center justify-center rounded-full border p-2">
                <Users className="text-primary size-6" />
              </div>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-middle">
              <div className="bg-primary/15 border-primary/30 flex items-center justify-center rounded-full border p-2">
                <Layers className="text-primary size-6" />
              </div>
            </div>
            <div className="timeline-end timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">Scenes are curated</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                The Director builds out scenes and decides which characters appear in each one — setting the stage for every act of the story.
              </p>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-start timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">Rehearsal in draft mode</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                Actors join the private stage while the story is in <span className="badge badge-warning badge-xs font-semibold uppercase tracking-wider align-middle">draft</span> status. The Director runs through the scenes until the story is performance-ready.
              </p>
            </div>
            <div className="timeline-middle">
              <div className="bg-primary/15 border-primary/30 flex items-center justify-center rounded-full border p-2">
                <FlaskConical className="text-primary size-6" />
              </div>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-middle">
              <div className="bg-accent/15 border-accent/30 flex items-center justify-center rounded-full border p-2">
                <CalendarClock className="text-accent size-6" />
              </div>
            </div>
            <div className="timeline-end timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">Show is announced</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                The Director schedules a broadcast time. An email is sent to the audience with a unique URL — no account required to watch.
              </p>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-start timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">Live broadcast begins</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                The story status changes to <span className="badge badge-success badge-xs font-semibold uppercase tracking-wider align-middle">active</span>. The public can watch via their unique URL. Actors perform in real time — voice and canvas are streamed live to every viewer.
              </p>
            </div>
            <div className="timeline-middle">
              <div className="bg-success/15 border-success/30 flex items-center justify-center rounded-full border p-2">
                <Tv2 className="text-success size-6" />
              </div>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-middle">
              <div className="bg-error/15 border-error/30 flex items-center justify-center rounded-full border p-2">
                <CircleOff className="text-error size-6" />
              </div>
            </div>
            <div className="timeline-end timeline-box border-base-300 bg-base-100 max-w-md">
              <p className="font-display text-sm font-semibold">Show ends</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                The Director sets the story to <span className="badge badge-xs font-semibold uppercase tracking-wider align-middle bg-black text-white border-black">ended</span>. All viewers are automatically disconnected and the broadcast URL becomes inactive.
              </p>
            </div>
          </li>

        </ul>
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
          <ControlRow
            icon={<Keyboard className="size-4" />}
            label="Keyboard Shortcuts"
            description="Control your character's animation states via keyboard shortcuts while on stage."
          />
        </div>
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
  color,
  description,
  bullets,
}: {
  icon: React.ReactNode;
  title: string;
  color: 'primary' | 'accent' | 'success';
  description: string;
  bullets: string[];
}) {
  const iconColor = { primary: 'text-primary', accent: 'text-accent', success: 'text-success' }[color];
  const dotColor = { primary: 'bg-primary', accent: 'bg-accent', success: 'bg-success' }[color];
  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-5 flex flex-col gap-4">
      <div>
        <div className={`${iconColor} mb-3`}>{icon}</div>
        <h3 className="font-display mb-1 text-sm font-semibold">{title}</h3>
        <p className="text-base-content/60 text-sm leading-relaxed">{description}</p>
      </div>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className={`${dotColor} mt-1.5 size-1.5 shrink-0 rounded-full`} />
            <span className="text-base-content/60 text-xs leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
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
