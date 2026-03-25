import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { getMeta } from "@/i18n/meta";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { lazy, useEffect, useRef, useState, useCallback, Suspense } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, LocalVideoTrack, Track } from "livekit-client";
import type { Room } from "livekit-client";
import { getSceneStage } from "@/lib/scenes.fns";
import { getLiveKitToken } from "@/lib/livekit.fns";
import type { StageCast } from "@/components/stage.component";
import { SessionPermissionModal } from "@/components/session-permission-modal.component";
import { CastPreview } from "@/components/cast-preview.component";
import { SceneNavigator } from "@/components/scene-navigator.component";
import {
  StoryStatusButton,
  type StoryStatus,
} from "@/components/story-status-button.component";
import { SoundControlBar } from "@/components/sound-control-bar.component";
import { BgPanningTool } from "@/components/bg-panning-tool.component";
import { useSceneSound } from "@/hooks/useSceneSound";

const StageComponent = lazy(() =>
  import("@/components/stage.component").then((m) => ({ default: m.StageComponent })),
);

export const Route = createFileRoute("/($lang)/_app/stage/$sceneId")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return { meta: [{ title: getMeta(locale, "meta.stage.title") }] };
  },
  component: SceneStagePage,
  pendingComponent: () => (
    <div className="bg-base-100 fixed inset-0 flex items-center justify-center">
      <img
        src="/icon-red.svg"
        className="size-10 animate-bounce dark:hidden"
        alt=""
      />
      <img
        src="/icon-white.svg"
        className="hidden size-10 animate-bounce dark:block"
        alt=""
      />
    </div>
  ),
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

interface StageContentProps {
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
}

// Rendered inside LiveKitRoom — can safely call useParticipants + useRoomContext
function LiveStageContent({
  sceneId,
  casts,
  directorId,
  directorName,
  storyId,
  status,
  isSwitching,
  soundUrl,
  soundName,
  soundAutoplay,
}: StageContentProps) {
  const participants = useParticipants();
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const onlineIds = new Set(participants.map((p) => p.identity));
  const speakingIds = new Set(
    participants.filter((p) => p.isSpeaking).map((p) => p.identity),
  );
  // Compute isDirector only once room is connected — localParticipant.identity
  // is empty string before connection so checking it too early always fails
  const isDirector =
    connectionState === ConnectionState.Connected &&
    room.localParticipant.identity === directorId;

  const isMuted = !isMicrophoneEnabled;
  const onToggleMute = useCallback(() => {
    if (connectionState !== ConnectionState.Connected) return;
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled).catch((err) => {
      console.error("Failed to toggle microphone:", err);
    });
  }, [localParticipant, isMicrophoneEnabled, connectionState]);

  return (
    <>
      <RoomAudioRenderer />
      <StageShell
        sceneId={sceneId}
        casts={casts}
        directorId={directorId}
        directorName={directorName}
        storyId={storyId}
        status={status}
        onlineIds={onlineIds}
        speakingIds={speakingIds}
        isSwitching={isSwitching}
        room={room}
        isDirector={isDirector}
        soundUrl={soundUrl}
        soundName={soundName}
        soundAutoplay={soundAutoplay}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
      />
    </>
  );
}

// Rendered outside LiveKitRoom (before token is ready) — no presence or data sync
function OfflineStageContent({
  sceneId,
  casts,
  directorId,
  directorName,
  storyId,
  status,
  isSwitching,
  soundUrl,
  soundName,
  soundAutoplay,
}: StageContentProps) {
  return (
    <StageShell
      sceneId={sceneId}
      casts={casts}
      directorId={directorId}
      directorName={directorName}
      storyId={storyId}
      status={status}
      onlineIds={new Set()}
      speakingIds={new Set()}
      isSwitching={isSwitching}
      room={null}
      isDirector={false}
      soundUrl={soundUrl}
      soundName={soundName}
      soundAutoplay={soundAutoplay}
      isMuted={false}
      onToggleMute={() => {}}
    />
  );
}

interface StageShellProps extends StageContentProps {
  onlineIds: Set<string>;
  speakingIds: Set<string>;
  room: Room | null;
  isDirector: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

function StageShell({
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
  isMuted,
  onToggleMute,
}: StageShellProps) {
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
              Changing scene
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
        <Suspense fallback={<div className="bg-base-200 flex h-180 w-7xl items-center justify-center"><span className="loading loading-spinner loading-lg text-primary" /></div>}>
          <StageComponent casts={casts} room={room} speakingIds={speakingIds} />
        </Suspense>
      </div>
      <div className="flex w-7xl items-center justify-between">
        <div>&nbsp;</div>
        <BgPanningTool
          isDirector={isDirector}
          room={room}
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

type MicState = "checking" | "prompt" | "granted" | "denied";

function SceneStagePage() {
  const { sceneId } = Route.useParams();

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["stage", sceneId],
    queryFn: () => getSceneStage({ data: { sceneId } }),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const { data: livekitData } = useQuery({
    queryKey: ["livekit-token", data?.storyId],
    queryFn: () => getLiveKitToken({ data: { storyId: data!.storyId } }),
    enabled: !!data?.storyId,
    staleTime: Infinity,
  });

  const [micState, setMicState] = useState<MicState>("checking");
  const [micResolved, setMicResolved] = useState(false);

  useEffect(() => {
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        setMicState(result.state as MicState);
        if (result.state !== "prompt") setMicResolved(true);
      })
      .catch(() => {
        // Permissions API not supported — proceed directly
        setMicResolved(true);
      });
  }, []);

  if (isPending) {
    return (
      <div className="bg-base-100 fixed inset-0 flex items-center justify-center">
        <img
          src="/icon-red.svg"
          className="size-10 animate-bounce dark:hidden"
          alt=""
        />
        <img
          src="/icon-white.svg"
          className="hidden size-10 animate-bounce dark:block"
          alt=""
        />
      </div>
    );
  }

  const casts = data?.casts ?? [];
  const directorId = data?.directorId ?? "";
  const directorName = data?.directorName ?? "Director";
  const storyId = data?.storyId ?? "";
  const status = (data?.status ?? "draft") as StoryStatus;
  const isSwitching = isFetching && isPlaceholderData;
  const soundUrl = data?.soundUrl ?? null;
  const soundName = data?.soundName ?? null;
  const soundAutoplay = data?.soundAutoplay ?? false;
  const liveKitReady = !!livekitData && micResolved;
  const showMicModal =
    micState === "prompt" &&
    !micResolved &&
    (status === "draft" || status === "active");

  return (
    <>
      {showMicModal && (
        <SessionPermissionModal
          onEnter={() => {
            setMicResolved(true);
            setMicState("granted");
          }}
          onDecline={() => {
            setMicResolved(true);
            setMicState("denied");
          }}
        />
      )}

      {liveKitReady ? (
        <LiveKitRoom
          key={data!.storyId}
          serverUrl={livekitData.serverUrl}
          token={livekitData.token}
          audio={micState !== "denied"}
          video={false}
          connect={true}
        >
          <LiveStageContent
            sceneId={sceneId}
            casts={casts}
            directorId={directorId}
            directorName={directorName}
            storyId={storyId}
            status={status}
            isSwitching={isSwitching}
            soundUrl={soundUrl}
            soundName={soundName}
            soundAutoplay={soundAutoplay}
          />
        </LiveKitRoom>
      ) : (
        <OfflineStageContent
          sceneId={sceneId}
          casts={casts}
          directorId={directorId}
          directorName={directorName}
          storyId={storyId}
          status={status}
          isSwitching={isSwitching}
          soundUrl={soundUrl}
          soundName={soundName}
          soundAutoplay={soundAutoplay}
        />
      )}
    </>
  );
}
