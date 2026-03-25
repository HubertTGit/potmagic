import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Rocket,
  Heart,
  Users,
  Lightbulb,
  Globe,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/($lang)/about")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "about.title") },
        {
          name: "description",
          content: "Learn about potmagic's mission and values.",
        },
      ],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const { t } = useLanguage();

  const values = [
    {
      icon: Lightbulb,
      title: t("about.values.creativity.title"),
      body: t("about.values.creativity.body"),
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Heart,
      title: t("about.values.connection.title"),
      body: t("about.values.connection.body"),
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Globe,
      title: t("about.values.inclusion.title"),
      body: t("about.values.inclusion.body"),
      color: "bg-accent/10 text-accent",
    },
  ];

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-base-100 py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="font-display mb-6 text-5xl font-bold leading-tight">
              {t("about.title")}
            </h1>
            <p className="text-base-content/60 mx-auto max-w-2xl text-xl leading-relaxed">
              {t("about.subtitle")}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="card bg-base-100 border-base-300 border shadow-xl overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-primary/5 flex items-center justify-center p-12 md:w-1/3">
                  <Rocket className="text-primary size-24" />
                </div>
                <div className="card-body p-12 md:w-2/3">
                  <h2 className="font-display mb-4 text-3xl font-bold">
                    {t("about.mission.title")}
                  </h2>
                  <p className="text-base-content/70 text-lg leading-relaxed">
                    {t("about.mission.body")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-base-100 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-display mb-16 text-center text-3xl font-bold">
              {t("about.values.title")}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {values.map((value, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className={`mb-6 rounded-2xl p-4 ${value.color}`}>
                    <value.icon className="size-8" />
                  </div>
                  <h3 className="font-display mb-3 text-xl font-bold">
                    {value.title}
                  </h3>
                  <p className="text-base-content/60 leading-relaxed">
                    {value.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="card bg-neutral text-neutral-content shadow-2xl">
              <div className="card-body items-center gap-6 p-16 text-center">
                <div className="bg-primary flex size-16 items-center justify-center rounded-full ring-4 ring-primary/20">
                  <Users className="size-8" />
                </div>
                <h2 className="font-display text-3xl font-bold">
                  {t("about.team.title")}
                </h2>
                <p className="mx-auto max-w-2xl text-lg leading-relaxed opacity-80">
                  {t("about.team.body")}
                </p>
                <div className="badge badge-primary badge-lg mt-4 gap-2 py-4 px-6 font-semibold">
                  <Sparkles className="size-4" />
                  Join the Magic
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
