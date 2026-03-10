import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSceneDetail, updateSceneTitle } from '@/lib/scenes.fns'
import { Breadcrumb } from '@/components/breadcrumb.component'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/_app/stories/$storyId/scenes/$sceneId')({
  component: SceneDetailPage,
})

type Prop = { id: string; name: string; type: string; imageUrl: string | null }

function SceneDetailPage() {
  const { storyId, sceneId } = Route.useParams()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['scene', storyId, sceneId],
    queryFn: () => getSceneDetail({ data: { storyId, sceneId } }),
  })

  const scene = data?.scene
  const story = data?.story
  const storyProps = data?.props ?? []

  const [title, setTitle] = useState('')
  const [sceneProps, setSceneProps] = useState<Prop[]>([])

  useEffect(() => {
    if (scene) setTitle(scene.title)
  }, [scene])

  const saveMutation = useMutation({
    mutationFn: (newTitle: string) => updateSceneTitle({ data: { sceneId, title: newTitle } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scene', storyId, sceneId] }),
  })

  const isTitleDirty = title !== (scene?.title ?? '')

  if (isLoading) {
    return <div className="p-8"><p className="text-base-content/40 text-sm">Loading…</p></div>
  }

  if (!scene || !story) {
    return <div className="p-8"><p className="text-base-content/40">Scene not found.</p></div>
  }

  const backgrounds = sceneProps.filter((p) => p.type === 'background')
  const characters = sceneProps.filter((p) => p.type === 'character')
  const availableBackgrounds = storyProps.filter(
    (p) => p.type === 'background' && !sceneProps.some((sp) => sp.id === p.id),
  )
  const availableCharacters = storyProps.filter(
    (p) => p.type === 'character' && !sceneProps.some((sp) => sp.id === p.id),
  )

  return (
    <div className="p-8 max-w-2xl">
      <Breadcrumb crumbs={[
        { label: 'Stories', to: '/stories/' },
        { label: story.title, to: '/stories/$storyId/', params: { storyId } },
        { label: scene.title },
      ]} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
        />
        <span className="text-sm text-base-content/40 whitespace-nowrap">
          Scene {scene.order} of {story.totalScenes}
        </span>
        <button
          disabled={!isTitleDirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate(title)}
          className={cn(
            'btn btn-sm btn-gold font-display tracking-[0.05em]',
            (!isTitleDirty || saveMutation.isPending) && 'opacity-40 cursor-not-allowed',
          )}
        >
          Save
        </button>
      </div>

      <PropSection
        label="Backgrounds"
        props={backgrounds}
        available={availableBackgrounds}
        onAdd={(p) => setSceneProps((prev) => [...prev, p])}
        onRemove={(id) => setSceneProps((prev) => prev.filter((p) => p.id !== id))}
      />

      <PropSection
        label="Characters"
        props={characters}
        available={availableCharacters}
        onAdd={(p) => setSceneProps((prev) => [...prev, p])}
        onRemove={(id) => setSceneProps((prev) => prev.filter((p) => p.id !== id))}
      />
    </div>
  )
}

function PropSection({
  label,
  props,
  available,
  onAdd,
  onRemove,
}: {
  label: string
  props: Prop[]
  available: Prop[]
  onAdd: (prop: Prop) => void
  onRemove: (propId: string) => void
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
        {label}
      </h2>

      <div className="flex flex-col gap-2 mb-3">
        {props.length === 0 ? (
          <p className="text-base-content/30 text-sm">None added yet.</p>
        ) : (
          props.map((prop) => (
            <div
              key={prop.id}
              className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
            >
              <div className="flex items-center gap-3">
                {prop.imageUrl ? (
                  <img src={prop.imageUrl} alt={prop.name} className="size-8 rounded object-cover bg-base-300" />
                ) : (
                  <div className="size-8 rounded bg-base-300 flex items-center justify-center text-base-content/40 text-xs font-mono">
                    img
                  </div>
                )}
                <span className="text-sm font-medium">{prop.name}</span>
              </div>
              <button
                onClick={() => onRemove(prop.id)}
                className="text-xs text-error/60 hover:text-error transition-colors"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {available.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {available.map((prop) => (
            <button
              key={prop.id}
              onClick={() => onAdd(prop)}
              className="btn btn-xs btn-outline btn-gold font-display"
            >
              + {prop.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
