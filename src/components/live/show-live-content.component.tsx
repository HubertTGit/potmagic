import { useEffect, useRef, useState } from "react";
import { RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Link } from "@tanstack/react-router";
import { Maximize2, Minimize2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { useTheme, Theme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";

import { LiveVideoPlayer } from "./live-video-player.component";

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
  const { t, langPrefix } = useLanguage();

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

          <button
            className="btn btn-ghost btn-sm gap-2"
            onClick={toggleFullscreen}
            title="Enter fullscreen"
          >
            <Maximize2 className="size-4" />
            <span className="text-xs">{t("show.enlarge")}</span>
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
            <Minimize2 className="size-4" />
            <span className="text-xs">{t("show.exit")}</span>
          </button>
        )}

        <LiveVideoPlayer />
      </div>
    </div>
  );
}
