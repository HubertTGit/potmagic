import { createFileRoute } from '@tanstack/react-router';
import { Layers, Clapperboard } from 'lucide-react';
import { getMeta } from '@/i18n/meta';

const BASE_URL = 'https://potmagic.com';

export const Route = createFileRoute('/($lang)/docs/add-scenes')({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? 'en';
    return {
      meta: [
        { title: getMeta(locale, 'meta.docs.addScenes.title') },
        { name: 'description', content: getMeta(locale, 'meta.docs.addScenes.description') },
      ],
      links: [
        { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/docs/add-scenes` },
        { rel: 'alternate', hrefLang: 'de', href: `${BASE_URL}/de/docs/add-scenes` },
      ],
    };
  },
  component: AddScenesPage,
});

function AddScenesPage() {
  return (
    <div className="space-y-10">

      <div>
        <div className="mb-4 flex items-center gap-3">
          <Layers className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Add Scenes</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          Scenes divide your story into acts. Each scene has its own cast, backgrounds, and props —
          the director switches between scenes live during the performance.
        </p>
      </div>

      <section>
        <h2 className="font-display mb-2 text-lg font-semibold">Who can add scenes?</h2>
        <div className="bg-base-100 border-base-300 flex items-start gap-3 rounded-2xl border p-5">
          <Clapperboard className="text-primary mt-0.5 size-5 shrink-0" />
          <p className="text-base-content/70 text-sm leading-relaxed">
            Only users with the <strong className="text-base-content">Director</strong> role can add
            and manage scenes. Actors can view scenes they are cast in but cannot create or reorder them.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-6 text-lg font-semibold">Adding a Scene</h2>
        <ul className="timeline timeline-vertical timeline-compact">
          {[
            {
              step: '1',
              title: 'Open the story detail page',
              body: 'Navigate to Stories and click your story. You will see a Scenes tab listing all current scenes.',
            },
            {
              step: '2',
              title: 'Click "Add Scene"',
              body: 'Press the Add Scene button. Enter a title for the scene — for example "Act 1" or "The Forest".',
            },
            {
              step: '3',
              title: 'Assign cast to the scene',
              body: 'Open the scene detail page. Use the "Add to Scene" controls to choose which cast members appear in this scene. You can add one background and multiple characters per scene.',
            },
            {
              step: '4',
              title: 'Reorder scenes',
              body: 'Drag scenes in the scene list to reorder them. The order determines the sequence during the live performance.',
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
        <h2 className="font-display mb-4 text-lg font-semibold">Scene Composition Rules</h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          {[
            {
              label: 'One background per scene',
              desc: 'Each scene can have at most one background prop. Adding a second background replaces the existing one.',
            },
            {
              label: 'Multiple characters',
              desc: 'You can add any number of character props to a scene, limited only by the number of cast members in your story.',
            },
            {
              label: 'Independent positioning',
              desc: 'Character positions are saved per scene. Moving a character in Scene 2 does not affect their position in Scene 1.',
            },
          ].map(({ label, desc }) => (
            <div key={label} className="px-5 py-4">
              <p className="font-display mb-1 text-sm font-semibold">{label}</p>
              <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">Switching Scenes Live</h2>
        <p className="text-base-content/60 text-sm leading-relaxed">
          During a live performance, the director uses the Scene Navigator on the stage to switch
          between scenes. All participants and viewers transition to the new scene simultaneously.
          Actors only see the stage for scenes they are cast in.
        </p>
      </section>

    </div>
  );
}
