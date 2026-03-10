import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../../../lib/auth-client'
import { MOCK_STORIES, type MockStory } from '../../../lib/mock-data'
import { StatusBadge } from '../../../components/status-badge.component'
import { cn } from '../../../lib/cn'

export const Route = createFileRoute('/_app/stories/')({
  component: StoriesPage,
})

function StoriesPage() {
  const { data: session } = authClient.useSession()
  const isDirector = session?.user?.role === 'director'
  const [stories, setStories] = useState<MockStory[]>(MOCK_STORIES)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const visibleStories = isDirector
    ? stories
    : stories.filter((s) => s.cast.some((c) => c.userId === session?.user?.id))

  const handleAdd = () => {
    if (!newTitle.trim()) return
    const story: MockStory = {
      id: `s${Date.now()}`,
      title: newTitle.trim(),
      directorId: session?.user?.id ?? '',
      status: 'draft',
      props: [],
      cast: [],
      scenes: [],
    }
    setStories((prev) => [...prev, story])
    setNewTitle('')
    setAdding(false)
  }

  const handleDelete = (id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Stories</h1>
        {isDirector && (
          <button
            onClick={() => setAdding(true)}
            className="btn btn-sm btn-gold font-display tracking-[0.05em]"
          >
            + New Story
          </button>
        )}
      </div>

      {/* Inline add form */}
      {adding && (
        <div className="flex gap-2 mb-4 items-center">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Story title…"
            className="input input-sm bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10 w-64"
          />
          <button onClick={handleAdd} className="btn btn-sm btn-gold font-display">Add</button>
          <button onClick={() => setAdding(false)} className="btn btn-sm btn-ghost text-base-content/50">Cancel</button>
        </div>
      )}

      {visibleStories.length === 0 ? (
        <p className="text-base-content/40 text-sm">No stories yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                <th>Title</th>
                <th>Status</th>
                <th>Actors</th>
                <th>Scenes</th>
                {isDirector && <th />}
              </tr>
            </thead>
            <tbody>
              {visibleStories.map((story) => (
                <tr key={story.id} className="hover:bg-base-200 transition-colors">
                  <td>
                    <Link
                      to="/stories/$storyId"
                      params={{ storyId: story.id }}
                      className="font-medium hover:text-gold transition-colors"
                    >
                      {story.title}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={story.status} />
                  </td>
                  <td className="text-base-content/50">{story.cast.length}</td>
                  <td className="text-base-content/50">{story.scenes.length}</td>
                  {isDirector && (
                    <td className="text-right">
                      <Link
                        to="/stories/$storyId"
                        params={{ storyId: story.id }}
                        className="text-xs text-base-content/50 hover:text-base-content mr-4 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="text-xs text-error/60 hover:text-error transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
