import { useCallback } from "react";
import {
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { StageShell, type StageContentProps } from "./stage-shell.component";

// Rendered inside LiveKitRoom — can safely call useParticipants + useRoomContext
export function LiveStageContent({
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
        backgroundRepeat={backgroundRepeat}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
      />
    </>
  );
}
