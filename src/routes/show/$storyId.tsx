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
import { getPublicStory, getPublicSceneStage, getViewerToken } from '@/lib/show.fns';
import { StageComponent } from '@/components/stage.component';
import type { StageCast } from '@/components/stage.component';

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

// Rendered inside LiveKitRoom
function ShowContent({
  storyTitle,
  casts,
  onSceneNavigate,
  onShowEnded,
  micEnabled,
  onMicToggle,
}: {
  storyTitle: string;
  casts: StageCast[];
  onSceneNavigate: (sceneId: string) => void;
  onShowEnded: () => void;
  micEnabled: boolean;
  onMicToggle: () => void;
}) {
  const room = useRoomContext();
  const participants = useParticipants();
  const speakingIds = new Set(
    participants.filter((p) => p.isSpeaking).map((p) => p.identity),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center bg-base-100"
    >
      <RoomAudioRenderer />

      {/* Top bar */}
      <div className="flex items-center justify-between w-5xl py-4 px-2">
        <div className="flex items-center gap-3">
          <span className="font-display text-base-content font-semibold tracking-wide">
            {storyTitle}
          </span>
          <span className="badge badge-error badge-sm font-display tracking-widest uppercase text-[10px]">
            Live
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mic toggle */}
          <button
            className="btn btn-ghost btn-sm gap-2"
            onClick={onMicToggle}
            title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micEnabled ? (
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
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            )}
            <span className="text-xs">{micEnabled ? 'Mute' : 'Unmute'}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            className="btn btn-ghost btn-sm gap-2"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
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
            ) : (
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
            )}
            <span className="text-xs">{isFullscreen ? 'Exit' : 'Enlarge'}</span>
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="rounded-xl border-2 border-base-300 shadow-xl overflow-hidden">
        <StageComponent
          casts={casts}
          room={room as Room}
          speakingIds={speakingIds}
        />
      </div>
    </div>
  );
}

function ShowPage() {
  const { storyId } = Route.useParams();
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [forcedOffline, setForcedOffline] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micPromptShown, setMicPromptShown] = useState(false);

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

  const handleMicToggle = () => {
    if (!micPromptShown && !micEnabled) {
      setMicPromptShown(true);
    } else {
      setMicEnabled((v) => !v);
    }
  };

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

  return (
    <>
      {/* Mic consent modal */}
      {micPromptShown && !micEnabled && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg mb-2">Enable Microphone</h3>
            <p className="text-base-content/70 text-sm mb-6">
              Allow your microphone so the performers can hear you during the
              live show. You can mute at any time.
            </p>
            <div className="modal-action flex-col gap-2">
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  setMicEnabled(true);
                  setMicPromptShown(false);
                }}
              >
                Enable Microphone
              </button>
              <button
                className="btn btn-ghost btn-sm w-full"
                onClick={() => setMicPromptShown(false)}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {livekitData ? (
        <LiveKitRoom
          key={storyId}
          serverUrl={livekitData.serverUrl}
          token={livekitData.token}
          audio={micEnabled}
          video={false}
          connect={true}
        >
          <ShowContent
            storyTitle={story.title}
            casts={casts as StageCast[]}
            onSceneNavigate={setCurrentSceneId}
            onShowEnded={() => setForcedOffline(true)}
            micEnabled={micEnabled}
            onMicToggle={handleMicToggle}
          />
        </LiveKitRoom>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-base-100">
          <span className="loading loading-dots loading-md text-gold" />
        </div>
      )}
    </>
  );
}
