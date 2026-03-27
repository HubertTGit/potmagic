import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ScrollText,
  ShieldCheck,
  UserCog,
  Scale,
  AlertTriangle,
  RefreshCw,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/($lang)/terms")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "terms.title") },
        { name: "description", content: "potmagic Terms & Policy" },
        { name: "robots", content: "index, follow" },
      ],
    };
  },
  component: TermsPage,
});

function TermsPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: ScrollText,
      title: t("terms.intro.title"),
      body: t("terms.intro.body"),
    },
    {
      icon: UserCog,
      title: t("terms.accounts.title"),
      body: t("terms.accounts.body"),
    },
    {
      icon: ShieldCheck,
      title: t("terms.content.title"),
      body: t("terms.content.body"),
    },
    {
      icon: Scale,
      title: t("terms.conduct.title"),
      body: t("terms.conduct.body"),
    },
    {
      icon: AlertTriangle,
      title: t("terms.liability.title"),
      body: t("terms.liability.body"),
    },
    {
      icon: RefreshCw,
      title: t("terms.changes.title"),
      body: t("terms.changes.body"),
    },
    {
      icon: Mail,
      title: t("terms.contact.title"),
      body: t("terms.contact.body"),
    },
  ];

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <header className="mb-12 text-center">
            <h1 className="font-display mb-4 text-4xl font-bold">
              {t("terms.title")}
            </h1>
            <p className="text-base-content/40 text-sm">
              {t("terms.lastUpdated")}
            </p>
          </header>

          <div className="grid gap-8">
            {sections.map((section, idx) => (
              <section
                key={idx}
                className="card bg-base-100 border-base-300 border shadow-sm"
              >
                <div className="card-body gap-4 p-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-xl p-3">
                      <section.icon className="text-primary size-6" />
                    </div>
                    <h2 className="font-display text-xl font-semibold">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-base-content/70 leading-relaxed">
                    {section.body}
                  </p>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
