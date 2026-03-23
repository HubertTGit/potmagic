import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { RoomEvent } from 'livekit-client';
import type { Room } from 'livekit-client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { getSceneNavigation } from '@/lib/scenes.fns';
import { updateSelectedScene } from '@/lib/story-detail.fns';

interface SceneNavigateMessage {
  type: 'scene:navigate';
  sceneId: string;
}

interface SceneNavigatorProps {
  sceneId: string;
  storyId: string;
  room?: Room | null;
}

export function SceneNavigator({ sceneId, storyId, room }: SceneNavigatorProps) {
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

    if (isDirector) {
      updateSelectedScene({ data: { storyId, sceneId: targetSceneId } }).catch(console.error);
    }

    if (!room) return;
    const msg: SceneNavigateMessage = { type: 'scene:navigate', sceneId: targetSceneId };
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(msg)),
      { reliable: true },
    );
  }

  if (isLoading || isError || !data) return null;

  return (
    <div className="flex items-center bg-base-200 border border-base-300 rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={() => navigateTo(data.prev!.id)}
        disabled={!isDirector || !data.prev}
        className="btn btn-sm btn-ghost rounded-none border-r border-base-300"
      >
        <ChevronLeft className="size-4" />
        Prev
      </button>
      <span className="px-3 text-sm font-semibold text-base-content max-w-48 truncate">
        {data.current.title}
      </span>
      <button
        onClick={() => navigateTo(data.next!.id)}
        disabled={!isDirector || !data.next}
        className="btn btn-sm btn-ghost rounded-none border-l border-base-300"
      >
        Next
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
