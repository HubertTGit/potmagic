import { createFileRoute } from '@tanstack/react-router';
import {
  BookOpen,
  Drama,
  Clapperboard,
  Eye,
  MousePointerClick,
  RotateCcw,
  FlipHorizontal,
  Volume2,
  Radio,
  Users,
  Layers,
  FlaskConical,
  CalendarClock,
  Tv2,
  CircleOff,
  Keyboard,
} from 'lucide-react';

import { getMeta } from '@/i18n/meta';
import { useLanguage } from '@/hooks/useLanguage';

const BASE_URL = 'https://potmagic.com';

export const Route = createFileRoute('/($lang)/docs/')({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? 'en';
    return {
      meta: [
        { title: getMeta(locale, 'meta.docs.title') },
        { name: 'description', content: getMeta(locale, 'meta.docs.description') },
        { property: 'og:title', content: getMeta(locale, 'meta.docs.ogTitle') },
        { property: 'og:description', content: getMeta(locale, 'meta.docs.ogDescription') },
        { property: 'og:type', content: 'website' },
      ],
      links: [
        { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/docs` },
        { rel: 'alternate', hrefLang: 'de', href: `${BASE_URL}/de/docs` },
      ],
    };
  },
  component: DocsOverviewPage,
});

function DocsOverviewPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-14">

      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <BookOpen className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t('docs.overview.title')}</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          {t('docs.overview.subtitle')}
        </p>
      </div>

      {/* Roles */}
      <section>
        <h2 className="font-display mb-6 text-xl font-semibold">{t('docs.roles.heading')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <RoleCard
            icon={<Clapperboard className="size-8" />}
            title={t('docs.role.director.title')}
            color="primary"
            description={t('docs.role.director.description')}
            bullets={[
              t('docs.role.director.bullet1'),
              t('docs.role.director.bullet2'),
              t('docs.role.director.bullet3'),
              t('docs.role.director.bullet4'),
              t('docs.role.director.bullet5'),
              t('docs.role.director.bullet6'),
            ]}
          />
          <RoleCard
            icon={<Drama className="size-8" />}
            title={t('docs.role.actor.title')}
            color="accent"
            description={t('docs.role.actor.description')}
            bullets={[
              t('docs.role.actor.bullet1'),
              t('docs.role.actor.bullet2'),
              t('docs.role.actor.bullet3'),
              t('docs.role.actor.bullet4'),
              t('docs.role.actor.bullet5'),
            ]}
          />
          <RoleCard
            icon={<Eye className="size-8" />}
            title={t('docs.role.viewer.title')}
            color="success"
            description={t('docs.role.viewer.description')}
            bullets={[
              t('docs.role.viewer.bullet1'),
              t('docs.role.viewer.bullet2'),
              t('docs.role.viewer.bullet3'),
              t('docs.role.viewer.bullet4'),
            ]}
          />
        </div>
      </section>

      {/* Session lifecycle */}
      <section>
        <h2 className="font-display mb-8 text-xl font-semibold">{t('docs.howItWorks.heading')}</h2>
        <ul className="timeline timeline-vertical">

          <li>
            <div className="timeline-middle">
              <div className="bg-primary/15 border-primary/30 flex items-center justify-center rounded-full border p-2">
                <Clapperboard className="text-primary size-6" />
              </div>
            </div>
            <div className="timeline-end timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">{t('docs.lifecycle.step1.title')}</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                {t('docs.lifecycle.step1.body')}
              </p>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-start timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">{t('docs.lifecycle.step2.title')}</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                {t('docs.lifecycle.step2.body')}
              </p>
            </div>
            <div className="timeline-middle">
              <div className="bg-primary/15 border-primary/30 flex items-center justify-center rounded-full border p-2">
                <Users className="text-primary size-6" />
              </div>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-middle">
              <div className="bg-primary/15 border-primary/30 flex items-center justify-center rounded-full border p-2">
                <Layers className="text-primary size-6" />
              </div>
            </div>
            <div className="timeline-end timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">{t('docs.lifecycle.step3.title')}</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                {t('docs.lifecycle.step3.body')}
              </p>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-start timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">{t('docs.lifecycle.step4.title')}</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                {t('docs.lifecycle.step4.bodyPre')}{" "}
                <span className="badge badge-warning badge-xs font-semibold uppercase tracking-wider align-middle">draft</span>
                {" "}{t('docs.lifecycle.step4.bodyPost')}
              </p>
            </div>
            <div className="timeline-middle">
              <div className="bg-primary/15 border-primary/30 flex items-center justify-center rounded-full border p-2">
                <FlaskConical className="text-primary size-6" />
              </div>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-middle">
              <div className="bg-accent/15 border-accent/30 flex items-center justify-center rounded-full border p-2">
                <CalendarClock className="text-accent size-6" />
              </div>
            </div>
            <div className="timeline-end timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">{t('docs.lifecycle.step5.title')}</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                {t('docs.lifecycle.step5.body')}
              </p>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-start timeline-box border-base-300 bg-base-100 mb-10 max-w-md">
              <p className="font-display text-sm font-semibold">{t('docs.lifecycle.step6.title')}</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                {t('docs.lifecycle.step6.bodyPre')}{" "}
                <span className="badge badge-success badge-xs font-semibold uppercase tracking-wider align-middle">active</span>
                {t('docs.lifecycle.step6.bodyPost')}
              </p>
            </div>
            <div className="timeline-middle">
              <div className="bg-success/15 border-success/30 flex items-center justify-center rounded-full border p-2">
                <Tv2 className="text-success size-6" />
              </div>
            </div>
            <hr className="bg-base-300" />
          </li>

          <li>
            <hr className="bg-base-300" />
            <div className="timeline-middle">
              <div className="bg-error/15 border-error/30 flex items-center justify-center rounded-full border p-2">
                <CircleOff className="text-error size-6" />
              </div>
            </div>
            <div className="timeline-end timeline-box border-base-300 bg-base-100 max-w-md">
              <p className="font-display text-sm font-semibold">{t('docs.lifecycle.step7.title')}</p>
              <p className="text-base-content/60 mt-1 text-xs leading-relaxed">
                {t('docs.lifecycle.step7.bodyPre')}{" "}
                <span className="badge badge-xs font-semibold uppercase tracking-wider align-middle bg-black text-white border-black">ended</span>
                {t('docs.lifecycle.step7.bodyPost')}
              </p>
            </div>
          </li>

        </ul>
      </section>

      {/* Stage controls */}
      <section>
        <h2 className="font-display mb-6 text-xl font-semibold">{t('docs.stageControls.heading')}</h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          <ControlRow
            icon={<MousePointerClick className="size-4" />}
            label={t('docs.control.drag.label')}
            description={t('docs.control.drag.description')}
          />
          <ControlRow
            icon={<RotateCcw className="size-4" />}
            label={t('docs.control.rotate.label')}
            description={t('docs.control.rotate.description')}
          />
          <ControlRow
            icon={<FlipHorizontal className="size-4" />}
            label={t('docs.control.mirror.label')}
            description={t('docs.control.mirror.description')}
          />
          <ControlRow
            icon={<Volume2 className="size-4" />}
            label={t('docs.control.voice.label')}
            description={t('docs.control.voice.description')}
          />
          <ControlRow
            icon={<Keyboard className="size-4" />}
            label={t('docs.control.keyboard.label')}
            description={t('docs.control.keyboard.description')}
          />
        </div>
      </section>

      {/* Broadcast */}
      <section>
        <h2 className="font-display mb-4 text-xl font-semibold">{t('docs.broadcast.heading')}</h2>
        <div className="bg-base-100 border-base-300 flex items-start gap-4 rounded-2xl border p-6">
          <Radio className="text-accent mt-0.5 size-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('docs.broadcast.shareTitle')}</p>
            <p className="text-base-content/60 text-sm leading-relaxed">
              {t('docs.broadcast.shareBody')}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

function RoleCard({
  icon,
  title,
  color,
  description,
  bullets,
}: {
  icon: React.ReactNode;
  title: string;
  color: 'primary' | 'accent' | 'success';
  description: string;
  bullets: string[];
}) {
  const iconColor = { primary: 'text-primary', accent: 'text-accent', success: 'text-success' }[color];
  const dotColor = { primary: 'bg-primary', accent: 'bg-accent', success: 'bg-success' }[color];
  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-5 flex flex-col gap-4">
      <div>
        <div className={`${iconColor} mb-3`}>{icon}</div>
        <h3 className="font-display mb-1 text-sm font-semibold">{title}</h3>
        <p className="text-base-content/60 text-sm leading-relaxed">{description}</p>
      </div>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className={`${dotColor} mt-1.5 size-1.5 shrink-0 rounded-full`} />
            <span className="text-base-content/60 text-xs leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ControlRow({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="text-primary mt-0.5 shrink-0">{icon}</div>
      <div>
        <span className="font-display text-sm font-semibold">{label}</span>
        <p className="text-base-content/60 mt-0.5 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
