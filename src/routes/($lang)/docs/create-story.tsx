import { createFileRoute } from '@tanstack/react-router';
import { FilePlus, Clapperboard } from 'lucide-react';
import { getMeta } from '@/i18n/meta';
import { useLanguage } from '@/hooks/useLanguage';

const BASE_URL = 'https://potmagic.com';

export const Route = createFileRoute('/($lang)/docs/create-story')({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? 'en';
    return {
      meta: [
        { title: getMeta(locale, 'meta.docs.createStory.title') },
        { name: 'description', content: getMeta(locale, 'meta.docs.createStory.description') },
      ],
      links: [
        { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/docs/create-story` },
        { rel: 'alternate', hrefLang: 'de', href: `${BASE_URL}/de/docs/create-story` },
      ],
    };
  },
  component: CreateStoryPage,
});

function CreateStoryPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-10">

      <div>
        <div className="mb-4 flex items-center gap-3">
          <FilePlus className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t('docs.createStory.title')}</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          {t('docs.createStory.subtitle')}
        </p>
      </div>

      <section>
        <h2 className="font-display mb-2 text-lg font-semibold">{t('docs.createStory.whoCanCreate.heading')}</h2>
        <div className="bg-base-100 border-base-300 flex items-start gap-3 rounded-2xl border p-5">
          <Clapperboard className="text-primary mt-0.5 size-5 shrink-0" />
          <p className="text-base-content/70 text-sm leading-relaxed">
            {t('docs.createStory.whoCanCreate.body')}{" "}
            <strong className="text-base-content">{t('docs.createStory.whoCanCreate.role')}</strong>{" "}
            {t('docs.createStory.whoCanCreate.bodyPost')}
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-6 text-lg font-semibold">{t('docs.createStory.steps.heading')}</h2>
        <ul className="timeline timeline-vertical timeline-compact">
          {[
            {
              step: '1',
              title: t('docs.createStory.step1.title'),
              body: t('docs.createStory.step1.body'),
            },
            {
              step: '2',
              title: t('docs.createStory.step2.title'),
              body: t('docs.createStory.step2.body'),
            },
            {
              step: '3',
              title: t('docs.createStory.step3.title'),
              body: t('docs.createStory.step3.body'),
            },
            {
              step: '4',
              title: t('docs.createStory.step4.title'),
              body: t('docs.createStory.step4.body'),
            },
          ].map(({ step, title, body }, index, arr) => (
            <li key={step}>
              {index > 0 && <hr className="bg-primary/30" />}
              <div className="timeline-middle">
                <span className="bg-primary/10 text-primary font-display flex size-7 items-center justify-center rounded-full text-sm font-semibold">
                  {step}
                </span>
              </div>
              <div className="timeline-end timeline-box mb-6 border-base-300 bg-base-100">
                <p className="font-display mb-1 text-sm font-semibold">{title}</p>
                <p className="text-base-content/60 text-sm leading-relaxed">{body}</p>
              </div>
              {index < arr.length - 1 && <hr className="bg-primary/30" />}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">{t('docs.createStory.status.heading')}</h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          {[
            {
              badge: t('docs.createStory.status.draft.badge'),
              color: 'badge-warning',
              desc: t('docs.createStory.status.draft.desc'),
            },
            {
              badge: t('docs.createStory.status.active.badge'),
              color: 'badge-success',
              desc: t('docs.createStory.status.active.desc'),
            },
            {
              badge: t('docs.createStory.status.ended.badge'),
              color: 'badge-neutral',
              desc: t('docs.createStory.status.ended.desc'),
            },
          ].map(({ badge, color, desc }) => (
            <div key={badge} className="flex items-start gap-4 px-5 py-4">
              <span className={`badge badge-sm font-semibold uppercase tracking-wider mt-0.5 ${color}`}>
                {badge}
              </span>
              <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
