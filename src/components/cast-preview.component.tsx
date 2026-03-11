import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/cn'
import type { StageCast } from '@/components/stage.component'

interface CastPreviewProps {
  casts: StageCast[]
}

export function CastPreview({ casts }: CastPreviewProps) {
  const { data: session } = authClient.useSession()
  const currentUserId = session?.user?.id

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-base-200 border border-base-300 rounded-xl px-3 py-2 shadow-lg">
      {casts.map((cast) => {
        const isMe = cast.userId === currentUserId
        const ringClass = isMe
          ? 'ring-2 ring-gold ring-offset-2 ring-offset-base-200 scale-110'
          : 'ring-1 ring-base-300'
        return cast.path ? (
          <img
            key={cast.castId}
            src={cast.path}
            alt=""
            className={cn('size-8 rounded-full object-cover bg-base-300 block transition-transform', ringClass)}
          />
        ) : (
          <div
            key={cast.castId}
            className={cn('size-8 rounded-full bg-base-300 block transition-transform', ringClass)}
          />
        )
      })}
    </div>
  )
}
