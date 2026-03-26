import { StageShell, type StageContentProps } from "./stage-shell.component";

// Rendered outside LiveKitRoom (before token is ready) — no presence or data sync
export function OfflineStageContent({
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
  return (
    <StageShell
      sceneId={sceneId}
      casts={casts}
      directorId={directorId}
      directorName={directorName}
      storyId={storyId}
      status={status}
      onlineIds={new Set()}
      speakingIds={new Set()}
      isSwitching={isSwitching}
      room={null}
      isDirector={false}
      soundUrl={soundUrl}
      soundName={soundName}
      soundAutoplay={soundAutoplay}
      backgroundRepeat={backgroundRepeat}
      isMuted={false}
      onToggleMute={() => {}}
    />
  );
}
