import { createFileRoute, ErrorComponent } from '@tanstack/react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react';
import type { Room } from 'livekit-client';
import { getSceneStage } from '@/lib/scenes.fns';
import { getLiveKitToken } from '@/lib/livekit.fns';
import { StageComponent } from '@/components/stage.component';
import { CastPreview } from '@/components/cast-preview.component';
import { SceneNavigator } from '@/components/scene-navigator.component';
import {
  StoryStatusButton,
  type StoryStatus,
} from '@/components/story-status-button.component';
import type { StageCast } from '@/components/stage.component';

export const Route = createFileRoute('/_app/stage/$sceneId')({
  component: SceneStagePage,
  pendingComponent: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-base-100">
      <p className="text-base-content/40 text-sm">Loading scene…</p>
    </div>
  ),
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

interface StageContentProps {
  sceneId: string;
  casts: StageCast[];
  directorId: string;
  directorName: string;
  storyId: string;
  status: StoryStatus;
  isSwitching: boolean;
}

// Rendered inside LiveKitRoom — can safely call useParticipants + useRoomContext
function LiveStageContent({
  sceneId,
  casts,
  directorId,
  directorName,
  storyId,
  status,
  isSwitching,
}: StageContentProps) {
  const participants = useParticipants();
  const room = useRoomContext();
  const onlineIds = new Set(participants.map((p) => p.identity));
  const speakingIds = new Set(
    participants.filter((p) => p.isSpeaking).map((p) => p.identity),
  );

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
      />
    </>
  );
}

// Rendered outside LiveKitRoom (before token is ready) — no presence or data sync
function OfflineStageContent({
  sceneId,
  casts,
  directorId,
  directorName,
  storyId,
  status,
  isSwitching,
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
    />
  );
}

interface StageShellProps extends StageContentProps {
  onlineIds: Set<string>;
  speakingIds: Set<string>;
  room: Room | null;
}

function StageShell({
  sceneId,
  casts,
  directorId,
  directorName,
  storyId,
  status,
  onlineIds,
  speakingIds,
  isSwitching,
  room,
}: StageShellProps) {
  return (
    <div className="min-h-screen flex flex-col items-center gap-4 p-6">
      {isSwitching && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2.5 bg-base-100/75 backdrop-blur-md px-5 py-2 rounded-full border border-base-300 shadow-lg">
            <span className="loading loading-dots loading-xs text-gold" />
            <span className="text-[11px] font-display tracking-[0.18em] uppercase text-base-content/50">
              Changing scene
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between w-7xl">
        <StoryStatusButton storyId={storyId} status={status} room={room} />
        <SceneNavigator sceneId={sceneId} room={room} />
        <CastPreview
          casts={casts}
          directorId={directorId}
          directorName={directorName}
          onlineIds={onlineIds}
          speakingIds={speakingIds}
        />
      </div>
      <div className="rounded-xl border-2 border-base-300 shadow-xl overflow-hidden">
        <StageComponent casts={casts} room={room} speakingIds={speakingIds} />
      </div>
      <div></div>
    </div>
  );
}

type MicState = 'checking' | 'prompt' | 'granted' | 'denied';

function SceneStagePage() {
  const { sceneId } = Route.useParams();

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['stage', sceneId],
    queryFn: () => getSceneStage({ data: { sceneId } }),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const { data: livekitData } = useQuery({
    queryKey: ['livekit-token', data?.storyId],
    queryFn: () => getLiveKitToken({ data: { storyId: data!.storyId } }),
    enabled: !!data?.storyId,
    staleTime: Infinity,
  });

  const [micState, setMicState] = useState<MicState>('checking');
  const [micResolved, setMicResolved] = useState(false);

  useEffect(() => {
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setMicState(result.state as MicState);
        if (result.state !== 'prompt') setMicResolved(true);
      })
      .catch(() => {
        // Permissions API not supported — proceed directly
        setMicResolved(true);
      });
  }, []);

  if (isPending) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-base-100">
        <p className="text-base-content/40 text-sm">Loading scene…</p>
      </div>
    );
  }

  const casts = data?.casts ?? [];
  const directorId = data?.directorId ?? '';
  const directorName = data?.directorName ?? 'Director';
  const storyId = data?.storyId ?? '';
  const status = (data?.status ?? 'draft') as StoryStatus;
  const isSwitching = isFetching && isPlaceholderData;
  const liveKitReady = !!livekitData && micResolved;
  const showMicModal = micState === 'prompt' && !micResolved;

  return (
    <>
      {showMicModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg mb-2">Live Session</h3>
            <p className="text-base-content/70 text-sm mb-6">
              Join the remote session to collaborate with others in real-time.
              Your microphone will be used for live voice interactions. You can
              mute your microphone at any time.
            </p>
            <div className="modal-action flex-col gap-2">
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  setMicResolved(true);
                  setMicState('granted');
                }}
              >
                Enter Session
              </button>
              <button
                className="btn btn-ghost btn-sm w-full"
                onClick={() => {
                  setMicResolved(true);
                  setMicState('denied');
                }}
              >
                I don't want to join session.
              </button>
            </div>
          </div>
        </div>
      )}

      {liveKitReady ? (
        <LiveKitRoom
          key={data!.storyId}
          serverUrl={livekitData.serverUrl}
          token={livekitData.token}
          audio={micState !== 'denied'}
          video={false}
          connect={true}
        >
          <LiveStageContent
            sceneId={sceneId}
            casts={casts}
            directorId={directorId}
            directorName={directorName}
            storyId={storyId}
            status={status}
            isSwitching={isSwitching}
          />
        </LiveKitRoom>
      ) : (
        <OfflineStageContent
          sceneId={sceneId}
          casts={casts}
          directorId={directorId}
          directorName={directorName}
          storyId={storyId}
          status={status}
          isSwitching={isSwitching}
        />
      )}
    </>
  );
}
