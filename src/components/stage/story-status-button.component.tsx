import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RoomEvent } from 'livekit-client';
import type { Room } from 'livekit-client';
import { authClient } from '@/lib/auth-client';
import { useLanguage } from '@/hooks/useLanguage';
import { updateStoryStatus } from '@/lib/story-detail.fns';
import { Play, Pause, RefreshCw } from 'lucide-react';

export type StoryStatus = 'draft' | 'active' | 'ended';

interface StatusMessage {
  type: 'story:status';
  status: StoryStatus;
}

interface StoryStatusButtonProps {
  storyId: string;
  status: StoryStatus;
  room?: Room | null;
}

export function StoryStatusButton({
  storyId,
  status: initialStatus,
  room,
}: StoryStatusButtonProps) {
  const { t } = useLanguage();
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StoryStatus>(initialStatus);

  // Sync when prop changes (e.g. after page refetch)
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Subscribe to live status broadcasts from director
  useEffect(() => {
    if (!room) return;

    const handler = (payload: Uint8Array) => {
      let msg: StatusMessage;
      try {
        msg = JSON.parse(new TextDecoder().decode(payload)) as StatusMessage;
      } catch {
        return;
      }
      if (msg.type !== 'story:status') return;
      setStatus(msg.status);
      updateStoryStatus({ data: { storyId, status: msg.status } }).then(() =>
        queryClient.invalidateQueries({ queryKey: ['stage'] }),
      );
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room, storyId, queryClient]);

  const mutation = useMutation({
    mutationFn: (nextStatus: StoryStatus) =>
      updateStoryStatus({ data: { storyId, status: nextStatus } }),
    onSuccess: (_, nextStatus) => {
      setStatus(nextStatus);
      queryClient.invalidateQueries({ queryKey: ['stage'] });

      if (!room) return;
      const msg: StatusMessage = { type: 'story:status', status: nextStatus };
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(msg)),
        { reliable: true },
      );
    },
  });

  const isDirector = session?.user?.role === 'director';

  if (status === 'draft') {
    return (
      <button
        className="btn btn-success btn-sm gap-1.5"
        onClick={() => mutation.mutate('active')}
        disabled={!isDirector || mutation.isPending}
      >
        {t('stage.goLive')}
        {mutation.isPending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>
    );
  }

  if (status === 'active') {
    return (
      <button
        className="btn btn-error btn-sm gap-1.5"
        onClick={() => mutation.mutate('ended')}
        disabled={!isDirector || mutation.isPending}
      >
        {t('stage.endShow')}
        {mutation.isPending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <Pause className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      className="btn btn-ghost btn-sm gap-1.5"
      onClick={() => mutation.mutate('draft')}
      disabled={!isDirector || mutation.isPending}
    >
      {t('stage.resetToDraft')}
      {mutation.isPending ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
    </button>
  );
}
