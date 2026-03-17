import { Film, Mic, Users } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';
import { VIEWER_PREFIX } from '@/lib/livekit.fns';
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
  viewersMuted?: boolean;
  onMuteViewers?: (muted: boolean) => void;
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
  viewersMuted = false,
  onMuteViewers,
}: CastPreviewProps) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  if (!currentUserId) return null;

  const isCurrentUserDirector = currentUserId === directorId;
  const isDirectorOnline = onlineIds.has(directorId);
  const isDirectorSpeaking = speakingIds.has(directorId);
  const canClickMute = canMute && !!onToggleMute;
  const viewerCount = [...onlineIds].filter((id) =>
    id.startsWith(VIEWER_PREFIX),
  ).length;

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
            <Mic className="size-2.5 text-error-content" />
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
          onClick={
            isCurrentUserDirector && canClickMute ? onToggleMute : undefined
          }
        >
          <Film className="size-4 text-primary" />
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
                  <Mic className="size-2.5 text-error-content" />
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

      {/* Viewer group — shown when at least one viewer is online */}
      {viewerCount > 0 && (
        <div className="indicator">
          {/* Online dot — top-right */}
          <span className="indicator-item badge min-w-0 p-0 rounded-full badge-success size-2" />
          {/* Viewer count — top-left */}
          <span className="indicator-item indicator-start badge badge-sm badge-neutral min-w-0 px-1 text-[7px]">
            {viewerCount}
          </span>
          {/* Muted mic — bottom-right (matches per-user style) */}
          {viewersMuted && (
            <span className="indicator-item indicator-bottom indicator-end rounded-full bg-error size-4 flex items-center justify-center">
              <Mic className="size-2.5 text-error-content" />
            </span>
          )}
          {isCurrentUserDirector && canMute && onMuteViewers ? (
            <button
              type="button"
              onClick={() => onMuteViewers(!viewersMuted)}
              title={viewersMuted ? 'Unmute all viewers' : 'Mute all viewers'}
              className="cursor-pointer"
            >
              <div
                className={cn(
                  'size-8 rounded-full bg-base-300 flex items-center justify-center transition-all duration-300',
                  'ring-2 ring-success ring-offset-2 ring-offset-base-200',
                )}
              >
                <Users className="size-4 text-base-content/50" />
              </div>
            </button>
          ) : (
            <div
              className={cn(
                'size-8 rounded-full bg-base-300 flex items-center justify-center transition-all duration-300',
                'ring-2 ring-success ring-offset-2 ring-offset-base-200',
              )}
            >
              <Users className="size-4 text-base-content/50" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
