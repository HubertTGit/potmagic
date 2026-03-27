import { createFileRoute } from '@tanstack/react-router';
import { Library, ImageIcon, Music, Sparkles, Clapperboard } from 'lucide-react';
import { getMeta } from '@/i18n/meta';
import { useLanguage } from '@/hooks/useLanguage';

const BASE_URL = 'https://potmagic.com';

export const Route = createFileRoute('/($lang)/docs/props')({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? 'en';
    return {
      meta: [
        { title: getMeta(locale, 'meta.docs.props.title') },
        { name: 'description', content: getMeta(locale, 'meta.docs.props.description') },
      ],
      links: [
        { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/docs/props` },
        { rel: 'alternate', hrefLang: 'de', href: `${BASE_URL}/de/docs/props` },
      ],
    };
  },
  component: PropsPage,
});

function PropsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-10">

      <div>
        <div className="mb-4 flex items-center gap-3">
          <Library className="size-7 text-primary" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t('docs.props.title')}</h1>
        </div>
        <p className="text-base-content/60 max-w-2xl text-base leading-relaxed">
          {t('docs.props.subtitle')}
        </p>
      </div>

      <section>
        <h2 className="font-display mb-2 text-lg font-semibold">{t('docs.props.whoCanManage.heading')}</h2>
        <div className="bg-base-100 border-base-300 flex items-start gap-3 rounded-2xl border p-5">
          <Clapperboard className="text-primary mt-0.5 size-5 shrink-0" />
          <p className="text-base-content/70 text-sm leading-relaxed">
            {t('docs.props.whoCanManage.body')}{" "}
            <strong className="text-base-content">{t('docs.props.whoCanManage.role')}</strong>{" "}
            {t('docs.props.whoCanManage.bodyPost')}
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-6 text-lg font-semibold">{t('docs.props.types.heading')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TypeCard
            icon={<ImageIcon className="size-5" />}
            title={t('docs.props.type.character.title')}
            description={t('docs.props.type.character.description')}
          />
          <TypeCard
            icon={<ImageIcon className="size-5" />}
            title={t('docs.props.type.background.title')}
            description={t('docs.props.type.background.description')}
          />
          <TypeCard
            icon={<Music className="size-5" />}
            title={t('docs.props.type.sound.title')}
            description={t('docs.props.type.sound.description')}
          />
          <TypeCard
            icon={<Sparkles className="size-5" />}
            title={t('docs.props.type.animation.title')}
            description={t('docs.props.type.animation.description')}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display mb-6 text-lg font-semibold">{t('docs.props.upload.heading')}</h2>
        <ul className="timeline timeline-vertical timeline-compact">
          {[
            {
              step: '1',
              title: t('docs.props.upload.step1.title'),
              body: t('docs.props.upload.step1.body'),
            },
            {
              step: '2',
              title: t('docs.props.upload.step2.title'),
              body: t('docs.props.upload.step2.body'),
            },
            {
              step: '3',
              title: t('docs.props.upload.step3.title'),
              body: t('docs.props.upload.step3.body'),
            },
            {
              step: '4',
              title: t('docs.props.upload.step4.title'),
              body: t('docs.props.upload.step4.body'),
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
        <h2 className="font-display mb-4 text-lg font-semibold">{t('docs.props.delete.heading')}</h2>
        <p className="text-base-content/60 text-sm leading-relaxed">
          {t('docs.props.delete.body')}
        </p>
      </section>

    </div>
  );
}

function TypeCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
      <div className="text-primary mb-3">{icon}</div>
      <h3 className="font-display mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-base-content/60 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
