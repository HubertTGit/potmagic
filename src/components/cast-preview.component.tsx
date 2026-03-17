import { FilmIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';
import type { StageCast } from '@/components/stage.component';

interface CastPreviewProps {
  casts: StageCast[];
  directorId: string;
  directorName: string;
  onlineIds?: Set<string>;
  speakingIds?: Set<string>;
  isMuted?: boolean;
  onToggleMute?: () => void;
  canMute?: boolean;
}

export function CastPreview({
  casts,
  directorId,
  directorName,
  onlineIds = new Set(),
  speakingIds = new Set(),
  isMuted = false,
  onToggleMute,
  canMute = false,
}: CastPreviewProps) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  if (!currentUserId) return null;

  const isCurrentUserDirector = currentUserId === directorId;
  const isDirectorOnline = onlineIds.has(directorId);
  const isDirectorSpeaking = speakingIds.has(directorId);
  const canClickMute = canMute && !!onToggleMute;

  return (
    <div className="flex items-center gap-2 bg-base-200 border border-base-300 rounded-xl px-3 py-2 shadow-lg">
      {/* Director avatar — first in list */}
      <div className="indicator">
        {(isDirectorOnline || isDirectorSpeaking) && (
          <span
            className={cn(
              'indicator-item badge min-w-0 p-0 rounded-full transition-all duration-300',
              isDirectorSpeaking
                ? 'bg-purple-500 border-purple-500 size-3 animate-bounce'
                : 'badge-success size-2',
            )}
          />
        )}
        {isCurrentUserDirector && isMuted && (
          <span className="indicator-item indicator-bottom indicator-end rounded-full bg-error size-4 flex items-center justify-center">
            <MicrophoneIcon className="size-2.5 text-error-content" />
          </span>
        )}
        <div
          className={cn(
            'size-8 rounded-full bg-base-300 flex items-center justify-center transition-all duration-300',
            isCurrentUserDirector &&
              'ring-2 ring-primary ring-offset-2 ring-offset-base-200 scale-110',
            isCurrentUserDirector && canClickMute && 'cursor-pointer',
          )}
          title={
            isCurrentUserDirector && canClickMute
              ? isMuted
                ? 'Unmute mic'
                : 'Mute mic'
              : directorName
          }
          onClick={isCurrentUserDirector && canClickMute ? onToggleMute : undefined}
        >
          <FilmIcon className="size-4 text-primary" />
        </div>
      </div>

      {casts
        .filter((c) => c.type !== 'background')
        .map((cast) => {
          const isMe = cast.userId === currentUserId;
          const isOnline = onlineIds.has(cast.userId);
          const isSpeaking = speakingIds.has(cast.userId);

          let ringClass = 'ring-1 ring-base-300';
          if (isMe) {
            ringClass =
              'ring-2 ring-primary ring-offset-2 ring-offset-base-200 scale-110';
          }

          const avatarContent = cast.path ? (
            <img
              src={cast.path}
              alt=""
              className={cn(
                'size-8 rounded-full object-cover bg-base-300 block transition-all duration-300',
                ringClass,
              )}
            />
          ) : (
            <div
              className={cn(
                'size-8 rounded-full bg-base-300 block transition-all duration-300',
                ringClass,
              )}
            />
          );

          return (
            <div key={cast.castId} className="indicator">
              {(isOnline || isSpeaking) && (
                <span
                  className={cn(
                    'indicator-item badge min-w-0 p-0 rounded-full transition-all duration-300',
                    isSpeaking
                      ? 'bg-purple-500 border-purple-500 size-3 animate-bounce'
                      : 'badge-success size-2',
                  )}
                />
              )}
              {isMe && isMuted && (
                <span className="indicator-item indicator-bottom indicator-end rounded-full bg-error size-4 flex items-center justify-center">
                  <MicrophoneIcon className="size-2.5 text-error-content" />
                </span>
              )}
              {isMe && canClickMute ? (
                <button
                  type="button"
                  onClick={onToggleMute}
                  title={isMuted ? 'Unmute mic' : 'Mute mic'}
                  className="cursor-pointer"
                >
                  {avatarContent}
                </button>
              ) : (
                avatarContent
              )}
            </div>
          );
        })}
    </div>
  );
}
