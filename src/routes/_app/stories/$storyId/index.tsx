import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { getStory, MOCK_USERS, type MockCast, type MockScene } from '../../../../lib/mock-data'
import { StatusBadge } from '../../../../components/status-badge.component'
import { Breadcrumb } from '../../../../components/breadcrumb.component'
import { cn } from '../../../../lib/cn'

export const Route = createFileRoute('/_app/stories/$storyId/')({
  component: StoryDetailPage,
})

function StoryDetailPage() {
  const { storyId } = Route.useParams()
  const story = getStory(storyId)

  const [title, setTitle] = useState(story?.title ?? '')
  const [activeTab, setActiveTab] = useState<'cast' | 'scenes'>('cast')
  const [cast, setCast] = useState<MockCast[]>(story?.cast ?? [])
  const [scenes, setScenes] = useState<MockScene[]>(story?.scenes ?? [])
  const [newSceneTitle, setNewSceneTitle] = useState('')
  const [actorSearch, setActorSearch] = useState('')
  const [actorDropdownOpen, setActorDropdownOpen] = useState(false)
  const actorSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actorSearchRef.current && !actorSearchRef.current.contains(e.target as Node)) {
        setActorDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isTitleDirty = title !== (story?.title ?? '')

  if (!story) {
    return (
      <div className="p-8">
        <p className="text-base-content/40">Story not found.</p>
      </div>
    )
  }

  const actorUsers = MOCK_USERS.filter((u) => u.role === 'actor')
  const castUserIds = new Set(cast.map((c) => c.userId))
  const availableActors = actorUsers.filter((u) => !castUserIds.has(u.id))
  const filteredActors = availableActors.filter((u) =>
    u.name.toLowerCase().includes(actorSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(actorSearch.toLowerCase()),
  )

  const handleRemoveCast = (castId: string) => {
    setCast((prev) => prev.filter((c) => c.id !== castId))
  }

  const handleAddActor = (userId: string) => {
    const user = MOCK_USERS.find((u) => u.id === userId)
    if (!user) return
    const availableProp = story.props.find(
      (p) => p.type === 'character' && !cast.some((c) => c.propId === p.id),
    ) ?? { id: `unassigned-${Date.now()}`, storyId: story.id, name: 'Unassigned', type: 'character' as const, imageUrl: null }
    const newCast: MockCast = {
      id: `c${Date.now()}`,
      storyId: story.id,
      userId,
      propId: availableProp.id,
      name: `${user.name} as ${availableProp.name}`,
      imageUrl: null,
      user,
      prop: availableProp,
    }
    setCast((prev) => [...prev, newCast])
    setActorSearch('')
    setActorDropdownOpen(false)
  }

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return
    const scene: MockScene = {
      id: `sc${Date.now()}`,
      storyId: story.id,
      title: newSceneTitle.trim(),
      order: scenes.length + 1,
    }
    setScenes((prev) => [...prev, scene])
    setNewSceneTitle('')
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
          disabled={!isTitleDirty}
          className={cn(
            'btn btn-sm btn-gold font-display tracking-[0.05em]',
            !isTitleDirty && 'opacity-40 cursor-not-allowed',
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
                  <th>Character</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cast.map((c) => (
                  <tr key={c.id} className="hover:bg-base-200 transition-colors">
                    <td>{c.user.name}</td>
                    <td className="text-base-content/70">{c.prop.name}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handleRemoveCast(c.id)}
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
                        onMouseDown={(e) => { e.preventDefault(); handleAddActor(u.id) }}
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
              [...scenes].sort((a, b) => a.order - b.order)
                .map((scene) => (
                  <div
                    key={scene.id}
                    className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
                  >
                    <span className="text-sm">
                      <span className="text-base-content/40 mr-2">{scene.order}.</span>
                      {scene.title}
                    </span>
                    <Link
                      to="/stories/$storyId/scenes/$sceneId"
                      params={{ storyId, sceneId: scene.id }}
                      className="text-xs text-gold hover:text-gold/70 transition-colors"
                    >
                      View →
                    </Link>
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
            <button onClick={handleAddScene} className="btn btn-sm btn-gold font-display">
              + Add Scene
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
