import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { Check, Wand2, Sparkles, Building2 } from "lucide-react";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";

const BASE_URL = "https://potmagic.live";

export const Route = createFileRoute("/($lang)/pricing")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "meta.pricing.title") },
        {
          name: "description",
          content: getMeta(locale, "meta.pricing.description"),
        },
        {
          property: "og:title",
          content: getMeta(locale, "meta.pricing.ogTitle"),
        },
        {
          property: "og:description",
          content: getMeta(locale, "meta.pricing.ogDescription"),
        },
        { property: "og:type", content: "website" },
      ],
      links: [
        { rel: "alternate", hrefLang: "en", href: `${BASE_URL}/pricing` },
        { rel: "alternate", hrefLang: "de", href: `${BASE_URL}/de/pricing` },
      ],
    };
  },
  component: PricingPage,
});

function PricingPage() {
  const { t } = useLanguage();

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-base-100 py-20 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <p className="text-accent mb-3 text-sm font-semibold tracking-widest uppercase">
              {t("pricing.header.eyebrow")}
            </p>
            <h1 className="font-display mb-4 text-4xl font-bold">
              {t("pricing.header.title")}
            </h1>
            <p className="text-base-content/60 text-lg">
              {t("pricing.header.subtitle")}
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="bg-base-200 py-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 px-6 md:grid-cols-3">
            <PricingCard
              badge={t("pricing.plan.free.badge")}
              badgeColor="badge-ghost border border-base-300"
              title={t("pricing.plan.free.title")}
              price={t("pricing.plan.free.price")}
              period={t("pricing.plan.free.period")}
              description={t("pricing.plan.free.description")}
              features={[
                t("pricing.plan.free.feature1"),
                t("pricing.plan.free.feature2"),
                t("pricing.plan.free.feature3"),
                t("pricing.plan.free.feature4"),
                t("pricing.plan.free.feature5"),
              ]}
              cta={t("pricing.plan.free.cta")}
              ctaClass="btn-outline"
              highlight={false}
              disabled={false}
            />

            <PricingCard
              badge={t("pricing.plan.popular.badge")}
              badgeColor="badge-accent"
              title={t("pricing.plan.popular.title")}
              price={t("pricing.plan.popular.price")}
              period={t("pricing.plan.popular.period")}
              description={t("pricing.plan.popular.description")}
              features={[
                t("pricing.plan.popular.feature1"),
                t("pricing.plan.popular.feature2"),
                t("pricing.plan.popular.feature3"),
                t("pricing.plan.popular.feature4"),
                t("pricing.plan.popular.feature5"),
                t("pricing.plan.popular.feature6"),
                t("pricing.plan.popular.feature7"),
              ]}
              cta={t("pricing.plan.popular.cta")}
              ctaClass="btn-accent"
              highlight={true}
              disabled={true}
            />

            <PricingCard
              badge={t("pricing.plan.teams.badge")}
              badgeColor="badge-neutral"
              title={t("pricing.plan.teams.title")}
              price={t("pricing.plan.teams.price")}
              period={t("pricing.plan.teams.period")}
              description={t("pricing.plan.teams.description")}
              features={[
                t("pricing.plan.teams.feature1"),
                t("pricing.plan.teams.feature2"),
                t("pricing.plan.teams.feature3"),
                t("pricing.plan.teams.feature4"),
                t("pricing.plan.teams.feature5"),
                t("pricing.plan.teams.feature6"),
              ]}
              cta={t("pricing.plan.teams.cta")}
              ctaClass="btn-outline"
              highlight={false}
              disabled={true}
            />
          </div>
        </section>

        {/* Under construction banner */}
        <section className="bg-base-100 py-16">
          <div className="mx-auto max-w-2xl px-6">
            <div className="card bg-base-200 border-accent/30 border shadow-sm">
              <div className="card-body items-center gap-5 py-10 text-center">
                <div className="bg-accent/10 flex size-14 items-center justify-center rounded-2xl">
                  <Wand2 className="text-accent size-7" />
                </div>
                <div>
                  <h2 className="font-display mb-2 text-xl font-semibold">
                    {t("pricing.earlyAccess.title")}
                  </h2>
                  <p className="text-base-content/60 max-w-sm text-sm leading-relaxed">
                    {t("pricing.earlyAccess.description")}
                  </p>
                </div>
                <div className="badge badge-accent badge-lg gap-2 font-semibold">
                  <Sparkles className="size-3.5" />
                  {t("pricing.earlyAccess.badge")}
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
  disabled,
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
  disabled: boolean;
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
          <span
            className={`badge badge-sm font-semibold tracking-wider uppercase ${badgeColor}`}
          >
            {badge}
          </span>
          {highlight && <Building2 className="text-accent/50 size-4" />}
        </div>

        <div>
          <h2 className="font-display mb-1 text-lg font-bold">{title}</h2>
          <p className="text-base-content/50 text-xs leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-end gap-1">
          <span className="font-display text-4xl font-bold">{price}</span>
          <span className="text-base-content/50 pb-1 text-sm">/ {period}</span>
        </div>

        <div className="divider my-0" />

        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li
              key={f}
              className="text-base-content/70 flex items-start gap-2.5 text-sm"
            >
              <Check className="text-success mt-0.5 size-4 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <button
          className={`btn btn-sm mt-2 w-full ${ctaClass}`}
          disabled={disabled}
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
