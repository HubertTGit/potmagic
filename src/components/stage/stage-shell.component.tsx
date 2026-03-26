import { useRef, useEffect, Suspense, lazy } from "react";
import { StoryStatusButton, type StoryStatus } from "@/components/stage/story-status-button.component";
import { SceneNavigator } from "@/components/stage/scene-navigator.component";
import { CastPreview } from "@/components/stage/cast-preview.component";
import { BgPanningTool } from "@/components/stage/bg-panning-tool.component";
import { SoundControlBar } from "@/components/stage/sound-control-bar.component";
import { useLanguage } from "@/hooks/useLanguage";
import { useSceneSound } from "@/hooks/useSceneSound";
import { LocalVideoTrack, Track } from "livekit-client";
import type { Room } from "livekit-client";
import type { StageCast } from "@/components/stage.component";

export interface StageContentProps {
  sceneId: string;
  casts: StageCast[];
  directorId: string;
  directorName: string;
  storyId: string;
  status: StoryStatus;
  isSwitching: boolean;
  soundUrl: string | null;
  soundName: string | null;
  soundAutoplay: boolean;
  backgroundRepeat: boolean;
}

export interface StageShellProps extends StageContentProps {
  onlineIds: Set<string>;
  speakingIds: Set<string>;
  room: Room | null;
  isDirector: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

const StageComponent = lazy(() =>
  import("@/components/stage.component").then((m) => ({
    default: m.StageComponent,
  })),
);

export function StageShell({
  sceneId,
  casts,
  directorId,
  directorName,
  storyId,
  status,
  onlineIds,
  speakingIds,
  isSwitching,
  room,
  isDirector,
  soundUrl,
  soundName,
  soundAutoplay,
  backgroundRepeat,
  isMuted,
  onToggleMute,
}: StageShellProps) {
  const { t } = useLanguage();
  const stageWrapperRef = useRef<HTMLDivElement>(null);

  const { playing, volume, setPlaying, setVolume } = useSceneSound({
    room,
    isDirector,
    soundUrl,
    soundAutoplay,
  });

  useEffect(() => {
    if (!isDirector || !room) return;

    let publishedTrack: LocalVideoTrack | null = null;

    const publish = () => {
      // Query canvas from the wrapper div — more reliable than Konva internals
      const canvas = stageWrapperRef.current?.querySelector("canvas");
      if (!canvas) return;

      const stream = (canvas as HTMLCanvasElement).captureStream(30);
      const [mediaTrack] = stream.getVideoTracks();
      if (!mediaTrack) return;

      // userProvidedTrack=true: LiveKit won't call stop() on the canvas MediaStreamTrack
      publishedTrack = new LocalVideoTrack(mediaTrack, undefined, true);
      room.localParticipant
        .publishTrack(publishedTrack, {
          source: Track.Source.ScreenShare,
          name: "canvas-stream",
          simulcast: false,
        })
        .catch(console.error);
    };

    // isDirector is only true when ConnectionState.Connected, so room is ready
    publish();

    return () => {
      if (publishedTrack) {
        room.localParticipant.unpublishTrack(publishedTrack);
      }
    };
  }, [isDirector, room]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 p-6">
      {isSwitching && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center">
          <div className="bg-base-100/75 border-base-300 flex items-center gap-2.5 rounded-full border px-5 py-2 shadow-lg backdrop-blur-md">
            <span className="loading loading-dots loading-xs text-primary" />
            <span className="font-display text-base-content/50 text-[11px] tracking-[0.18em] uppercase">
              {t("stage.changingScene")}
            </span>
          </div>
        </div>
      )}

      <div className="flex w-7xl items-center justify-between">
        <StoryStatusButton storyId={storyId} status={status} room={room} />
        <div className="flex items-center gap-3">
          <SceneNavigator sceneId={sceneId} storyId={storyId} room={room} />
        </div>
        <CastPreview
          casts={casts}
          directorId={directorId}
          directorName={directorName}
          onlineIds={onlineIds}
          speakingIds={speakingIds}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          canMute={status === "draft" || status === "active"}
        />
      </div>
      <div
        ref={stageWrapperRef}
        className="border-base-300 overflow-hidden rounded-xl border-2 shadow-xl"
      >
        <Suspense
          fallback={
            <div className="bg-base-200 flex h-180 w-7xl items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          }
        >
          <StageComponent
            casts={casts}
            room={room}
            speakingIds={speakingIds}
            backgroundRepeat={backgroundRepeat}
          />
        </Suspense>
      </div>
      <div className="flex w-7xl items-center justify-between">
        <div>&nbsp;</div>
        <BgPanningTool
          isDirector={isDirector}
          room={room}
          backgroundRepeat={backgroundRepeat}
        />
        {isDirector && soundName && (
          <SoundControlBar
            soundName={soundName}
            playing={playing}
            volume={volume}
            onTogglePlay={() => setPlaying(!playing)}
            onVolumeChange={setVolume}
          />
        )}
      </div>
    </div>
  );
}
