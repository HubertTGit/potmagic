import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { Check, Wand2, Sparkles, Building2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: 'Pricing — potmagic: Live Story Theater' },
      { name: 'description', content: 'Simple, honest plans for every stage. From free family shows to full professional productions — potmagic has a plan for every storyteller.' },
      { property: 'og:title', content: 'Pricing — potmagic' },
      { property: 'og:description', content: 'Simple, honest plans for every stage. From free family shows to full professional productions.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:title', content: 'Pricing — potmagic' },
      { name: 'twitter:description', content: 'Simple, honest plans for every stage. From free family shows to full professional productions.' },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base-200 text-base-content">
      <LandingNavbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-20 text-center bg-base-100">
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-accent font-semibold uppercase tracking-widest text-sm mb-3">
              Pricing
            </p>
            <h1 className="font-display text-4xl font-bold mb-4">
              Simple, honest plans
            </h1>
            <p className="text-base-content/60 text-lg">
              Whether you're gathering family around a story or running a full
              production, there's a plan for every stage.
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="py-16 bg-base-200">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <PricingCard
              badge="Free"
              badgeColor="badge-ghost border border-base-300"
              title="Curtain Up"
              price="$0"
              period="forever"
              description="Perfect for families and small groups exploring the stage for the first time."
              features={[
                "Up to 3 actors per show",
                "5 scenes per story",
                "Built-in asset library",
                "Public broadcast link",
                "Community interaction",
              ]}
              cta="Get started"
              ctaClass="btn-outline"
              highlight={false}
            />

            <PricingCard
              badge="Popular"
              badgeColor="badge-accent"
              title="The Troupe"
              price="$12"
              period="per month"
              description="For creators and storytellers who want the full stage experience."
              features={[
                "Up to 12 actors per show",
                "Unlimited scenes",
                "Custom prop uploads",
                "Rive animated characters",
                "Voice character filters",
                "Private broadcast links",
                "Priority support",
              ]}
              cta="Coming soon"
              ctaClass="btn-accent"
              highlight={true}
            />

            <PricingCard
              badge="Teams"
              badgeColor="badge-neutral"
              title="Grand Theater"
              price="Custom"
              period="contact us"
              description="Schools, studios, and organizations running professional productions."
              features={[
                "Unlimited actors",
                "Branded stage environment",
                "Multi-show management",
                "Analytics & recordings",
                "Dedicated support",
                "SLA guarantee",
              ]}
              cta="Coming soon"
              ctaClass="btn-outline"
              highlight={false}
            />
          </div>
        </section>

        {/* Under construction banner */}
        <section className="py-16 bg-base-100">
          <div className="max-w-2xl mx-auto px-6">
            <div className="card bg-base-200 border border-accent/30 shadow-sm">
              <div className="card-body items-center text-center gap-5 py-10">
                <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Wand2 className="size-7 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold mb-2">
                    Pricing is being crafted
                  </h2>
                  <p className="text-base-content/60 text-sm leading-relaxed max-w-sm">
                    The plans above are a preview. Billing and subscriptions are
                    still under construction — everything is free during the
                    early access period.
                  </p>
                </div>
                <div className="badge badge-accent badge-lg gap-2 font-semibold">
                  <Sparkles className="size-3.5" />
                  Early Access — All Features Free
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function PricingCard({
  badge,
  badgeColor,
  title,
  price,
  period,
  description,
  features,
  cta,
  ctaClass,
  highlight,
}: {
  badge: string;
  badgeColor: string;
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaClass: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`card border shadow-sm ${
        highlight
          ? "bg-base-100 border-accent/40 shadow-accent/10 shadow-md"
          : "bg-base-100 border-base-300"
      }`}
    >
      <div className="card-body gap-5 p-6">
        <div className="flex items-center justify-between">
          <span className={`badge badge-sm font-semibold uppercase tracking-wider ${badgeColor}`}>
            {badge}
          </span>
          {highlight && <Building2 className="size-4 text-accent/50" />}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold mb-1">{title}</h2>
          <p className="text-base-content/50 text-xs leading-relaxed">{description}</p>
        </div>

        <div className="flex items-end gap-1">
          <span className="font-display text-4xl font-bold">{price}</span>
          <span className="text-base-content/50 text-sm pb-1">/ {period}</span>
        </div>

        <div className="divider my-0" />

        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-base-content/70">
              <Check className="size-4 text-success shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        <button
          className={`btn btn-sm w-full mt-2 ${ctaClass}`}
          disabled={cta === "Coming soon"}
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
