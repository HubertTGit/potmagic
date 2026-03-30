import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import {
  listCharacters,
  createCharacter,
  deleteCharacter,
} from "@/lib/character-builder.fns";
import { useLanguage } from "@/hooks/useLanguage";
import { Wand2, Drama, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import type { SubscriptionType } from "@/db/schema";

export const Route = createFileRoute("/($lang)/_app/character-builder/")({
  component: CharacterBuilderPage,
});

function CharacterBuilderPage() {
  const { t, langPrefix } = useLanguage();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const isDirector = session?.user?.role === "director";
  const isActor = session?.user?.role === "actor";
  const sub = session?.user?.subscription as SubscriptionType | undefined;
  const showSubDot = sub === "pro" || sub === "advance";
  const canAccess = isActor || (isDirector && showSubDot);

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: userCharacters = [], isLoading } = useQuery({
    queryKey: ["user-characters"],
    queryFn: () => listCharacters(),
    enabled: canAccess,
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => createCharacter({ data: { name } }),
    onSuccess: (char) => {
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
      navigate({ to: `${langPrefix}/character-builder/${char.id}` as any });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (characterId: string) =>
      deleteCharacter({ data: { characterId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
      queryClient.invalidateQueries({ queryKey: ["cb-count"] });
      setDeleteTarget(null);
      toast.success("Character deleted");
    },
    onError: () => {
      toast.error("Failed to delete character");
    },
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMutation.mutate(newName.trim());
  };

  if (!canAccess) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="text-base-content/60 mb-2 text-lg font-semibold">
            Character Builder
          </p>
          <p className="text-base-content/40 text-sm">
            Available for directors with a Pro or Advance subscription, and all
            actors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Drama className="text-primary size-8" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">
              {t("characterBuilder.heading")}
            </h1>
            <p className="text-base-content/60">
              {t("characterBuilder.myCharacters")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="btn btn-primary font-display tracking-[0.05em]"
        >
          + {t("characterBuilder.createYourOwn")}
        </button>
      </header>

      {/* Inline add form */}
      {adding && (
        <div className="mb-4 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder={t("characterBuilder.namePlaceholder")}
            className="input input-sm bg-base-200 border-base-300 focus:border-primary/60 focus:ring-primary/10 w-64 text-sm focus:ring-2"
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="btn btn-sm btn-primary font-display"
          >
            {t("action.add")}
          </button>
          <button
            onClick={() => setAdding(false)}
            className="btn btn-sm btn-ghost text-base-content/50"
          >
            {t("action.cancel")}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card bg-base-200">
              <div className="card-body gap-3 p-6">
                <div className="flex items-start justify-between">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-5 w-12 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <div className="skeleton h-3 w-16 rounded" />
                </div>
                <div className="skeleton mt-2 h-8 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : userCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-primary/5 mb-4 flex size-20 items-center justify-center rounded-2xl">
            <Drama className="text-primary/40 size-10" />
          </div>
          <p className="text-base-content/40 text-sm">
            No characters yet. Create your first one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {userCharacters.map((char) => (
            <div
              key={char.id}
              className="card bg-base-200 border-base-300 group relative border transition-shadow hover:shadow-md"
            >
              <div
                className="card-body cursor-pointer gap-3 p-6"
                onClick={() =>
                  navigate({
                    to: `${langPrefix}/character-builder/${char.id}` as any,
                  })
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="card-title hover:text-primary text-lg font-medium transition-colors">
                    {char.name}
                  </p>

                  <div className="flex items-center gap-2">
                    {char.compositePropId && (
                      <span className="badge badge-success badge-sm shrink-0 font-medium tracking-wider uppercase">
                        Published
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(char.id);
                      }}
                      className="text-error/60 hover:text-error text-xs transition-colors"
                      aria-label="Delete character"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-display text-lg font-bold">
              Delete Character?
            </h3>
            <p className="text-base-content/60 py-4 text-sm">
              This will permanently delete the character and its published prop.
              This cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setDeleteTarget(null)}
              >
                {t("action.cancel")}
              </button>
              <button
                className="btn btn-sm btn-error"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget)}
              >
                {deleteMutation.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDeleteTarget(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
