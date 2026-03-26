import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getSceneStage } from "@/lib/scenes.fns";
import { getLiveKitToken } from "@/lib/livekit.fns";
import { SessionPermissionModal } from "@/components/session-permission-modal.component";
import { LiveKitRoom } from "@livekit/components-react";
import type { StoryStatus } from "@/components/stage/story-status-button.component";
import { LiveStageContent } from "./live-stage-content.component";
import { OfflineStageContent } from "./offline-stage-content.component";
import { StageProvider } from "./stage.context";

type MicState = "checking" | "prompt" | "granted" | "denied";

export interface SceneStagePageProps {
  sceneId: string;
}

export function SceneStagePage({ sceneId }: SceneStagePageProps) {
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
  const backgroundRepeat = data?.backgroundRepeat ?? false;
  const liveKitReady = !!livekitData && micResolved;
  const showMicModal =
    micState === "prompt" &&
    !micResolved &&
    (status === "draft" || status === "active");

  const stageData = {
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
    backgroundRepeat,
  };

  // Optional LiveKit hooks inside StageProvider might need the room safely, 
  // but since scene-stage-page doesn't have it, we just pass what we have.
  // The actual sound hooks inside StageProvider use it safely if omitted or null.
  return (
    <StageProvider {...stageData}>
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
          <LiveStageContent />
        </LiveKitRoom>
      ) : (
        <OfflineStageContent />
      )}
    </StageProvider>
  );
}
