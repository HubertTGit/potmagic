import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { RiveCanvas } from "@/components/rive-canvas.component";

export const Route = createFileRoute("/($lang)/careers")({
  head: () => {
    return {
      meta: [
        { title: "Careers — potmagic" },
        {
          name: "description",
          content: "Careers at potmagic.",
        },
      ],
    };
  },
  component: CareersPage,
});

function CareersPage() {
  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex flex-1 items-center justify-center">
        <ClientOnly>
          <h1>Careers</h1>
          <RiveCanvas />
        </ClientOnly>
      </main>

      <LandingFooter />
    </div>
  );
}
