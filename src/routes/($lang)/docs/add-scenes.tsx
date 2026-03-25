import { createFileRoute } from '@tanstack/react-router';
import { Layers, Clapperboard } from 'lucide-react';
import { getMeta } from '@/i18n/meta';
import { useLanguage } from '@/hooks/useLanguage';

const BASE_URL = 'https://potmagic.com';

export const Route = createFileRoute('/($lang)/docs/add-scenes')({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? 'en';
    return {
      meta: [
        { title: getMeta(locale, 'meta.docs.addScenes.title') },
        { name: 'description', content: getMeta(locale, 'meta.docs.addScenes.description') },
      ],
      links: [
        { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/docs/add-scenes` },
        { rel: 'alternate', hrefLang: 'de', href: `${BASE_URL}/de/docs/add-scenes` },
      ],
    };
  },
  component: AddScenesPage,
});

function AddScenesPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-10">

      <div>
        <div className="mb-4 flex items-center gap-3">
          <Layers className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t('docs.addScenes.title')}</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          {t('docs.addScenes.subtitle')}
        </p>
      </div>

      <section>
        <h2 className="font-display mb-2 text-lg font-semibold">{t('docs.addScenes.whoCanAdd.heading')}</h2>
        <div className="bg-base-100 border-base-300 flex items-start gap-3 rounded-2xl border p-5">
          <Clapperboard className="text-primary mt-0.5 size-5 shrink-0" />
          <p className="text-base-content/70 text-sm leading-relaxed">
            {t('docs.addScenes.whoCanAdd.body')}{" "}
            <strong className="text-base-content">{t('docs.addScenes.whoCanAdd.role')}</strong>{" "}
            {t('docs.addScenes.whoCanAdd.bodyPost')}
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-6 text-lg font-semibold">{t('docs.addScenes.steps.heading')}</h2>
        <ul className="timeline timeline-vertical timeline-compact">
          {[
            {
              step: '1',
              title: t('docs.addScenes.step1.title'),
              body: t('docs.addScenes.step1.body'),
            },
            {
              step: '2',
              title: t('docs.addScenes.step2.title'),
              body: t('docs.addScenes.step2.body'),
            },
            {
              step: '3',
              title: t('docs.addScenes.step3.title'),
              body: t('docs.addScenes.step3.body'),
            },
            {
              step: '4',
              title: t('docs.addScenes.step4.title'),
              body: t('docs.addScenes.step4.body'),
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
        <h2 className="font-display mb-4 text-lg font-semibold">{t('docs.addScenes.rules.heading')}</h2>
        <div className="bg-base-100 border-base-300 divide-base-300 divide-y rounded-2xl border">
          {[
            {
              label: t('docs.addScenes.rule1.label'),
              desc: t('docs.addScenes.rule1.desc'),
            },
            {
              label: t('docs.addScenes.rule2.label'),
              desc: t('docs.addScenes.rule2.desc'),
            },
            {
              label: t('docs.addScenes.rule3.label'),
              desc: t('docs.addScenes.rule3.desc'),
            },
          ].map(({ label, desc }) => (
            <div key={label} className="px-5 py-4">
              <p className="font-display mb-1 text-sm font-semibold">{label}</p>
              <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold">{t('docs.addScenes.switching.heading')}</h2>
        <p className="text-base-content/60 text-sm leading-relaxed">
          {t('docs.addScenes.switching.body')}
        </p>
      </section>

    </div>
  );
}
