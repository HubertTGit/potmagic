import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/cn'
import { uploadAvatar } from '@/lib/avatar.fns'
import { Camera } from 'lucide-react'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session, refetch } = authClient.useSession()
  const user = session?.user
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDirty = name !== (user?.name ?? '')

  async function handleSave() {
    setSaving(true)
    await authClient.updateUser({ name })
    await refetch()
    setSaving(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const base64 = btoa(binary)
      await uploadAvatar({
        data: {
          base64,
          mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          fileName: file.name,
        },
      })
      await refetch()
    } finally {
      setUploading(false)
      // reset so the same file can be re-picked
      e.target.value = ''
    }
  }

  const initials = (user?.name ?? user?.email ?? '?')[0].toUpperCase()

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="relative group cursor-pointer"
          title="Upload avatar"
        >
          <div className="avatar">
            <div className="size-16 rounded-full bg-base-300 overflow-hidden">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? ''}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-2xl font-semibold text-base-content/60 select-none">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Overlay */}
          <div
            className={cn(
              'absolute inset-0 rounded-full flex items-center justify-center bg-base-content/40 transition-opacity',
              uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            {uploading ? (
              <span className="loading loading-spinner loading-sm text-base-100" />
            ) : (
              <Camera className="size-5 text-base-100" />
            )}
          </div>
        </button>

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
