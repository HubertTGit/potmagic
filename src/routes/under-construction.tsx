import { createFileRoute } from '@tanstack/react-router';
import { Wand2 } from 'lucide-react';

export const Route = createFileRoute('/under-construction')({
  head: () => ({ meta: [{ title: 'Coming Soon — potmagic: Live Story Theater' }, { name: 'robots', content: 'noindex' }] }),
  component: UnderConstructionPage,
});

function UnderConstructionPage() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="size-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Wand2 className="size-8 text-accent" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-semibold text-base-content tracking-tight">
            potmagic
          </h1>
          <p className="text-base-content/60 text-lg">
            Something magical is being crafted.
          </p>
        </div>

        <div className="w-full h-px bg-base-content/10" />

        <p className="text-base-content/40 text-sm">
          An online collaborative theater platform — coming soon.
        </p>
      </div>
    </div>
  );
}
