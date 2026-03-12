import { FilmIcon } from '@heroicons/react/24/outline';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';
import type { StageCast } from '@/components/stage.component';

interface CastPreviewProps {
  casts: StageCast[];
  directorId: string;
  directorName: string;
  onlineIds?: Set<string>;
}

export function CastPreview({
  casts,
  directorId,
  directorName,
  onlineIds = new Set(),
}: CastPreviewProps) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  if (!currentUserId) return null;

  const isCurrentUserDirector = currentUserId === directorId;
  const isDirectorOnline = onlineIds.has(directorId);

  return (
    <div className="flex items-center gap-2 bg-base-200 border border-base-300 rounded-xl px-3 py-2 shadow-lg">
      {/* Director avatar — first in list */}
      <div className="indicator">
        {isDirectorOnline && (
          <span className="indicator-item badge badge-success size-2 min-w-0 p-0 rounded-full" />
        )}
        <div
          className={cn(
            'size-8 rounded-full bg-base-300 flex items-center justify-center transition-transform',
            isCurrentUserDirector &&
              'ring-2 ring-gold ring-offset-2 ring-offset-base-200 scale-110',
          )}
          title={directorName}
        >
          <FilmIcon className="size-4 text-gold" />
        </div>
      </div>

      {casts.map((cast) => {
        const isMe = cast.userId === currentUserId;
        const isOnline = onlineIds.has(cast.userId);
        const ringClass = isMe
          ? 'ring-2 ring-gold ring-offset-2 ring-offset-base-200 scale-110'
          : 'ring-1 ring-base-300';

        const avatar = cast.path ? (
          <img
            src={cast.path}
            alt=""
            className={cn(
              'size-8 rounded-full object-cover bg-base-300 block transition-transform',
              ringClass,
            )}
          />
        ) : (
          <div
            className={cn(
              'size-8 rounded-full bg-base-300 block transition-transform',
              ringClass,
            )}
          />
        );

        return (
          <div key={cast.castId} className="indicator">
            {isOnline && (
              <span className="indicator-item badge badge-success size-2 min-w-0 p-0 rounded-full" />
            )}
            {avatar}
          </div>
        );
      })}
    </div>
  );
}
