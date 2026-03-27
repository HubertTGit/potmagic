import { useCallback } from "react";
import {
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { StageShell } from "./stage-shell.component";
import { StagePresenceProvider } from "./stage.context";
import { useStage } from "./stage.context";

// Rendered inside LiveKitRoom — can safely call useParticipants + useRoomContext
export function LiveStageContent() {
  const { directorId } = useStage();
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
    <StagePresenceProvider
      room={room}
      isDirector={isDirector}
      onlineIds={onlineIds}
      speakingIds={speakingIds}
      isMuted={isMuted}
      onToggleMute={onToggleMute}
    >
      <RoomAudioRenderer />
      <StageShell />
    </StagePresenceProvider>
  );
}
