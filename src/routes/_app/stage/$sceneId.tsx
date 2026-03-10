import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getSceneStage } from '@/lib/scenes.fns'
import { StageComponent } from '@/components/stage.component'
import { CastPreview } from '@/components/cast-preview.component'

export const Route = createFileRoute('/_app/stage/$sceneId')({
  component: SceneStagePage,
})

function SceneStagePage() {
  const { sceneId } = Route.useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['stage', sceneId],
    queryFn: () => getSceneStage({ data: { sceneId } }),
  })

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-base-100">
        <p className="text-base-content/40 text-sm">Loading scene…</p>
      </div>
    )
  }

  const casts = data ?? []

  return (
    <>
      <CastPreview casts={casts} />
      <StageComponent casts={casts} />
    </>
  )
}
