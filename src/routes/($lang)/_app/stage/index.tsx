import { createFileRoute, Link } from '@tanstack/react-router';
import { useLanguage } from '@/hooks/useLanguage';

export const Route = createFileRoute('/($lang)/_app/stage/')({
  component: StagePage,
});

function StagePage() {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4">
      <p className="text-base-content/40 text-sm text-center max-w-xs">
        {t('stage.empty')}
      </p>
      <Link
        to={'/stories' as any}
        className="btn btn-sm btn-primary font-display tracking-[0.05em]"
      >
        {t('stage.goToStories')}
      </Link>
    </div>
  );
}
