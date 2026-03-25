import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";

export const Route = createFileRoute("/($lang)/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex flex-1 items-center justify-center">
        <p className="text-base-content/40 text-sm">Terms & Policy — coming soon</p>
      </main>
      <LandingFooter />
    </div>
  );
}
