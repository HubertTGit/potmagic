import { cn } from '@/lib/cn'
import type { StoryStatus } from '@/lib/mock-data'

const STATUS_STYLES: Record<StoryStatus, string> = {
  draft: 'badge-warning',
  active: 'badge-success',
  ended: 'badge-neutral',
}

export function StatusBadge({ status }: { status: StoryStatus }) {
  return (
    <span className={cn('badge badge-sm font-semibold uppercase tracking-wider', STATUS_STYLES[status])}>
      {status}
    </span>
  )
}
