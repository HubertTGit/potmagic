import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { Theater } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "potmagic: Live Story Theater" },
      {
        name: "description",
        content:
          "Step into the digital spotlight. potmagic is a live collaborative storytelling platform for families, friends, and creators to perform interactive stories from anywhere.",
      },
      { property: "og:title", content: "potmagic: Live Story Theater" },
      {
        property: "og:description",
        content:
          "Perform live interactive stories with your community from anywhere in the world. Directors, actors, and audiences connect in real-time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "potmagic: Live Story Theater" },
      {
        name: "twitter:description",
        content:
          "Perform live interactive stories with your community from anywhere in the world.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="bg-base-100 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      {/* Hero */}
      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
            {/* Left — copy */}
            <div className="flex flex-col gap-6 lg:flex-1">
              <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                <span>
                  Live &nbsp;
                  <span className="text-rotate">
                    <span>
                      <span>Story.</span>
                      <span>Theatre.</span>
                      <span>Stage.</span>
                      <span>Performance.</span>
                      <span>Interaction.</span>
                    </span>
                  </span>
                </span>

                <span className="text-base-content/60">
                  Whenever, <br /> wherever.
                </span>
              </h1>
              <p className="text-base-content/50 max-w-md text-base leading-relaxed">
                Step into the digital spotlight. Perform live interactive
                stories with your community from anywhere in the world.
              </p>
              <div>
                <Link
                  to="/auth"
                  search={{ token: undefined }}
                  className="btn btn-accent btn-md font-display rounded-full px-8 tracking-wide"
                >
                  Join Our Theatre
                </Link>
              </div>
            </div>

            {/* Right — teaser image */}
            <div className="w-full lg:flex-1">
              <div className="border-base-300 grid aspect-3/2 items-center overflow-hidden rounded-2xl border shadow-xl">
                <figure className="hover-gallery">
                  <img src="/teaser1.png" />
                  <img src="/teaser2.png" />
                  <img src="/teaser3.png" />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
