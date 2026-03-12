import { createFileRoute, ErrorComponent } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getSceneStage } from '@/lib/scenes.fns'
import { StageComponent } from '@/components/stage.component'
import { CastPreview } from '@/components/cast-preview.component'
import { SceneNavigator } from '@/components/scene-navigator.component'

export const Route = createFileRoute('/_app/stage/$sceneId')({
  component: SceneStagePage,
  pendingComponent: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-base-100">
      <p className="text-base-content/40 text-sm">Loading scene…</p>
    </div>
  ),
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
})

function SceneStagePage() {
  const { sceneId } = Route.useParams()

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['stage', sceneId],
    queryFn: () => getSceneStage({ data: { sceneId } }),
    placeholderData: keepPreviousData,
    throwOnError: true,
  })

  if (isPending) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-base-100">
        <p className="text-base-content/40 text-sm">Loading scene…</p>
      </div>
    )
  }

  return (
    <>
      {isFetching && isPlaceholderData && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2.5 bg-base-100/75 backdrop-blur-md px-5 py-2 rounded-full border border-base-300 shadow-lg">
            <span className="loading loading-dots loading-xs text-gold" />
            <span className="text-[11px] font-display tracking-[0.18em] uppercase text-base-content/50">
              Changing scene
            </span>
          </div>
        </div>
      )}
      <SceneNavigator sceneId={sceneId} />
      <CastPreview casts={data ?? []} />
      <StageComponent casts={data ?? []} />
    </>
  )
}
