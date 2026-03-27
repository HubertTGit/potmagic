import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { useLanguage } from "@/hooks/useLanguage";
import { ShowPinForm } from "@/components/show-pin-form.component";

export const Route = createFileRoute("/($lang)/show/")({
  head: () => ({
    meta: [
      { title: "Join a Show — potmagic: Live Story Theater" },
      {
        name: "description",
        content:
          "Enter your show PIN to join a live interactive story performance on potmagic.",
      },
      { property: "og:title", content: "Join a Show — potmagic" },
      {
        property: "og:description",
        content:
          "Enter your show PIN to join a live interactive story performance.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ShowPinPage,
});

function ShowPinPage() {
  const { langPrefix } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <div className="flex flex-1 items-center justify-center px-4">
        <ShowPinForm
          onSuccess={(storyId) =>
            navigate({
              to: `${langPrefix}/show/$storyId`,
              params: { storyId },
            } as any)
          }
        />
      </div>

      <LandingFooter />
    </div>
  );
}
