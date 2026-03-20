import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: 'potmagic: Live Story Theater' },
      { name: 'description', content: 'Step into the digital spotlight. potmagic is a live collaborative storytelling platform for families, friends, and creators to perform interactive stories from anywhere.' },
      { property: 'og:title', content: 'potmagic: Live Story Theater' },
      { property: 'og:description', content: 'Perform live interactive stories with your community from anywhere in the world. Directors, actors, and audiences connect in real-time.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:title', content: 'potmagic: Live Story Theater' },
      { name: 'twitter:description', content: 'Perform live interactive stories with your community from anywhere in the world.' },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base-100 text-base-content">
      <LandingNavbar />

      {/* Hero */}
      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">

            {/* Left — copy */}
            <div className="flex flex-col gap-6 lg:flex-1">
              <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Live Community Theatre.{" "}
                <span className="text-base-content/60">Whenever, wherever.</span>
              </h1>
              <p className="max-w-md text-base text-base-content/50 leading-relaxed">
                Step into the digital spotlight. Perform live interactive stories
                with your community from anywhere in the world.
              </p>
              <div>
                <Link
                  to="/auth"
                  search={{ token: undefined }}
                  className="btn btn-accent btn-md font-display px-8 tracking-wide rounded-full"
                >
                  Join Our Theatre
                </Link>
              </div>
            </div>

            {/* Right — teaser image */}
            <div className="w-full lg:flex-1">
              <div className="overflow-hidden rounded-2xl border border-base-300 shadow-xl">
                <img
                  src="/teaser.png"
                  alt="Live community theatre stage"
                  className="w-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
