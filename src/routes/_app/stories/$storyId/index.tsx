import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStoryDetail,
  updateStoryTitle,
  addCast,
  removeCast,
  assignProp,
  addScene,
  removeScene,
} from '@/lib/story-detail.fns'
import { StatusBadge } from '@/components/status-badge.component'
import { Breadcrumb } from '@/components/breadcrumb.component'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/_app/stories/$storyId/')({
  component: StoryDetailPage,
})

function StoryDetailPage() {
  const { storyId } = Route.useParams()
  const queryClient = useQueryClient()
  const qk = ['story', storyId]

  const { data, isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => getStoryDetail({ data: { storyId } }),
  })

  const [title, setTitle] = useState('')
  const [activeTab, setActiveTab] = useState<'cast' | 'scenes'>('cast')
  const [newSceneTitle, setNewSceneTitle] = useState('')
  const [actorSearch, setActorSearch] = useState('')
  const [actorDropdownOpen, setActorDropdownOpen] = useState(false)
  const actorSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (data?.story) setTitle(data.story.title)
  }, [data?.story?.title])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actorSearchRef.current && !actorSearchRef.current.contains(e.target as Node)) {
        setActorDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk })

  const saveTitleMutation = useMutation({
    mutationFn: (t: string) => updateStoryTitle({ data: { storyId, title: t } }),
    onSuccess: invalidate,
  })

  const addCastMutation = useMutation({
    mutationFn: (userId: string) => addCast({ data: { storyId, userId } }),
    onSuccess: () => { invalidate(); setActorSearch(''); setActorDropdownOpen(false) },
  })

  const removeCastMutation = useMutation({
    mutationFn: (castId: string) => removeCast({ data: { castId } }),
    onSuccess: invalidate,
  })

  const assignPropMutation = useMutation({
    mutationFn: ({ castId, propId }: { castId: string; propId: string | null }) =>
      assignProp({ data: { castId, propId } }),
    onSuccess: invalidate,
  })

  const addSceneMutation = useMutation({
    mutationFn: (t: string) => addScene({ data: { storyId, title: t } }),
    onSuccess: () => { invalidate(); setNewSceneTitle('') },
  })

  const removeSceneMutation = useMutation({
    mutationFn: (sceneId: string) => removeScene({ data: { sceneId } }),
    onSuccess: invalidate,
  })

  if (isLoading) {
    return <div className="p-8"><p className="text-base-content/40 text-sm">Loading…</p></div>
  }

  if (!data) {
    return <div className="p-8"><p className="text-base-content/40">Story not found.</p></div>
  }

  const { story, cast, scenes, props: availableProps, availableActors } = data

  const castUserIds = new Set(cast.map((c) => c.userId))
  const usedPropIds = new Set(cast.map((c) => c.propId).filter(Boolean) as string[])
  const filteredActors = availableActors.filter(
    (u) =>
      !castUserIds.has(u.id) &&
      (u.name.toLowerCase().includes(actorSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(actorSearch.toLowerCase())),
  )

  const isTitleDirty = title !== story.title

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return
    addSceneMutation.mutate(newSceneTitle.trim())
  }

  return (
    <div className="p-8 max-w-3xl">
      <Breadcrumb crumbs={[
        { label: 'Stories', to: '/stories/' },
        { label: story.title },
      ]} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
        />
        <StatusBadge status={story.status} />
        <button
          disabled={!isTitleDirty || saveTitleMutation.isPending}
          onClick={() => saveTitleMutation.mutate(title)}
          className={cn(
            'btn btn-sm btn-gold font-display tracking-[0.05em]',
            (!isTitleDirty || saveTitleMutation.isPending) && 'opacity-40 cursor-not-allowed',
          )}
        >
          Save
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-border mb-6 border-base-300">
        {(['cast', 'scenes'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'tab font-display tracking-[0.05em] capitalize',
              activeTab === tab ? 'tab-active text-gold' : 'text-base-content/40',
            )}
          >
            {tab} ({tab === 'cast' ? cast.length : scenes.length})
          </button>
        ))}
      </div>

      {/* Cast tab */}
      {activeTab === 'cast' && (
        <div>
          {cast.length === 0 ? (
            <p className="text-base-content/40 text-sm mb-4">No actors cast yet.</p>
          ) : (
            <table className="table table-sm w-full mb-4">
              <thead>
                <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                  <th>Actor</th>
                  <th>Prop</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cast.map((c) => (
                  <tr key={c.id} className="hover:bg-base-200 transition-colors">
                    <td className="align-middle">{c.userName}</td>
                    <td className="align-middle">
                      <PropPicker
                        castId={c.id}
                        propId={c.propId ?? null}
                        propName={c.propName ?? null}
                        propImageUrl={c.propImageUrl ?? null}
                        propType={c.propType ?? null}
                        availableProps={availableProps}
                        usedPropIds={usedPropIds}
                        onAssign={(castId, propId) => assignPropMutation.mutate({ castId, propId })}
                      />
                    </td>
                    <td className="text-right align-middle">
                      <button
                        onClick={() => removeCastMutation.mutate(c.id)}
                        disabled={removeCastMutation.isPending}
                        className="text-xs text-error/60 hover:text-error transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {availableActors.length > 0 && (
            <div ref={actorSearchRef} className="relative w-64">
              <input
                type="text"
                value={actorSearch}
                onChange={(e) => { setActorSearch(e.target.value); setActorDropdownOpen(true) }}
                onFocus={() => setActorDropdownOpen(true)}
                placeholder="Search actors…"
                className="input input-sm w-full bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
              />
              {actorDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-base-200 border border-base-300 rounded-lg shadow-lg z-10 overflow-hidden">
                  {filteredActors.length === 0 ? (
                    <p className="text-xs text-base-content/40 px-3 py-2">No actors found</p>
                  ) : (
                    filteredActors.map((u) => (
                      <button
                        key={u.id}
                        onMouseDown={(e) => { e.preventDefault(); addCastMutation.mutate(u.id) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-base-300 transition-colors flex flex-col"
                      >
                        <span className="font-medium">{u.name}</span>
                        <span className="text-xs text-base-content/40">{u.email}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scenes tab */}
      {activeTab === 'scenes' && (
        <div>
          <div className="flex flex-col gap-2 mb-4">
            {scenes.length === 0 ? (
              <p className="text-base-content/40 text-sm">No scenes yet.</p>
            ) : (
              scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
                >
                  <span className="text-sm">
                    <span className="text-base-content/40 mr-2">{scene.order}.</span>
                    {scene.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/stories/$storyId/scenes/$sceneId"
                      params={{ storyId, sceneId: scene.id }}
                      className="text-xs text-gold hover:text-gold/70 transition-colors"
                    >
                      View →
                    </Link>
                    <button
                      onClick={() => removeSceneMutation.mutate(scene.id)}
                      disabled={removeSceneMutation.isPending}
                      className="text-xs text-error/60 hover:text-error transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddScene() }}
              placeholder="Scene title…"
              className="input input-sm bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10 w-56"
            />
            <button
              onClick={handleAddScene}
              disabled={addSceneMutation.isPending || !newSceneTitle.trim()}
              className={cn(
                'btn btn-sm btn-gold font-display',
                (addSceneMutation.isPending || !newSceneTitle.trim()) && 'opacity-40 cursor-not-allowed',
              )}
            >
              + Add Scene
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type Prop = {
  id: string
  name: string
  type: 'background' | 'character'
  imageUrl: string | null
}

function PropTypePill({ type }: { type: 'character' | 'background' }) {
  return (
    <span className={cn(
      'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
      type === 'character' ? 'bg-gold/15 text-gold' : 'bg-info/15 text-info',
    )}>
      {type}
    </span>
  )
}

function PropPicker({
  castId,
  propId,
  propName,
  propImageUrl,
  propType,
  availableProps,
  usedPropIds,
  onAssign,
}: {
  castId: string
  propId: string | null
  propName: string | null
  propImageUrl: string | null
  propType: 'character' | 'background' | null
  availableProps: Prop[]
  usedPropIds: Set<string>
  onAssign: (castId: string, propId: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Show props not used by other cast members, plus the currently assigned one
  const selectableProps = availableProps.filter((p) => !usedPropIds.has(p.id) || p.id === propId)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 hover:opacity-75 transition-opacity"
      >
        {propId ? (
          <>
            {propImageUrl ? (
              <img
                src={propImageUrl}
                alt={propName ?? ''}
                className="size-7 rounded object-cover bg-base-300 shrink-0"
              />
            ) : (
              <div className="size-7 rounded bg-base-300 shrink-0" />
            )}
            <span className="text-sm">{propName}</span>
            {propType && <PropTypePill type={propType} />}
          </>
        ) : (
          <span className="text-sm text-base-content/30 italic">Assign prop…</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden">
          {selectableProps.length === 0 ? (
            <p className="text-xs text-base-content/40 px-3 py-2">No props available</p>
          ) : (
            selectableProps.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => { e.preventDefault(); onAssign(castId, p.id); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-300 transition-colors',
                  p.id === propId && 'bg-base-300',
                )}
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="size-8 rounded object-cover bg-base-300 shrink-0" />
                ) : (
                  <div className="size-8 rounded bg-base-300 shrink-0" />
                )}
                <span className="flex-1 text-left truncate">{p.name}</span>
                <PropTypePill type={p.type} />
              </button>
            ))
          )}
          {propId && (
            <>
              <div className="border-t border-base-300" />
              <button
                onMouseDown={(e) => { e.preventDefault(); onAssign(castId, null); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs text-error/60 hover:text-error hover:bg-base-300 transition-colors"
              >
                Unassign
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
