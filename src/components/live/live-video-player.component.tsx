import { useEffect, useRef, useState } from "react";
import { useTracks, type TrackReference } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useTheme, Theme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Maximize, Minimize } from "lucide-react";

export function LiveVideoPlayer() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const tracks = useTracks([Track.Source.ScreenShare]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Take the first screen share track in the room (always the director's canvas)
  const canvasTrack = tracks.find(
    (track): track is TrackReference => track.publication != null,
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

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!canvasTrack) {
    return (
      <div className="bg-base-200 flex h-full w-full flex-col items-center justify-center">
        <img
          src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
          alt="potmagic"
          className="size-12 animate-bounce"
        />
        <span>{t("show.willStartShortly")}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-contain"
      />
      <button
        type="button"
        onClick={() => {
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }}
        className="btn btn-circle btn-ghost btn-sm hover:bg-neutral/20 absolute right-4 bottom-4 z-20"
      >
        {isFullscreen ? (
          <Minimize className="h-5 w-5 text-white shadow-sm" />
        ) : (
          <Maximize className="h-5 w-5 text-white shadow-sm" />
        )}
      </button>
    </div>
  );
}
