import { createFileRoute, ErrorComponent } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
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

  const { data } = useSuspenseQuery({
    queryKey: ['stage', sceneId],
    queryFn: () => getSceneStage({ data: { sceneId } }),
  })

  return (
    <>
      <SceneNavigator sceneId={sceneId} />
      <CastPreview casts={data} />
      <StageComponent casts={data} />
    </>
  )
}
