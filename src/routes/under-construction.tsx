import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/under-construction")({
  head: () => ({
    meta: [
      { title: "Coming Soon — potmagic: Live Story Theater" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnderConstructionPage,
});

function UnderConstructionPage() {
  return (
    <div className="bg-base-200 flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <img src="icon-red.svg" className="h-10" />

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-base-content text-4xl font-semibold tracking-tight">
            potmagic
          </h1>
          <p className="text-base-content/60 text-lg">
            Something magical is being crafted.
          </p>
        </div>

        <div className="bg-base-content/10 h-px w-full" />

        <p className="text-base-content/40 text-sm">
          An online collaborative theater platform — coming soon.
        </p>
      </div>
    </div>
  );
}
