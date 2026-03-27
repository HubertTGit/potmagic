import { createFileRoute } from "@tanstack/react-router";
import { ShowLivePage } from "@/components/live/show-live-page.component";

export const Route = createFileRoute("/($lang)/show/$storyId")({
  head: () => ({
    meta: [
      { title: "Watch Live — potmagic: Live Story Theater" },
      {
        name: "description",
        content:
          "Watch a live interactive story performance on potmagic and interact directly with the actors in real-time.",
      },
      { property: "og:title", content: "Watch Live — potmagic" },
      {
        property: "og:description",
        content:
          "A live interactive story is happening now. Join the audience and interact directly with the actors.",
      },
      { property: "og:type", content: "video.other" },
      { name: "twitter:title", content: "Watch Live — potmagic" },
      {
        name: "twitter:description",
        content:
          "A live interactive story is happening now. Join the audience and interact directly with the actors.",
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { storyId } = Route.useParams();
  return <ShowLivePage storyId={storyId} />;
}
