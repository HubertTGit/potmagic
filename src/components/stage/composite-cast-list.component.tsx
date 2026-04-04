import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useStage, useStagePresence } from "./stage.context";
import { ExpressionsOverlay } from "./expressions-overlay.component";

export function CompositeCastList() {
  const { casts } = useStage();
  const { isDirector } = useStagePresence();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const [activeCastId, setActiveCastId] = useState<string | null>(null);

  if (!isDirector) return null;

  const visibleCompositeCasts = casts.filter(
    (c) =>
      (c.type === "composite-human" || c.type === "composite-animal") && c.path,
  );

  if (visibleCompositeCasts.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="bg-base-200 border-base-300 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg">
        {visibleCompositeCasts.map((cast) => {
          const isMe = cast.userId === currentUserId;
          const isActive = activeCastId === cast.sceneCastId;

          let ringClass = "ring-1 ring-base-300";
          if (isMe) {
            ringClass = "ring-2 ring-primary ring-offset-2 ring-offset-base-200 scale-110";
          }

          return (
            <div key={cast.sceneCastId} className="relative">
              <button
                type="button"
                onClick={() => setActiveCastId(isActive ? null : cast.sceneCastId)}
                className={cn(
                  "bg-base-300 block size-8 rounded-full overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-base-200",
                  ringClass,
                  isActive && "ring-accent ring-2 ring-offset-2 scale-110 shadow-lg",
                )}
              >
                {cast.imageUrl || cast.path ? (
                  <img
                    src={cast.imageUrl || cast.path!}
                    alt={cast.propName || ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full" />
                )}
              </button>

              {isActive && (
                <ExpressionsOverlay 
                  sceneCastId={cast.sceneCastId}
                  onClose={() => setActiveCastId(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
