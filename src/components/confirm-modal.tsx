import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/hooks/useLanguage';

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  pendingText?: string;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  confirmButtonClass = 'btn-warning',
  onConfirm,
  onCancel,
  isPending = false,
  pendingText,
}: ConfirmModalProps) {
  const { t } = useLanguage();
  const resolvedConfirmText = confirmText ?? t('modal.confirm');
  const resolvedPendingText = pendingText ?? t('modal.confirming');

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{message}</p>
        <div className="modal-action">
          <button
            className={cn('btn', confirmButtonClass)}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? resolvedPendingText : resolvedConfirmText}
          </button>
          <button className="btn" onClick={onCancel} disabled={isPending}>
            {t('modal.cancel')}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onCancel}>
          {t('modal.close')}
        </button>
      </form>
    </dialog>
  );
}
