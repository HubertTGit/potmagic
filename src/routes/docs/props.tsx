import { createFileRoute } from '@tanstack/react-router';
import { Library, ImageIcon, Music, Sparkles } from 'lucide-react';

export const Route = createFileRoute('/docs/props')({
  head: () => ({ meta: [{ title: 'Props Library — potmagic: Live Story Theater' }, { name: 'description', content: 'Manage your props library on potmagic — upload characters, backgrounds, sounds, and Rive animations for your productions.' }] }),
  component: PropsPage,
});

function PropsPage() {
  return (
    <div className="space-y-10">

      <div>
        <div className="mb-4 flex items-center gap-3">
          <Library className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Props Library</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          Props are the visual and audio building blocks of your story — characters, backgrounds,
          sounds, and animations. Directors manage the props library and assign props to cast members.
        </p>
      </div>

      <section>
        <h2 className="font-display mb-6 text-lg font-semibold">Prop Types</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TypeCard
            icon={<ImageIcon className="size-5" />}
            title="Character"
            description="A movable sprite that an actor controls on stage. Characters can be dragged, rotated, and mirrored."
          />
          <TypeCard
            icon={<ImageIcon className="size-5" />}
            title="Background"
            description="A full-stage image pinned to the bottom of the canvas. One background per scene. Only horizontal drag allowed."
          />
          <TypeCard
            icon={<Music className="size-5" />}
            title="Sound"
            description="An audio track the director can play during a scene. Audible to all participants and viewers."
          />
          <TypeCard
            icon={<Sparkles className="size-5" />}
            title="Animation"
            description="A Rive animation file (.riv) placed on the canvas as an interactive animated prop."
          />
        </div>
      </section>

      <section>
        <h2 className="font-display mb-6 text-lg font-semibold">Uploading a Prop</h2>
        <ol className="space-y-5">
          {[
            {
              step: '1',
              title: 'Go to the Director dashboard',
              body: 'Open the Director page from the sidebar and switch to the Library tab.',
            },
            {
              step: '2',
              title: 'Click "Upload Prop"',
              body: 'Choose the prop type and select a file from your device. Supported formats: PNG, WebP, SVG for images; MP3, WAV for sounds; .riv for animations.',
            },
            {
              step: '3',
              title: 'Name the prop',
              body: 'Give the prop a descriptive name — for example "Bear Character" or "Forest Background". This name appears in the cast assignment screen.',
            },
            {
              step: '4',
              title: 'Assign to a cast member',
              body: 'Open a story, go to the Cast tab, and assign the prop to an actor. Each actor can only hold one prop per story.',
            },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-4">
              <span className="bg-primary/10 text-primary font-display flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {step}
              </span>
              <div>
                <p className="font-display mb-1 text-sm font-semibold">{title}</p>
                <p className="text-base-content/60 text-sm leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">Deleting Props</h2>
        <p className="text-base-content/60 text-sm leading-relaxed">
          Props can be deleted from the Library tab. Deleting a prop removes it from all scenes
          and cast assignments permanently. Make sure to reassign actors before deleting a prop
          that is currently in use.
        </p>
      </section>

    </div>
  );
}

function TypeCard({
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
