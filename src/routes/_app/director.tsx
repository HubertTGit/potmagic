import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listStories } from '@/lib/stories.fns'
import { updateStoryStatus } from '@/lib/story-detail.fns'
import { StatusBadge } from '@/components/status-badge.component'
import { cn } from '@/lib/cn'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app/director')({
  component: DirectorPage,
})

interface LibraryItem {
  id: string
  name: string
  imageUrl: string
}

type Tab = 'dashboard' | 'library'

function DirectorPage() {
  const [characters, setCharacters] = useState<LibraryItem[]>([])
  const [backgrounds, setBackgrounds] = useState<LibraryItem[]>([])
  const [tab, setTab] = useState<Tab>('dashboard')

  const queryClient = useQueryClient()
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories(),
  })

  const statusMutation = useMutation({
    mutationFn: ({ storyId, status }: { storyId: string; status: 'draft' | 'active' | 'ended' }) =>
      updateStoryStatus({ data: { storyId, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  })

  const active = stories.filter((s) => s.status === 'active')
  const draft = stories.filter((s) => s.status === 'draft')
  const ended = stories.filter((s) => s.status === 'ended')

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Director</h1>
      <p className="text-sm text-base-content/40 mb-6">Manage sessions and story status.</p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-base-300 mb-8">
        {(['dashboard', 'library'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize tracking-wide border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-gold text-base-content'
                : 'border-transparent text-base-content/40 hover:text-base-content/70',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Active', count: active.length, color: 'text-success' },
              { label: 'Draft', count: draft.length, color: 'text-base-content/60' },
              { label: 'Ended', count: ended.length, color: 'text-base-content/30' },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-base-200 border border-base-300 rounded-xl px-5 py-4">
                <p className={cn('text-3xl font-bold font-display', color)}>{count}</p>
                <p className="text-xs text-base-content/40 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Stories table */}
          {isLoading ? (
            <p className="text-sm text-base-content/40">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                    <th>Story</th>
                    <th>Cast</th>
                    <th>Status</th>
                    <th>Session</th>
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
                      <td className="text-base-content/50">{story.castCount}</td>
                      <td>
                        <StatusBadge status={story.status} />
                      </td>
                      <td>
                        <SessionControls
                          story={story}
                          onSetStatus={(id, status) => statusMutation.mutate({ storyId: id, status })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'library' && (
        <>
          <p className="text-sm text-base-content/40 mb-6">Upload characters and backgrounds available across stories.</p>
          <div className="flex flex-col gap-8">
            <LibrarySection
              label="Characters"
              items={characters}
              onAdd={(item) => setCharacters((prev) => [...prev, item])}
              onRemove={(id) => setCharacters((prev) => prev.filter((i) => i.id !== id))}
            />
            <LibrarySection
              label="Backgrounds"
              items={backgrounds}
              onAdd={(item) => setBackgrounds((prev) => [...prev, item])}
              onRemove={(id) => setBackgrounds((prev) => prev.filter((i) => i.id !== id))}
            />
          </div>
        </>
      )}
    </div>
  )
}

function LibrarySection({
  label,
  items,
  onAdd,
  onRemove,
}: {
  label: string
  items: LibraryItem[]
  onAdd: (item: LibraryItem) => void
  onRemove: (id: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ imageUrl: string; name: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    const defaultName = file.name.replace(/\.[^.]+$/, '')
    setPending({ imageUrl, name: defaultName })
    e.target.value = ''
  }

  const handleConfirm = () => {
    if (!pending || !pending.name.trim()) return
    onAdd({ id: `lib-${Date.now()}`, name: pending.name.trim(), imageUrl: pending.imageUrl })
    setPending(null)
  }

  const handleCancel = () => {
    if (pending) URL.revokeObjectURL(pending.imageUrl)
    setPending(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
          {label} <span className="text-base-content/25">({items.length})</span>
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-xs btn-gold font-display tracking-wide"
        >
          + Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Pending upload — name confirmation */}
      {pending && (
        <div className="flex items-center gap-3 bg-base-200 border border-gold/30 rounded-xl p-3 mb-4">
          <img
            src={pending.imageUrl}
            alt=""
            className="size-14 rounded-lg object-cover shrink-0 bg-base-300"
          />
          <input
            autoFocus
            type="text"
            value={pending.name}
            onChange={(e) => setPending((p) => p && { ...p, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') handleCancel() }}
            placeholder="Name…"
            className="input input-sm flex-1 bg-base-300 border-base-300 text-sm focus:border-gold/60"
          />
          <button onClick={handleConfirm} className="btn btn-sm btn-gold font-display">Add</button>
          <button onClick={handleCancel} className="btn btn-sm btn-ghost text-base-content/40">Cancel</button>
        </div>
      )}

      {/* Grid */}
      {items.length === 0 && !pending ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 border border-dashed border-base-300 rounded-xl py-8 text-base-content/25 cursor-pointer hover:border-gold/30 hover:text-base-content/40 transition-colors"
        >
          <PhotoIcon className="size-7" />
          <span className="text-xs">Upload your first {label.toLowerCase().slice(0, -1)}</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden bg-base-200 border border-base-300 aspect-square">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-base-100/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                <span className="text-xs font-medium text-center leading-tight line-clamp-2">{item.name}</span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-error/70 hover:text-error transition-colors"
                >
                  <XMarkIcon className="size-4" />
                </button>
              </div>
              <p className="absolute bottom-0 inset-x-0 text-xs text-center bg-base-300/80 px-1 py-0.5 truncate group-hover:opacity-0 transition-opacity">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionControls({
  story,
  onSetStatus,
}: {
  story: { id: string; status: 'draft' | 'active' | 'ended' }
  onSetStatus: (id: string, status: 'draft' | 'active' | 'ended') => void
}) {
  if (story.status === 'draft') {
    return (
      <button
        onClick={() => onSetStatus(story.id, 'active')}
        className="btn btn-xs btn-success font-display tracking-wide"
      >
        Start session
      </button>
    )
  }
  if (story.status === 'active') {
    return (
      <button
        onClick={() => onSetStatus(story.id, 'ended')}
        className="btn btn-xs btn-error btn-outline font-display tracking-wide"
      >
        End session
      </button>
    )
  }
  return <span className="text-xs text-base-content/30">—</span>
}
