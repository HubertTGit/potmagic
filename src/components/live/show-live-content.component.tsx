import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useTheme, Theme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";

import { LiveVideoPlayer } from "./live-video-player.component";
import { getPublicSceneStage } from "@/lib/show.fns";

const StageComponent = lazy(() =>
  import("@/components/stage.component").then((m) => ({
    default: m.StageComponent,
  })),
);

interface SceneNavigateMessage {
  type: "scene:navigate";
  sceneId: string;
}

interface StoryStatusMessage {
  type: "story:status";
  status: string;
}

interface SoundStateMessage {
  type: "sound:state";
  url: string;
  playing: boolean;
  volume: number;
}

type DataMessage =
  | SceneNavigateMessage
  | StoryStatusMessage
  | SoundStateMessage;

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

// Rendered inside LiveKitRoom
export function ShowLiveContent({
  storyTitle,
  directorSubscription,
  initialSceneId,
  onShowEnded,
}: {
  storyTitle: string;
  directorSubscription: "standard" | "pro" | "advance";
  initialSceneId: string | null;
  onShowEnded: () => void;
}) {
  const room = useRoomContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(
    initialSceneId,
  );
  const { theme } = useTheme();
  const { t, langPrefix } = useLanguage();

  const isPremium =
    directorSubscription === "pro" || directorSubscription === "advance";

  const { data: stageData } = useQuery({
    queryKey: ["public-scene-stage", currentSceneId],
    queryFn: () => getPublicSceneStage({ data: { sceneId: currentSceneId! } }),
    enabled: isPremium && !!currentSceneId,
  });

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Listen to data channel messages
  useEffect(() => {
    const handler = (payload: Uint8Array) => {
      let msg: DataMessage;
      try {
        msg = JSON.parse(new TextDecoder().decode(payload)) as DataMessage;
      } catch {
        return;
      }
      if (msg.type === "story:status" && msg.status !== "active") {
        onShowEnded();
      } else if (msg.type === "scene:navigate") {
        setCurrentSceneId(msg.sceneId);
      } else if (msg.type === "sound:state") {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.src !== msg.url) {
          audio.src = msg.url;
        }
        audio.volume = msg.volume;
        if (msg.playing) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      }
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room, onShowEnded]);

  return (
    <div className="bg-base-100 flex min-h-screen flex-col items-center">
      <RoomAudioRenderer />

      {/* Top bar */}
      <div className="flex w-7xl items-center justify-between px-2 py-4">
        <div className="flex items-center gap-3">
          <Link
            to={`${langPrefix}/show` as any}
            className="btn btn-ghost btn-sm btn-square"
            title="Show"
          >
            <img
              src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
              alt="potmagic"
              className="size-5"
            />
          </Link>
          <span className="font-display text-base-content font-semibold tracking-wide">
            {storyTitle}
          </span>
          <span className="badge badge-error badge-sm font-display text-[10px] tracking-widest uppercase">
            Live
          </span>
        </div>
      </div>

      {/* Stage container */}
      <div
        className="border-base-300 relative overflow-hidden rounded-xl border-2 shadow-xl"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
      >
        {isPremium ? (
          <Suspense
            fallback={
              <div className="bg-base-200 flex h-full items-center justify-center">
                <span className="loading loading-spinner text-primary" />
              </div>
            }
          >
            <StageComponent 
              casts={stageData?.casts ?? []} 
              room={room} 
              backgroundRepeat={stageData?.backgroundRepeat ?? false} 
            />
          </Suspense>
        ) : (
          <LiveVideoPlayer />
        )}
      </div>
    </div>
  );
}
