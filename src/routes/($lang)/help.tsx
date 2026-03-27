import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Search,
  BookOpen,
  Wrench,
  Layers,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/($lang)/help")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "help.title") },
        {
          name: "description",
          content: "Find help and support for potmagic: Live Story Theater.",
        },
      ],
    };
  },
  component: HelpPage,
});

function HelpPage() {
  const { t } = useLanguage();

  const categories = [
    {
      icon: BookOpen,
      title: t("help.categories.gettingStarted.title"),
      body: t("help.categories.gettingStarted.body"),
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: Wrench,
      title: t("help.categories.technical.title"),
      body: t("help.categories.technical.body"),
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      icon: Layers,
      title: t("help.categories.assets.title"),
      body: t("help.categories.assets.body"),
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: HelpCircle,
      title: t("help.categories.faq.title"),
      body: t("help.categories.faq.body"),
      color: "bg-emerald-500/10 text-emerald-500",
    },
  ];

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <header className="mb-16 text-center">
            <h1 className="font-display mb-4 text-4xl font-bold">
              {t("help.title")}
            </h1>
            <p className="text-base-content/60 text-lg">{t("help.subtitle")}</p>

            {/* Search Bar Placeholder */}
            <div className="mx-auto mt-10 max-w-2xl">
              <div className="relative">
                <Search className="text-base-content/40 absolute left-4 top-1/2 size-5 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t("help.search.placeholder")}
                  className="input input-bordered input-lg w-full pl-12 shadow-sm"
                  disabled
                />
              </div>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category, idx) => (
              <div
                key={idx}
                className="card bg-base-100 border-base-300 border shadow-sm transition-all hover:shadow-md"
              >
                <div className="card-body p-8">
                  <div
                    className={`mb-6 flex size-12 items-center justify-center rounded-xl ${category.color}`}
                  >
                    <category.icon className="size-6" />
                  </div>
                  <h2 className="font-display mb-3 text-xl font-bold">
                    {category.title}
                  </h2>
                  <p className="text-base-content/60 leading-relaxed">
                    {category.body}
                  </p>
                  <div className="card-actions mt-4 justify-end">
                    <button className="btn btn-ghost btn-sm text-primary">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support Section */}
          <div className="mt-16 text-center">
            <div className="card bg-neutral text-neutral-content shadow-xl">
              <div className="card-body items-center p-12 text-center">
                <div className="bg-primary/20 text-primary mb-6 flex size-16 items-center justify-center rounded-full">
                  <MessageCircle className="size-8" />
                </div>
                <h2 className="font-display mb-3 text-2xl font-bold">
                  {t("help.contact.title")}
                </h2>
                <p className="mx-auto max-w-xl text-lg opacity-80">
                  {t("help.contact.body")}
                </p>
                <div className="mt-8">
                  <a
                    href="mailto:support@potmagic.live"
                    className="btn btn-primary btn-wide"
                  >
                    Contact Stage Crew
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
