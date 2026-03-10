import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth-client'
import { listStories, createStory, deleteStory } from '@/lib/stories.fns'
import { StatusBadge } from '@/components/status-badge.component'

export const Route = createFileRoute('/_app/stories/')({
  component: StoriesPage,
})

function StoriesPage() {
  const { data: session } = authClient.useSession()
  const isDirector = session?.user?.role === 'director'
  const queryClient = useQueryClient()

  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories(),
  })

  const addMutation = useMutation({
    mutationFn: (title: string) => createStory({ data: { title } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      setNewTitle('')
      setAdding(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStory({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  })

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addMutation.mutate(newTitle.trim())
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
          <button onClick={handleAdd} disabled={addMutation.isPending} className="btn btn-sm btn-gold font-display">Add</button>
          <button onClick={() => setAdding(false)} className="btn btn-sm btn-ghost text-base-content/50">Cancel</button>
        </div>
      )}

      {isLoading ? (
        <p className="text-base-content/40 text-sm">Loading…</p>
      ) : stories.length === 0 ? (
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
              {stories.map((story) => (
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
                  <td className="text-base-content/50">{story.castCount}</td>
                  <td className="text-base-content/50">{story.sceneCount}</td>
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
                        onClick={() => deleteMutation.mutate(story.id)}
                        disabled={deleteMutation.isPending}
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
