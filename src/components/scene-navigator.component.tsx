import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { getSceneNavigation } from '@/lib/scenes.fns'
import { cn } from '@/lib/cn'

interface SceneNavigatorProps {
  sceneId: string
}

export function SceneNavigator({ sceneId }: SceneNavigatorProps) {
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['scene-navigation', sceneId],
    queryFn: () => getSceneNavigation({ data: { sceneId } }),
  })

  if (isLoading || isError || !data) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-base-200 border border-base-300 rounded-xl px-3 py-2 shadow-lg">
      <button
        onClick={() =>
          data.prev &&
          router.navigate({ to: '/stage/$sceneId', params: { sceneId: data.prev.id } })
        }
        disabled={!data.prev}
        className={cn(
          'text-sm px-2 py-1 rounded-lg bg-base-300 border border-base-300 text-base-content transition-opacity',
          !data.prev && 'opacity-40 pointer-events-none',
        )}
      >
        ◀ Prev
      </button>
      <span className="max-w-[12rem] truncate text-sm font-semibold text-base-content">
        {data.current.title}
      </span>
      <button
        onClick={() =>
          data.next &&
          router.navigate({ to: '/stage/$sceneId', params: { sceneId: data.next.id } })
        }
        disabled={!data.next}
        className={cn(
          'text-sm px-2 py-1 rounded-lg bg-base-300 border border-base-300 text-base-content transition-opacity',
          !data.next && 'opacity-40 pointer-events-none',
        )}
      >
        Next ▶
      </button>
    </div>
  )
}
