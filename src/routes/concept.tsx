import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";

export const Route = createFileRoute("/concept")({
  head: () => ({ meta: [{ title: "Concept — potmagic" }] }),
  component: ConceptPage,
});

function ConceptPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base-200 text-base-content">
      <LandingNavbar />
      <main className="flex-1" />
      <LandingFooter />
    </div>
  );
}
