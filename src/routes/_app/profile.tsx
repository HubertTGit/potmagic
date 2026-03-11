import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authClient } from '@/lib/auth-client'
import { getIsActorInCast, getHasCreatedStories } from '@/lib/profile.fns'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session, refetch } = authClient.useSession()
  const user = session?.user
  const [name, setName] = useState(user?.name ?? '')
  const [role, setRole] = useState<'actor' | 'director'>((user?.role as 'actor' | 'director') ?? 'actor')
  const [saving, setSaving] = useState(false)
  const isDirty = name !== (user?.name ?? '') || role !== (user?.role ?? 'actor')

  const { data: isInCast = false } = useQuery({
    queryKey: ['profile', 'isInCast'],
    queryFn: () => getIsActorInCast(),
    enabled: user?.role === 'actor',
  })

  const { data: hasCreatedStories = false } = useQuery({
    queryKey: ['profile', 'hasCreatedStories'],
    queryFn: () => getHasCreatedStories(),
    enabled: user?.role === 'director',
  })

  const roleLocked =
    (user?.role === 'actor' && isInCast) ||
    (user?.role === 'director' && hasCreatedStories)

  async function handleSave() {
    setSaving(true)
    await authClient.updateUser({ name, role })
    await refetch()
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="size-16 rounded-full bg-base-300 flex items-center justify-center text-2xl font-semibold text-base-content/60 select-none">
          {(user?.name ?? user?.email ?? '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{user?.name ?? '—'}</p>
          <p className="text-sm text-base-content/50">{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <fieldset className="fieldset gap-1">
          <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
            Display Name
          </legend>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="input w-full bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
          />
        </fieldset>

        <fieldset className="fieldset gap-1">
          <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
            Email
          </legend>
          <input
            type="email"
            value={user?.email ?? ''}
            readOnly
            className="input w-full bg-base-200 border-base-300 text-sm opacity-50 cursor-not-allowed"
          />
        </fieldset>

        <fieldset className="fieldset gap-1">
          <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
            Role
          </legend>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'actor' | 'director')}
            disabled={roleLocked}
            className={cn(
              'select w-full bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10',
              roleLocked && 'opacity-50 cursor-not-allowed',
            )}
          >
            <option value="actor">Actor</option>
            <option value="director">Director</option>
          </select>
          {roleLocked && (
            <p className="text-xs text-base-content/40 mt-1">
              {user?.role === 'director'
                ? 'Role cannot be changed while you have created stories.'
                : 'Role cannot be changed while assigned to a story cast.'}
            </p>
          )}
        </fieldset>

        <button
          disabled={!isDirty || saving}
          onClick={handleSave}
          className={cn(
            'btn btn-gold w-fit mt-2 font-display tracking-[0.08em]',
            (!isDirty || saving) && 'opacity-40 cursor-not-allowed',
          )}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
