import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session, refetch } = authClient.useSession()
  const user = session?.user
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const isDirty = name !== (user?.name ?? '')

  async function handleSave() {
    setSaving(true)
    await authClient.updateUser({ name })
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
            className="input w-full bg-base-200 border-base-300 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
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

        <button
          disabled={!isDirty || saving}
          onClick={handleSave}
          className={cn(
            'btn btn-primary w-fit mt-2 font-display tracking-[0.08em]',
            (!isDirty || saving) && 'opacity-40 cursor-not-allowed',
          )}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
