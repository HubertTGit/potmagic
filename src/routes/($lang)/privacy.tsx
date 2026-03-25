import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ShieldCheck,
  Database,
  Eye,
  Share2,
  Video,
  Lock,
  UserCheck,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/($lang)/privacy")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "privacy.title") },
        {
          name: "description",
          content: "Learn how potmagic protects your privacy and data.",
        },
      ],
    };
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Database,
      title: t("privacy.collect.title"),
      body: t("privacy.collect.body"),
    },
    {
      icon: Eye,
      title: t("privacy.use.title"),
      body: t("privacy.use.body"),
    },
    {
      icon: Share2,
      title: t("privacy.sharing.title"),
      body: t("privacy.sharing.body"),
    },
    {
      icon: Video,
      title: t("privacy.live.title"),
      body: t("privacy.live.body"),
    },
    {
      icon: Lock,
      title: t("privacy.security.title"),
      body: t("privacy.security.body"),
    },
    {
      icon: UserCheck,
      title: t("privacy.rights.title"),
      body: t("privacy.rights.body"),
    },
  ];

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <header className="mb-16 text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl">
              <ShieldCheck className="size-10" />
            </div>
            <h1 className="font-display mb-4 text-4xl font-bold">
              {t("privacy.title")}
            </h1>
            <p className="text-base-content/60 text-sm">
              {t("privacy.lastUpdated")}
            </p>
            <p className="text-base-content/70 mx-auto mt-8 max-w-2xl text-lg leading-relaxed">
              {t("privacy.intro.body")}
            </p>
          </header>

          <div className="grid gap-6">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="card bg-base-100 border-base-300 border shadow-sm transition-all hover:shadow-md"
              >
                <div className="card-body flex-row gap-6 p-8">
                  <div className="bg-base-200 text-base-content/70 flex size-12 shrink-0 items-center justify-center rounded-xl">
                    <section.icon className="size-6" />
                  </div>
                  <div>
                    <h2 className="font-display mb-2 text-xl font-bold">
                      {section.title}
                    </h2>
                    <p className="text-base-content/60 leading-relaxed">
                      {section.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Contact Card */}
            <div className="card bg-primary text-primary-content mt-8 shadow-xl">
              <div className="card-body flex-row items-center gap-6 p-10">
                <div className="bg-white/20 flex size-14 shrink-0 items-center justify-center rounded-full">
                  <Mail className="size-7" />
                </div>
                <div>
                  <h2 className="font-display mb-1 text-2xl font-bold">
                    {t("privacy.contact.title")}
                  </h2>
                  <p className="opacity-90">{t("privacy.contact.body")}</p>
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
