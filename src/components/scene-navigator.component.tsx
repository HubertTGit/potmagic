import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { RoomEvent } from 'livekit-client';
import type { Room } from 'livekit-client';
import { authClient } from '@/lib/auth-client';
import { getSceneNavigation } from '@/lib/scenes.fns';

interface SceneNavigateMessage {
  type: 'scene:navigate';
  sceneId: string;
}

interface SceneNavigatorProps {
  sceneId: string;
  room?: Room | null;
}

export function SceneNavigator({ sceneId, room }: SceneNavigatorProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isDirector = session?.user?.role === 'director';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['scene-navigation', sceneId],
    queryFn: () => getSceneNavigation({ data: { sceneId } }),
  });

  // Subscribe to scene navigate messages from director
  useEffect(() => {
    if (!room) return;

    const handler = (payload: Uint8Array) => {
      let msg: SceneNavigateMessage;
      try {
        msg = JSON.parse(new TextDecoder().decode(payload)) as SceneNavigateMessage;
      } catch {
        return;
      }
      if (msg.type !== 'scene:navigate') return;
      router.navigate({ to: '/stage/$sceneId', params: { sceneId: msg.sceneId } });
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room, router]);

  function navigateTo(targetSceneId: string) {
    router.navigate({ to: '/stage/$sceneId', params: { sceneId: targetSceneId } });

    if (!room) return;
    const msg: SceneNavigateMessage = { type: 'scene:navigate', sceneId: targetSceneId };
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(msg)),
      { reliable: true },
    );
  }

  if (isLoading || isError || !data) return null;

  return (
    <div className="flex items-center gap-3 bg-base-200 border border-base-300 rounded-xl px-3 py-2 shadow-lg">
      <button
        onClick={() => navigateTo(data.prev!.id)}
        disabled={!isDirector || !data.prev}
        className="text-sm px-2 py-1 rounded-lg bg-base-300 border border-base-300 text-base-content transition-opacity disabled:opacity-40"
      >
        ◀ Prev
      </button>
      <span className="max-w-48 truncate text-sm font-semibold text-base-content">
        {data.current.title}
      </span>
      <button
        onClick={() => navigateTo(data.next!.id)}
        disabled={!isDirector || !data.next}
        className="text-sm px-2 py-1 rounded-lg bg-base-300 border border-base-300 text-base-content transition-opacity disabled:opacity-40"
      >
        Next ▶
      </button>
    </div>
  );
}
