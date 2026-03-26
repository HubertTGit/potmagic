import { StageShell } from "./stage-shell.component";
import { StagePresenceProvider } from "./stage.context";

// Rendered outside LiveKitRoom (before token is ready) — no presence or data sync
export function OfflineStageContent() {
  return (
    <StagePresenceProvider
      room={null}
      isDirector={false}
      onlineIds={new Set()}
      speakingIds={new Set()}
      isMuted={false}
      onToggleMute={() => {}}
    >
      <StageShell />
    </StagePresenceProvider>
  );
}
