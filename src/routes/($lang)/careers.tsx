import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Briefcase,
  Users,
  Cpu,
  Palette,
  Mail,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/($lang)/careers")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "careers.title") },
        {
          name: "description",
          content:
            "Join the potmagic team and help us build the future of live story theater.",
        },
      ],
    };
  },
  component: CareersPage,
});

function CareersPage() {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Palette,
      title: t("careers.culture.creativity"),
      color: "text-primary",
    },
    {
      icon: Users,
      title: t("careers.culture.collaboration"),
      color: "text-secondary",
    },
    {
      icon: Cpu,
      title: t("careers.culture.innovation"),
      color: "text-accent",
    },
  ];

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-base-100 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-8 flex size-16 items-center justify-center rounded-2xl">
              <Briefcase className="size-10" />
            </div>
            <h1 className="font-display mb-6 text-5xl font-bold leading-tight">
              {t("careers.title")}
            </h1>
            <p className="text-base-content/60 mx-auto max-w-2xl text-xl leading-relaxed">
              {t("careers.subtitle")}
            </p>
          </div>
        </section>

        {/* Why potmagic */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-12 md:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-display mb-6 text-3xl font-bold">
                  {t("careers.why.title")}
                </h2>
                <p className="text-base-content/70 text-lg leading-relaxed">
                  {t("careers.why.body")}
                </p>
              </div>
              <div className="grid gap-6">
                {benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="card bg-base-100 border-base-300 border shadow-sm"
                  >
                    <div className="card-body flex-row items-center gap-4 p-6">
                      <benefit.icon className={`size-6 ${benefit.color}`} />
                      <span className="font-semibold">{benefit.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="bg-neutral text-neutral-content py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="font-display mb-8 text-3xl font-bold">
              {t("careers.roles.title")}
            </h2>
            <div className="card bg-white/5 border-white/10 border p-12 text-center">
              <p className="mx-auto max-w-2xl text-lg leading-relaxed opacity-80">
                {t("careers.roles.comingSoon")}
              </p>
              <div className="mt-10">
                <a
                  href="mailto:careers@potmagic.live"
                  className="btn btn-primary btn-lg gap-2"
                >
                  <Mail className="size-5" />
                  Get in Touch
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
