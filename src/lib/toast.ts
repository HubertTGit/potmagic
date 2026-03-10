type ToastEntry = { id: number; message: string; type: 'error' | 'success' | 'info' }
type Listener = (toasts: ToastEntry[]) => void

let next = 0
let toasts: ToastEntry[] = []
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((l) => l([...toasts]))
}

export const toast = {
  error(message: string) {
    const id = ++next
    toasts = [...toasts, { id, message, type: 'error' }]
    notify()
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notify()
    }, 5000)
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}
