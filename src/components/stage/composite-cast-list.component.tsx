import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useStage, useStagePresence } from "./stage.context";
import { X } from "lucide-react";

export function CompositeCastList() {
  const { casts } = useStage();
  const { isDirector } = useStagePresence();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const [activeCastId, setActiveCastId] = useState<string | null>(null);

  const compositeCasts = casts.filter(
    (c) =>
      (c.type === "composite-human" || c.type === "composite-animal") && c.path,
  );

  const visibleCompositeCasts = compositeCasts.filter((c) => {
    if (isDirector) return true;
    return c.userId === currentUserId;
  });

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
                <div className="bg-base-100 border-base-300 pointer-events-auto absolute top-full left-1/2 z-50 mt-4 w-64 -translate-x-1/2 rounded-2xl border p-4 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-xs font-bold uppercase tracking-widest text-base-content/60">
                      Expressions
                    </h3>
                    <button 
                      onClick={() => setActiveCastId(null)}
                      className="btn btn-ghost btn-circle btn-xs"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Expressions controls will go here */}
                    <div className="col-span-2 text-center py-8 border border-dashed border-base-300 rounded-xl">
                      <p className="text-[10px] text-base-content/30 italic">No controls yet</p>
                    </div>
                  </div>

                  {/* Arrow pointer */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-base-300" />
                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 border-x-[7px] border-b-[7px] border-x-transparent border-b-base-100" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
