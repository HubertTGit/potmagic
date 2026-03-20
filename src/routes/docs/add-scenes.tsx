import { createFileRoute } from '@tanstack/react-router';
import { Layers } from 'lucide-react';

export const Route = createFileRoute('/docs/add-scenes')({
  head: () => ({ meta: [{ title: 'Add Scenes — potmagic: Live Story Theater' }, { name: 'description', content: 'Learn how to add and sequence scenes within a story on potmagic to build your narrative flow.' }] }),
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
        <h2 className="font-display mb-6 text-lg font-semibold">Adding a Scene</h2>
        <ol className="space-y-5">
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
