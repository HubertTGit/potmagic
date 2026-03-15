import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import type { Room } from 'livekit-client';
import {
  getPublicStory,
  getPublicSceneStage,
  getViewerToken,
} from '@/lib/show.fns';
import { StageComponent } from '@/components/stage.component';
import type { StageCast } from '@/components/stage.component';
import { cn } from '@/lib/cn';

export const Route = createFileRoute('/show/$storyId')({
  component: ShowPage,
});

interface SceneNavigateMessage {
  type: 'scene:navigate';
  sceneId: string;
}

interface StoryStatusMessage {
  type: 'story:status';
  status: string;
}

type DataMessage = SceneNavigateMessage | StoryStatusMessage;

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

// Rendered inside LiveKitRoom
function ShowContent({
  storyTitle,
  casts,
  onSceneNavigate,
  onShowEnded,
}: {
  storyTitle: string;
  casts: StageCast[];
  onSceneNavigate: (sceneId: string) => void;
  onShowEnded: () => void;
}) {
  const room = useRoomContext();
  const participants = useParticipants();
  const speakingIds = new Set(
    participants.filter((p) => p.isSpeaking).map((p) => p.identity),
  );
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageDims, setStageDims] = useState({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  // Listen to data channel messages
  useEffect(() => {
    const handler = (payload: Uint8Array) => {
      let msg: DataMessage;
      try {
        msg = JSON.parse(new TextDecoder().decode(payload)) as DataMessage;
      } catch {
        return;
      }
      if (msg.type === 'scene:navigate') {
        onSceneNavigate(msg.sceneId);
      } else if (msg.type === 'story:status' && msg.status !== 'active') {
        onShowEnded();
      }
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room, onSceneNavigate, onShowEnded]);

  // Track fullscreen state and resize canvas to fill screen
  useEffect(() => {
    const onChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (isFull) {
        const scale = Math.min(
          window.innerWidth / STAGE_WIDTH,
          window.innerHeight / STAGE_HEIGHT,
        );
        setStageDims({
          width: Math.round(STAGE_WIDTH * scale),
          height: Math.round(STAGE_HEIGHT * scale),
        });
      } else {
        setStageDims({ width: STAGE_WIDTH, height: STAGE_HEIGHT });
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      stageContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={stageContainerRef}
      className="min-h-screen flex flex-col items-center bg-base-100"
    >
      <RoomAudioRenderer />

      {/* Top bar — browser hides this when stageContainer is fullscreen */}
      <div className="flex items-center justify-between w-7xl py-4 px-2">
        <div className="flex items-center gap-3">
          <span className="font-display text-base-content font-semibold tracking-wide">
            {storyTitle}
          </span>
          <span className="badge badge-error badge-sm font-display tracking-widest uppercase text-[10px]">
            Live
          </span>
        </div>

        <button
          className="btn btn-ghost btn-sm gap-2"
          onClick={toggleFullscreen}
          title="Enter fullscreen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          <span className="text-xs">Enlarge</span>
        </button>
      </div>

      {/*
        Stage container — this is the fullscreen element.
        requestFullscreen() is called on this div, so the browser makes only
        this element fill the viewport. The exit button lives inside so it
        remains visible during fullscreen.
      */}
      <div
        className={cn(
          'relative',
          isFullscreen
            ? 'flex items-center justify-center bg-black w-screen h-screen'
            : 'rounded-xl border-2 border-base-300 shadow-xl overflow-hidden',
        )}
      >
        {/* Exit button — must be inside the fullscreen element to be visible */}
        {isFullscreen && (
          <button
            className="absolute top-4 right-4 z-50 btn btn-ghost btn-sm gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white"
            onClick={toggleFullscreen}
            title="Exit fullscreen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
              />
            </svg>
            <span className="text-xs">Exit</span>
          </button>
        )}

        <StageComponent
          casts={casts}
          room={room as Room}
          speakingIds={speakingIds}
          stageWidth={stageDims.width}
          stageHeight={stageDims.height}
        />
      </div>
    </div>
  );
}

function ShowPage() {
  const { storyId } = Route.useParams();
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [forcedOffline, setForcedOffline] = useState(false);

  const { data: story, isPending: storyPending } = useQuery({
    queryKey: ['public-story', storyId],
    queryFn: () => getPublicStory({ data: { storyId } }),
    refetchInterval: 10_000,
  });

  // Set initial scene once story loads
  useEffect(() => {
    if (story?.firstSceneId && !currentSceneId) {
      setCurrentSceneId(story.firstSceneId);
    }
  }, [story?.firstSceneId, currentSceneId]);

  const isActive = !forcedOffline && story?.status === 'active';

  const { data: livekitData } = useQuery({
    queryKey: ['viewer-token', storyId],
    queryFn: () => getViewerToken({ data: { storyId } }),
    enabled: isActive,
    staleTime: Infinity,
  });

  const { data: casts = [] } = useQuery({
    queryKey: ['public-scene-stage', currentSceneId],
    queryFn: () => getPublicSceneStage({ data: { sceneId: currentSceneId! } }),
    enabled: !!currentSceneId,
  });

  if (storyPending) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-base-100">
        <p className="text-base-content/40 text-sm">Loading…</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-base-100">
        <p className="text-2xl font-display text-base-content/60">
          Show not found
        </p>
      </div>
    );
  }

  if (forcedOffline || story.status === 'ended') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-base-100">
        <span className="text-4xl">🎭</span>
        <p className="text-2xl font-display text-base-content">
          The show has ended
        </p>
        <p className="text-base-content/50 text-sm">{story.title}</p>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-base-100">
        <span className="text-4xl">🎭</span>
        <p className="text-2xl font-display text-base-content/60">
          Not live yet
        </p>
        <p className="text-base-content/40 text-sm">
          {story.title} — check back soon
        </p>
      </div>
    );
  }

  return livekitData ? (
    <LiveKitRoom
      key={storyId}
      serverUrl={livekitData.serverUrl}
      token={livekitData.token}
      audio={true}
      video={false}
      connect={true}
    >
      <ShowContent
        storyTitle={story.title}
        casts={casts as StageCast[]}
        onSceneNavigate={setCurrentSceneId}
        onShowEnded={() => setForcedOffline(true)}
      />
    </LiveKitRoom>
  ) : (
    <div className="fixed inset-0 flex items-center justify-center bg-base-100">
      <span className="loading loading-dots loading-md text-gold" />
    </div>
  );
}
