import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
  type TrackReference,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import { getPublicStory, getViewerToken } from "@/lib/show.fns";
import { cn } from "@/lib/cn";
import { useTheme, Theme } from "@/hooks/useTheme";

export const Route = createFileRoute("/show/$storyId")({
  head: () => ({
    meta: [
      { title: "Watch Live — potmagic: Live Story Theater" },
      {
        name: "description",
        content:
          "Watch a live interactive story performance on potmagic and interact directly with the actors in real-time.",
      },
      { property: "og:title", content: "Watch Live — potmagic" },
      {
        property: "og:description",
        content:
          "A live interactive story is happening now. Join the audience and interact directly with the actors.",
      },
      { property: "og:type", content: "video.other" },
      { name: "twitter:title", content: "Watch Live — potmagic" },
      {
        name: "twitter:description",
        content:
          "A live interactive story is happening now. Join the audience and interact directly with the actors.",
      },
    ],
  }),
  component: ShowPage,
});

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

function CanvasVideoPlayer() {
  const { theme } = useTheme();
  const tracks = useTracks([Track.Source.ScreenShare]);

  // Take the first screen share track in the room (always the director's canvas)
  const canvasTrack = tracks.find(
    (t): t is TrackReference => t.publication != null,
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const track = canvasTrack?.publication.track;

  useEffect(() => {
    if (!track || !videoRef.current) return;
    const el = videoRef.current;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  if (!canvasTrack) {
    return (
      <div className="bg-base-200 flex h-full w-full flex-col items-center justify-center">
        <img
          src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
          alt="potmagic"
          className="size-12 animate-bounce"
        />
        <span>The show will start shortly.</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-full w-full object-contain"
    />
  );
}

// Rendered inside LiveKitRoom
function ShowContent({
  storyTitle,
  onShowEnded,
}: {
  storyTitle: string;
  onShowEnded: () => void;
}) {
  const room = useRoomContext();
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme } = useTheme();

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

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
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
      className="bg-base-100 flex min-h-screen flex-col items-center"
    >
      <RoomAudioRenderer />

      {/* Top bar */}
      {!isFullscreen && (
        <div className="flex w-7xl items-center justify-between px-2 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="btn btn-ghost btn-sm btn-square"
              title="Home"
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
      )}

      {/*
        Stage container — this is the fullscreen element.
        requestFullscreen() is called on this div, so the browser makes only
        this element fill the viewport. The exit button lives inside so it
        remains visible during fullscreen.
      */}
      <div
        className={cn(
          "relative",
          isFullscreen
            ? "flex h-screen w-screen items-center justify-center bg-black"
            : "border-base-300 overflow-hidden rounded-xl border-2 shadow-xl",
        )}
        style={
          isFullscreen
            ? undefined
            : { width: STAGE_WIDTH, height: STAGE_HEIGHT }
        }
      >
        {/* Exit button — must be inside the fullscreen element to be visible */}
        {isFullscreen && (
          <button
            className="btn btn-ghost btn-sm absolute top-4 right-4 z-50 gap-2 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
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

        <CanvasVideoPlayer />
      </div>
    </div>
  );
}

function ShowPage() {
  const { storyId } = Route.useParams();
  const [forcedOffline, setForcedOffline] = useState(false);
  const { theme } = useTheme();

  const { data: story, isPending: storyPending } = useQuery({
    queryKey: ["public-story", storyId],
    queryFn: () => getPublicStory({ data: { storyId } }),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (story?.title) {
      document.title = `${story.title} — potmagic: Live Story Theater`;
      return () => {
        document.title = "potmagic: Live Story Theater";
      };
    }
  }, [story?.title]);

  const isActive = !forcedOffline && story?.status === "active";

  const { data: livekitData } = useQuery({
    queryKey: ["viewer-token", storyId],
    queryFn: () => getViewerToken({ data: { storyId } }),
    enabled: isActive,
    staleTime: Infinity,
  });

  if (storyPending) {
    return (
      <div className="bg-base-100 fixed inset-0 flex items-center justify-center">
        <img
          src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
          alt="potmagic"
          className="size-12 animate-bounce"
        />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="bg-base-100 fixed inset-0 flex flex-col items-center justify-center gap-3">
        <img
          src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
          alt="potmagic"
        />
        <p className="font-display text-base-content/60 text-2xl">
          Show not found
        </p>
      </div>
    );
  }

  if (forcedOffline || story.status === "ended") {
    return (
      <div className="bg-base-100 fixed inset-0 flex flex-col items-center justify-center gap-3">
        <img
          src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
          alt="potmagic"
        />
        <p className="font-display text-base-content text-2xl">{story.title}</p>
        <p className="text-base-content/50 text-sm">The show has ended</p>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="bg-base-100 fixed inset-0 flex flex-col items-center justify-center gap-3">
        <span className="text-4xl">🎭</span>
        <p className="font-display text-base-content/60 text-2xl">
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
        onShowEnded={() => setForcedOffline(true)}
      />
    </LiveKitRoom>
  ) : (
    <div className="bg-base-100 fixed inset-0 flex items-center justify-center">
      <span className="loading loading-dots loading-md text-primary" />
    </div>
  );
}
