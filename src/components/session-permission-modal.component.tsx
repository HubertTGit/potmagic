import { useLanguage } from '@/hooks/useLanguage';

export function SessionPermissionModal({
  onEnter,
  onDecline,
}: {
  onEnter: () => void;
  onDecline: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        <h3 className="mb-2 text-lg font-bold">{t('session.title')}</h3>
        <p className="text-base-content/70 mb-6 text-sm">
          {t('session.description')}
        </p>
        <div className="modal-action flex-col gap-2">
          <button className="btn btn-primary w-full" onClick={onEnter}>
            {t('session.enter')}
          </button>
          <button className="btn btn-ghost btn-sm w-full" onClick={onDecline}>
            {t('session.decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
