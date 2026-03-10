import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getScene, getStory, type MockProp } from '../../../../../lib/mock-data'
import { cn } from '../../../../../lib/cn'

export const Route = createFileRoute('/_app/stories/$storyId/scenes/$sceneId')({
  component: SceneDetailPage,
})

function SceneDetailPage() {
  const { storyId, sceneId } = Route.useParams()
  const story = getStory(storyId)
  const scene = getScene(storyId, sceneId)

  const [title, setTitle] = useState(scene?.title ?? '')
  // Intentionally empty: scene-prop assignments are not in the schema.
  // The UI lets the director assign story-level props to this scene.
  const [sceneProps, setSceneProps] = useState<MockProp[]>([])

  const isTitleDirty = title !== (scene?.title ?? '')

  if (!story || !scene) {
    return (
      <div className="p-8">
        <p className="text-base-content/40">Scene not found.</p>
      </div>
    )
  }

  const totalScenes = story.scenes.length
  const sceneOrder = scene.order

  const backgrounds = sceneProps.filter((p) => p.type === 'background')
  const characters = sceneProps.filter((p) => p.type === 'character')

  const availableBackgrounds = story.props.filter(
    (p) => p.type === 'background' && !sceneProps.some((sp) => sp.id === p.id),
  )
  const availableCharacters = story.props.filter(
    (p) => p.type === 'character' && !sceneProps.some((sp) => sp.id === p.id),
  )

  const handleAddProp = (prop: MockProp) => {
    setSceneProps((prev) => [...prev, prop])
  }

  const handleRemoveProp = (propId: string) => {
    setSceneProps((prev) => prev.filter((p) => p.id !== propId))
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
        />
        <span className="text-sm text-base-content/40 whitespace-nowrap">
          Scene {sceneOrder} of {totalScenes}
        </span>
        <button
          disabled={!isTitleDirty}
          className={cn(
            'btn btn-sm btn-gold font-display tracking-[0.05em]',
            !isTitleDirty && 'opacity-40 cursor-not-allowed',
          )}
        >
          Save
        </button>
      </div>

      {/* Backgrounds */}
      <PropSection
        label="Backgrounds"
        props={backgrounds}
        available={availableBackgrounds}
        onAdd={handleAddProp}
        onRemove={handleRemoveProp}
        addLabel="+ Add Background"
      />

      {/* Characters */}
      <PropSection
        label="Characters"
        props={characters}
        available={availableCharacters}
        onAdd={handleAddProp}
        onRemove={handleRemoveProp}
        addLabel="+ Add Character"
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
  addLabel,
}: {
  label: string
  props: MockProp[]
  available: MockProp[]
  onAdd: (prop: MockProp) => void
  onRemove: (propId: string) => void
  addLabel: string
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
                <div className="size-8 rounded bg-base-300 flex items-center justify-center text-base-content/40 text-xs font-mono">
                  img
                </div>
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
