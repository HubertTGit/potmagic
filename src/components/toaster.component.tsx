import { useState, useEffect } from 'react'
import { toast } from '../lib/toast'

export function Toaster() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([])

  useEffect(() => toast.subscribe(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div className="toast toast-top toast-end z-50">
      {toasts.map((t) => (
        <div key={t.id} className="alert alert-error shadow-lg max-w-sm">
          <span className="text-sm">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
