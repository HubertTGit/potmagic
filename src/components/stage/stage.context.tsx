import { createContext, useContext, useState, type ReactNode } from "react";
import type { Room } from "livekit-client";
import type { StageCast } from "@/components/stage.component";
import type { StoryStatus } from "@/components/stage/story-status-button.component";
import { useSceneSound } from "@/hooks/useSceneSound";

export interface StageData {
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

export interface StageContextValue extends StageData {
  playing: boolean;
  volume: number;
  setPlaying: (p: boolean) => void;
  setVolume: (v: number) => void;
}

const StageContext = createContext<StageContextValue | null>(null);

export function useStage() {
  const ctx = useContext(StageContext);
  if (!ctx) {
    throw new Error("useStage must be used within a StageProvider");
  }
  return ctx;
}

export interface StageProviderProps extends StageData {
  children: ReactNode;
  room?: Room | null; // Optional: we can feed room if we want useSceneSound here
  isDirector?: boolean;
}

export function StageProvider({ children, room, isDirector, ...props }: StageProviderProps) {
  const { playing, volume, setPlaying, setVolume } = useSceneSound({
    room: room || null,
    isDirector: isDirector || false,
    soundUrl: props.soundUrl,
    soundAutoplay: props.soundAutoplay,
  });

  return (
    <StageContext.Provider
      value={{
        ...props,
        playing,
        volume,
        setPlaying,
        setVolume,
      }}
    >
      {children}
    </StageContext.Provider>
  );
}

// Presence Context (dependent on LiveKit)
export interface StagePresence {
  room: Room | null;
  isDirector: boolean;
  onlineIds: Set<string>;
  speakingIds: Set<string>;
  isMuted: boolean;
  onToggleMute: () => void;
}

const StagePresenceContext = createContext<StagePresence | null>(null);

export function useStagePresence() {
  const ctx = useContext(StagePresenceContext);
  if (!ctx) {
    throw new Error("useStagePresence must be used within a StagePresenceProvider");
  }
  return ctx;
}

export interface StagePresenceProviderProps extends StagePresence {
  children: ReactNode;
}

export function StagePresenceProvider({
  children,
  ...props
}: StagePresenceProviderProps) {
  return (
    <StagePresenceContext.Provider value={props}>
      {children}
    </StagePresenceContext.Provider>
  );
}


