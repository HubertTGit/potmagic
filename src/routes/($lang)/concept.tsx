import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Users,
  Globe,
  Map,
  Package,
  UserCheck,
  FlaskConical,
  Mic,
  MousePointerClick,
  Radio,
  Zap,
  Heart,
  Monitor,
  Wifi,
  Mail,
  Library,
} from "lucide-react";

const BASE_URL = "https://potmagic.live";

export const Route = createFileRoute("/($lang)/concept")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "meta.concept.title") },
        {
          name: "description",
          content: getMeta(locale, "meta.concept.description"),
        },
        {
          property: "og:title",
          content: getMeta(locale, "meta.concept.ogTitle"),
        },
        {
          property: "og:description",
          content: getMeta(locale, "meta.concept.ogDescription"),
        },
        { property: "og:type", content: "website" },
      ],
      links: [
        { rel: "alternate", hrefLang: "en", href: `${BASE_URL}/concept` },
        { rel: "alternate", hrefLang: "de", href: `${BASE_URL}/de/concept` },
      ],
    };
  },
  component: ConceptPage,
});

function ConceptPage() {
  const { t } = useLanguage();

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex-1">
        {/* ── Hero / Vision ── */}
        <section className="hero bg-base-100 relative min-h-[70vh] overflow-hidden">
          {/* Subtle curtain gradient backdrop */}
          <div className="from-accent/5 to-base-100 pointer-events-none absolute inset-0 bg-linear-to-b via-transparent" />
          <div className="hero-content relative z-10 max-w-3xl py-24 text-center">
            <div>
              <div className="badge badge-accent badge-lg mb-6 font-semibold tracking-wider uppercase">
                {t("concept.vision.badge")}
              </div>
              <h1 className="font-display mb-6 text-5xl leading-tight font-bold">
                {t("concept.vision.title")}
              </h1>
              <p className="text-base-content/70 mb-10 text-lg leading-relaxed">
                {t("concept.vision.bodyIntro")}{" "}
                <span className="text-accent font-semibold">potmagic</span>{" "}
                {t("concept.vision.bodyMid")}{" "}
                <em>{t("concept.vision.bodyCreate")}</em>{" "}
                {t("concept.vision.bodyTogether")}{" "}
                <span className="text-accent font-semibold">potmagic</span>{" "}
                {t("concept.vision.bodyConclusion")}
              </p>
            </div>
          </div>
        </section>

        {/* ── Director's Workshop ── */}
        <section className="bg-base-200 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <SectionLabel>{t("concept.workshop.sectionLabel")}</SectionLabel>
            <h2 className="font-display mb-4 text-3xl font-bold">
              {t("concept.workshop.title")}
            </h2>
            <p className="text-base-content/60 mb-12">
              {t("concept.workshop.subtitlePre")}{" "}
              <em>{t("concept.workshop.subtitleTitle")}</em>
              {t("concept.workshop.subtitlePost")}
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <WorkshopStep
                step="01"
                icon={<Map className="size-5" />}
                title={t("concept.workshop.step1.title")}
                items={[
                  {
                    label: t("concept.workshop.step1.item1.label"),
                    text: t("concept.workshop.step1.item1.text"),
                  },
                  {
                    label: t("concept.workshop.step1.item2.label"),
                    text: t("concept.workshop.step1.item2.text"),
                  },
                ]}
              />
              <WorkshopStep
                step="02"
                icon={<Package className="size-5" />}
                title={t("concept.workshop.step2.title")}
                items={[
                  {
                    label: t("concept.workshop.step2.item1.label"),
                    text: t("concept.workshop.step2.item1.text"),
                  },
                  {
                    label: t("concept.workshop.step2.item2.label"),
                    text: t("concept.workshop.step2.item2.text"),
                  },
                ]}
              />
              <WorkshopStep
                step="03"
                icon={<UserCheck className="size-5" />}
                title={t("concept.workshop.step3.title")}
                items={[
                  {
                    label: t("concept.workshop.step3.item1.label"),
                    text: t("concept.workshop.step3.item1.text"),
                  },
                  {
                    label: t("concept.workshop.step3.item2.label"),
                    text: t("concept.workshop.step3.item2.text"),
                  },
                ]}
              />
              <WorkshopStep
                step="04"
                icon={<FlaskConical className="size-5" />}
                title={t("concept.workshop.step4.title")}
                items={[
                  {
                    label: t("concept.workshop.step4.item1.label"),
                    text: t("concept.workshop.step4.item1.text"),
                  },
                  {
                    label: t("concept.workshop.step4.item2.label"),
                    text: t("concept.workshop.step4.item2.text"),
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ── Actor's Stage ── */}
        <section className="bg-base-100 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <SectionLabel>{t("concept.actor.sectionLabel")}</SectionLabel>
            <h2 className="font-display mb-4 text-3xl font-bold">
              {t("concept.actor.title")}
            </h2>
            <p className="text-base-content/60 mb-12">
              {t("concept.actor.subtitle")}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ActorFeature
                icon={<MousePointerClick className="size-5" />}
                title={t("concept.actor.entry.title")}
                description={t("concept.actor.entry.description")}
              />
              <ActorFeature
                icon={<Users className="size-5" />}
                title={t("concept.actor.control.title")}
                description={t("concept.actor.control.description")}
              />
              <ActorFeature
                icon={<Mic className="size-5" />}
                title={t("concept.actor.voice.title")}
                description={t("concept.actor.voice.description")}
              />
              <ActorFeature
                icon={<Globe className="size-5" />}
                title={t("concept.actor.interaction.title")}
                description={t("concept.actor.interaction.description")}
              />
            </div>
          </div>
        </section>

        {/* ── Showtime ── */}
        <section className="bg-base-200 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <SectionLabel>{t("concept.showtime.sectionLabel")}</SectionLabel>
            <h2 className="font-display mb-12 text-3xl font-bold">
              {t("concept.showtime.title")}
            </h2>

            <div className="flex flex-col gap-6">
              <ShowtimeRow
                icon={<Radio className="text-accent size-5" />}
                title={t("concept.showtime.link.title")}
                description={t("concept.showtime.link.description")}
              />
              <div className="divider my-0" />
              <ShowtimeRow
                icon={<Zap className="text-warning size-5" />}
                title={t("concept.showtime.engagement.title")}
                description={t("concept.showtime.engagement.description")}
              />
              <div className="divider my-0" />
              <ShowtimeRow
                icon={<Heart className="text-error size-5" />}
                title={t("concept.showtime.emotion.title")}
                description={t("concept.showtime.emotion.description")}
              />
            </div>
          </div>
        </section>

        {/* ── Technical Requirements ── */}
        <section className="bg-base-100 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <SectionLabel>{t("concept.tech.sectionLabel")}</SectionLabel>
            <h2 className="font-display mb-12 text-3xl font-bold">
              {t("concept.tech.title")}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TechCard
                icon={<Monitor className="size-5" />}
                title={t("concept.tech.platform.title")}
                spec={t("concept.tech.platform.spec")}
                detail={t("concept.tech.platform.detail")}
              />
              <TechCard
                icon={<Wifi className="size-5" />}
                title={t("concept.tech.performance.title")}
                spec={t("concept.tech.performance.spec")}
                detail={t("concept.tech.performance.detail")}
              />
              <TechCard
                icon={<Globe className="size-5" />}
                title={t("concept.tech.communication.title")}
                spec={t("concept.tech.communication.spec")}
                detail={t("concept.tech.communication.detail")}
              />
              <TechCard
                icon={<Mail className="size-5" />}
                title={t("concept.tech.account.title")}
                spec={t("concept.tech.account.spec")}
                detail={t("concept.tech.account.detail")}
              />
              <TechCard
                icon={<Library className="size-5" />}
                title={t("concept.tech.library.title")}
                spec={t("concept.tech.library.spec")}
                detail={t("concept.tech.library.detail")}
              />
            </div>
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="bg-base-200 py-24 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <p className="font-display text-base-content/80 text-2xl font-semibold italic">
              {t("concept.cta.quote")}
            </p>
            <div className="text-accent mt-2 font-semibold tracking-wide">
              {t("concept.cta.attribution")}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-accent mb-3 text-sm font-semibold tracking-widest uppercase">
      {children}
    </p>
  );
}

function WorkshopStep({
  step,
  icon,
  title,
  items,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  items: { label: string; text: string }[];
}) {
  return (
    <div className="card bg-base-100 border-base-300 border shadow-sm">
      <div className="card-body gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="font-display text-base-content/10 text-3xl leading-none font-bold">
            {step}
          </span>
          <div className="bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl">
            {icon}
          </div>
          <h3 className="font-display text-sm font-semibold">{title}</h3>
        </div>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.label}
              className="text-base-content/70 text-sm leading-relaxed"
            >
              <span className="text-base-content font-semibold">
                {item.label}:
              </span>{" "}
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActorFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card bg-base-200 border-base-300 border shadow-sm">
      <div className="card-body items-center gap-3 p-5 text-center">
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          {icon}
        </div>
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <p className="text-base-content/60 text-xs leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function ShowtimeRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-base-100 border-base-300 mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl border">
        {icon}
      </div>
      <div>
        <h3 className="font-display mb-1 text-base font-semibold">{title}</h3>
        <p className="text-base-content/60 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function TechCard({
  icon,
  title,
  spec,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  spec: string;
  detail: string;
}) {
  return (
    <div className="card bg-base-200 border-base-300 border shadow-sm">
      <div className="card-body gap-3 p-5">
        <div className="bg-neutral text-neutral-content flex size-10 items-center justify-center rounded-xl">
          {icon}
        </div>
        <p className="text-base-content/50 text-xs tracking-wider uppercase">
          {title}
        </p>
        <p className="font-display text-sm font-semibold">{spec}</p>
        <p className="text-base-content/60 text-xs leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}
