import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/hooks/useLanguage';

type StoryStatus = 'draft' | 'active' | 'ended';

const STATUS_BADGE: Record<StoryStatus, string> = {
  draft: 'badge-warning',
  active: 'badge-success',
  ended: 'badge-neutral',
};

interface PublicStoryCardProps {
  id: string;
  title: string;
  status: StoryStatus;
}

export function PublicStoryCard({ id, title, status }: PublicStoryCardProps) {
  const { t, langPrefix } = useLanguage();
  const STATUS_LABEL: Record<StoryStatus, string> = {
    draft: t('status.draft'),
    active: t('status.active'),
    ended: t('status.ended'),
  };
  return (
    <div className="card bg-base-100 border border-primary/60 hover:ring-primary ring-2 ring-transparent ring-offset-2 ring-offset-base-100  transition-all duration-300">
      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="card-title font-display text-base leading-snug line-clamp-2">
            {title}
          </h2>
          <span
            className={cn(
              'badge badge-sm font-semibold uppercase tracking-wider shrink-0',
              STATUS_BADGE[status],
            )}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        {status === 'active' && (
          <div className="card-actions mt-auto pt-1">
            <Link
              to={`${langPrefix}/show/$storyId` as any}
              params={{ storyId: id }}
              className="btn btn-sm btn-primary w-full font-display tracking-wide"
            >
              {t('story.viewShow')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
