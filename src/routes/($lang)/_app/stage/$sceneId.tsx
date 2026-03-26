import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { getMeta } from "@/i18n/meta";
import { SceneStagePage } from "@/components/stage/scene-stage-page.component";

export const Route = createFileRoute("/($lang)/_app/stage/$sceneId")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return { meta: [{ title: getMeta(locale, "meta.stage.title") }] };
  },
  component: () => <SceneStagePage sceneId={Route.useParams().sceneId} />,
  pendingComponent: () => (
    <div className="bg-base-100 fixed inset-0 flex items-center justify-center">
      <img
        src="/icon-red.svg"
        className="size-10 animate-bounce dark:hidden"
        alt=""
      />
      <img
        src="/icon-white.svg"
        className="hidden size-10 animate-bounce dark:block"
        alt=""
      />
    </div>
  ),
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});
