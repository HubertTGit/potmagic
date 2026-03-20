import { createFileRoute } from '@tanstack/react-router';
import { FilePlus, Clapperboard } from 'lucide-react';

export const Route = createFileRoute('/docs/create-story')({
  head: () => ({ meta: [{ title: 'Create a Story — potmagic: Live Story Theater' }, { name: 'description', content: 'Learn how to create a new story as a Director on potmagic — set scenes, assign props, and invite your cast.' }] }),
  component: CreateStoryPage,
});

function CreateStoryPage() {
  return (
    <div className="space-y-10">

      <div>
        <div className="mb-4 flex items-center gap-3">
          <FilePlus className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Create a Story</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          Stories are the top-level container for your performance. Each story holds scenes,
          a cast of actors, and a live broadcast channel.
        </p>
      </div>

      <section>
        <h2 className="font-display mb-2 text-lg font-semibold">Who can create stories?</h2>
        <div className="bg-base-100 border-base-300 flex items-start gap-3 rounded-2xl border p-5">
          <Clapperboard className="text-primary mt-0.5 size-5 shrink-0" />
          <p className="text-base-content/70 text-sm leading-relaxed">
            Only users with the <strong className="text-base-content">Director</strong> role can create
            and manage stories. Actors can view stories they are assigned to but cannot create new ones.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-6 text-lg font-semibold">Steps</h2>
        <ul className="timeline timeline-vertical timeline-compact">
          {[
            {
              step: '1',
              title: 'Open the Director dashboard',
              body: 'Navigate to the Director page from the sidebar. You will see a list of all stories you have created.',
            },
            {
              step: '2',
              title: 'Click "New Story"',
              body: 'Press the New Story button in the top-right corner of the dashboard. A creation form will appear.',
            },
            {
              step: '3',
              title: 'Enter a title',
              body: 'Give your story a descriptive title — for example "The Lost Crown" or "Midnight in the Forest". The title is visible to all assigned actors.',
            },
            {
              step: '4',
              title: 'Confirm creation',
              body: 'Click Create. The story is created in Draft status and you are taken to the story detail page where you can add scenes and assign cast.',
            },
          ].map(({ step, title, body }, index, arr) => (
            <li key={step}>
              {index > 0 && <hr className="bg-primary/30" />}
              <div className="timeline-middle">
                <span className="bg-primary/10 text-primary font-display flex size-7 items-center justify-center rounded-full text-sm font-semibold">
                  {step}
                </span>
              </div>
              <div className="timeline-end timeline-box mb-6 border-base-300 bg-base-100">
                <p className="font-display mb-1 text-sm font-semibold">{title}</p>
                <p className="text-base-content/60 text-sm leading-relaxed">{body}</p>
              </div>
              {index < arr.length - 1 && <hr className="bg-primary/30" />}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">Story Status</h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          {[
            {
              badge: 'Draft',
              color: 'badge-warning',
              desc: 'Default state. The stage is accessible to assigned actors for rehearsal but the public broadcast is not live.',
            },
            {
              badge: 'Active',
              color: 'badge-success',
              desc: 'The performance is live. A public broadcast URL is generated and the stage is visible to viewers.',
            },
            {
              badge: 'Ended',
              color: 'badge-neutral',
              desc: 'The performance has concluded. All participants are disconnected and the broadcast URL is deactivated.',
            },
          ].map(({ badge, color, desc }) => (
            <div key={badge} className="flex items-start gap-4 px-5 py-4">
              <span className={`badge badge-sm font-semibold uppercase tracking-wider mt-0.5 ${color}`}>
                {badge}
              </span>
              <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
