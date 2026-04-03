import { Clapperboard, Users, MicOff, Cat } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { VIEWER_PREFIX } from "@/lib/livekit.fns";
import { useLanguage } from "@/hooks/useLanguage";
import { useStage, useStagePresence } from "./stage.context";

export function CastPreview() {
  const { casts, directorId, directorName, status } = useStage();
  const { onlineIds, speakingIds, isMuted, onToggleMute } = useStagePresence();
  const { data: session } = authClient.useSession();
  const { t } = useLanguage();
  const currentUserId = session?.user?.id;
  const canMute = status === "draft" || status === "active";

  if (!currentUserId) return null;

  const isCurrentUserDirector = currentUserId === directorId;
  const isDirectorOnline = onlineIds.has(directorId);
  const isDirectorSpeaking = speakingIds.has(directorId);
  const canClickMute = canMute && !!onToggleMute;
  const viewerCount = [...onlineIds].filter((id) =>
    id.startsWith(VIEWER_PREFIX),
  ).length;
  const isViewerSpeaking = [...speakingIds].some((id) =>
    id.startsWith(VIEWER_PREFIX),
  );

  return (
    <div className="bg-base-200 border-base-300 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg">
      <div className="indicator">
        {(isDirectorOnline || isDirectorSpeaking) && (
          <span
            className={cn(
              "indicator-item badge min-w-0 rounded-full p-0 transition-all duration-300",
              isDirectorSpeaking
                ? "size-3 animate-bounce border-purple-500 bg-purple-500"
                : "badge-success size-2",
            )}
          />
        )}
        {isCurrentUserDirector && isMuted && (
          <span className="indicator-item indicator-bottom indicator-end bg-error flex size-4 items-center justify-center rounded-full">
            <MicOff className="text-error-content size-2.5" />
          </span>
        )}
        <div
          className={cn(
            "bg-base-300 flex size-8 items-center justify-center rounded-full transition-all duration-300",
            isCurrentUserDirector &&
              "ring-primary ring-offset-base-200 scale-110 ring-2 ring-offset-2",
            isCurrentUserDirector && canClickMute && "cursor-pointer",
          )}
          title={
            isCurrentUserDirector && canClickMute
              ? isMuted
                ? t('cast.unmuteMic')
                : t('cast.muteMic')
              : directorName
          }
          onClick={
            isCurrentUserDirector && canClickMute ? onToggleMute : undefined
          }
        >
          <Clapperboard className="text-primary size-4" />
        </div>
      </div>

      {casts
        .filter((c) => c.type !== "background")
        .map((cast) => {
          const isMe = cast.userId === currentUserId;
          const isOnline = onlineIds.has(cast.userId);
          const isSpeaking = speakingIds.has(cast.userId);

          let ringClass = "ring-1 ring-base-300";
          if (isMe) {
            ringClass =
              "ring-2 ring-primary ring-offset-2 ring-offset-base-200 scale-110";
          }

          const avatarContent =
            cast.type === "rive" ? (
              <div
                className={cn(
                  "tooltip tooltip-bottom bg-base-300 flex size-8 items-center justify-center rounded-full transition-all duration-300",
                  ringClass,
                )}
                data-tip={cast.propName}
              >
                <Cat className="text-base-content/50 size-4" />
              </div>
            ) : (cast.imageUrl || cast.path) ? (
            <img
              src={cast.imageUrl || cast.path!}
              alt=""
              className={cn(
                "bg-base-300 block size-8 rounded-full object-cover transition-all duration-300",
                ringClass,
              )}
            />
          ) : (
            <div
              className={cn(
                "bg-base-300 block size-8 rounded-full transition-all duration-300",
                ringClass,
              )}
            />
          );

          return (
            <div key={cast.castId} className="indicator">
              {(isOnline || isSpeaking) && (
                <span
                  className={cn(
                    "indicator-item badge min-w-0 rounded-full p-0 transition-all duration-300",
                    isSpeaking
                      ? "size-3 animate-bounce border-purple-500 bg-purple-500"
                      : "badge-success size-2",
                  )}
                />
              )}
              {isMe && isMuted && (
                <span className="indicator-item indicator-bottom indicator-end bg-error flex size-4 items-center justify-center rounded-full">
                  <MicOff className="text-error-content size-2.5" />
                </span>
              )}
              {isMe && canClickMute ? (
                <button
                  type="button"
                  onClick={onToggleMute}
                  title={isMuted ? t('cast.unmuteMic') : t('cast.muteMic')}
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

      {viewerCount > 0 && (
        <div className="indicator">
          <span
            className={cn(
              "indicator-item badge min-w-0 rounded-full p-0 transition-all duration-300",
              isViewerSpeaking
                ? "size-3 animate-bounce border-purple-500 bg-purple-500"
                : "badge-success size-2",
            )}
          />
          <span className="indicator-item indicator-start badge badge-sm badge-neutral min-w-0 px-1 text-[7px]">
            {viewerCount}
          </span>
          <div
            className={cn(
              "bg-base-300 flex size-8 items-center justify-center rounded-full transition-all duration-300",
              "ring-success ring-offset-base-200 ring-2 ring-offset-2",
            )}
          >
            <Users className="text-base-content/50 size-4" />
          </div>
        </div>
      )}
    </div>
  );
}
