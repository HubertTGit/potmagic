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
        return (
          <img
            key={cast.userId}
            src={cast.path}
            alt=""
            className={cn(
              'size-8 rounded-full object-cover bg-base-300 block transition-transform',
              isMe
                ? 'ring-2 ring-gold ring-offset-2 ring-offset-base-200 scale-110'
                : 'ring-1 ring-base-300',
            )}
          />
        )
      })}
    </div>
  )
}
