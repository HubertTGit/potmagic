import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const CharacterBuilderStudio = lazy(() => 
  import("@/components/character-builder/character-builder-studio.component").then(m => ({ 
    default: m.CharacterBuilderStudio 
  }))
);

export const Route = createFileRoute("/($lang)/_app/character-builder/$storyId/$characterId")({
  component: () => (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    }>
      <CharacterBuilderStudio />
    </Suspense>
  ),
});
