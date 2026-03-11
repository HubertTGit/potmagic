import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSceneDetail, updateSceneTitle, addSceneCast, removeSceneCast, getSceneNavigation } from '@/lib/scenes.fns'
import { Breadcrumb } from '@/components/breadcrumb.component'
import { cn } from '@/lib/cn'
import { authClient } from '@/lib/auth-client'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_app/stories/$storyId/scenes/$sceneId')({
  component: SceneDetailPage,
})

type CastMember = {
  id: string
  userId: string
  userName: string | null
  propId: string | null
  propName: string | null
  propImageUrl: string | null
  propType: 'background' | 'character' | null
}

function SceneDetailPage() {
  const { storyId, sceneId } = Route.useParams()
  const { data: session } = authClient.useSession()
  const isDirector = session?.user?.role === 'director'
  const queryClient = useQueryClient()
  const qk = ['scene', storyId, sceneId]

  const { data, isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => getSceneDetail({ data: { storyId, sceneId } }),
  })

  const { data: nav } = useQuery({
    queryKey: ['scene-navigation', sceneId],
    queryFn: () => getSceneNavigation({ data: { sceneId } }),
  })

  const scene = data?.scene
  const story = data?.story
  const storyCast: CastMember[] = (data?.storyCast ?? []) as CastMember[]
  const sceneCastIds = new Set(data?.sceneCastIds ?? [])

  const [title, setTitle] = useState('')

  useEffect(() => {
    if (scene) setTitle(scene.title)
  }, [scene])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk })

  const saveMutation = useMutation({
    mutationFn: (newTitle: string) => updateSceneTitle({ data: { sceneId, title: newTitle } }),
    onSuccess: invalidate,
  })

  const addCastMutation = useMutation({
    mutationFn: (castId: string) => addSceneCast({ data: { sceneId, castId } }),
    onSuccess: invalidate,
  })

  const removeCastMutation = useMutation({
    mutationFn: (castId: string) => removeSceneCast({ data: { sceneId, castId } }),
    onSuccess: invalidate,
  })

  const isTitleDirty = title !== (scene?.title ?? '')

  if (isLoading) {
    return <div className="p-8"><p className="text-base-content/40 text-sm">Loading…</p></div>
  }

  if (!scene || !story) {
    return <div className="p-8"><p className="text-base-content/40">Scene not found.</p></div>
  }

  const assignedCast = storyCast.filter((c) => sceneCastIds.has(c.id))
  const availableCast = storyCast.filter((c) => !sceneCastIds.has(c.id))
  const hasBackground = assignedCast.some((c) => c.propType === 'background')

  const handleAddCast = (castMember: CastMember) => {
    if (castMember.propType === 'background' && hasBackground) {
      toast.error('A background is already assigned to this scene. Remove it first.')
      return
    }
    addCastMutation.mutate(castMember.id)
  }

  return (
    <div className="p-8 max-w-2xl">
      <Breadcrumb crumbs={[
        { label: 'Stories', to: '/stories/' },
        { label: story.title, to: '/stories/$storyId/', params: { storyId } },
        { label: scene.title },
      ]} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {isDirector ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
          />
        ) : (
          <h1 className="flex-1 text-lg font-semibold">{scene.title}</h1>
        )}
        <div className="flex items-center gap-1 text-sm text-base-content/40 whitespace-nowrap">
          {nav?.prev ? (
            <Link
              to="/stories/$storyId/scenes/$sceneId"
              params={{ storyId, sceneId: nav.prev.id }}
              className="hover:text-base-content transition-colors"
            >
              ‹
            </Link>
          ) : (
            <span className="opacity-20">‹</span>
          )}
          <span>
            <strong className="text-base-content">{scene.order}</strong> of {story.totalScenes}
          </span>
          {nav?.next ? (
            <Link
              to="/stories/$storyId/scenes/$sceneId"
              params={{ storyId, sceneId: nav.next.id }}
              className="hover:text-base-content transition-colors"
            >
              ›
            </Link>
          ) : (
            <span className="opacity-20">›</span>
          )}
        </div>
        <Link
          to="/stage/$sceneId"
          params={{ sceneId }}
          disabled={assignedCast.length === 0}
          className={cn(
            'btn btn-sm btn-outline btn-gold font-display tracking-[0.05em]',
            assignedCast.length === 0 && 'opacity-40 cursor-not-allowed pointer-events-none',
          )}
        >
          Enter the scene →
        </Link>
        {isDirector && (
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
        )}
      </div>

      {/* Cast section */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
          Cast
        </h2>

        <div className="flex flex-col gap-2 mb-3">
          {assignedCast.length === 0 ? (
            <p className="text-base-content/30 text-sm">No cast assigned yet.</p>
          ) : (
            assignedCast.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
              >
                <div className="flex items-center gap-3">
                  {c.propImageUrl ? (
                    <img src={c.propImageUrl} alt={c.propName ?? ''} className="size-8 rounded object-cover bg-base-300 shrink-0" />
                  ) : (
                    <div className="size-8 rounded bg-base-300 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{c.userName}</span>
                    {c.propName && (
                      <span className="text-xs text-base-content/40">{c.propName}</span>
                    )}
                  </div>
                  {c.propType && (
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
                      c.propType === 'character' ? 'bg-gold/15 text-gold' : 'bg-info/15 text-info',
                    )}>
                      {c.propType}
                    </span>
                  )}
                </div>
                {isDirector && (
                  <button
                    onClick={() => removeCastMutation.mutate(c.id)}
                    disabled={removeCastMutation.isPending}
                    className="text-xs text-error/60 hover:text-error transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {isDirector && availableCast.length > 0 && (
          <CastDropdown
            availableCast={availableCast}
            onAdd={handleAddCast}
          />
        )}
      </div>
    </div>
  )
}

function CastDropdown({
  availableCast,
  onAdd,
}: {
  availableCast: CastMember[]
  onAdd: (castMember: CastMember) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative w-64">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-sm btn-outline btn-gold font-display w-full justify-start"
      >
        + Add cast member
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden">
          {availableCast.map((c) => (
            <button
              key={c.id}
              onMouseDown={(e) => { e.preventDefault(); onAdd(c); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-300 transition-colors"
            >
              {c.propImageUrl ? (
                <img src={c.propImageUrl} alt={c.propName ?? ''} className="size-8 rounded object-cover bg-base-300 shrink-0" />
              ) : (
                <div className="size-8 rounded bg-base-300 shrink-0" />
              )}
              <div className="flex flex-col text-left flex-1">
                <span className="font-medium">{c.userName}</span>
                {c.propName && (
                  <span className="text-xs text-base-content/40">{c.propName}</span>
                )}
              </div>
              {c.propType && (
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
                  c.propType === 'character' ? 'bg-gold/15 text-gold' : 'bg-info/15 text-info',
                )}>
                  {c.propType}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
