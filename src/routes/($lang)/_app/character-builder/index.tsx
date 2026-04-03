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
import { Drama } from "lucide-react";
import { toast } from "@/lib/toast";
import type { SubscriptionType } from "@/db/schema";
import { ConfirmModal } from "@/components/confirm-modal";
import { CharacterCard } from "@/components/character-builder/character-card.component";

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
  const showSubDot = sub === "pro" || sub === "affiliate";
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
            {t("nav.characterBuilder")}
          </p>
          <p className="text-base-content/40 text-sm">
            {t("characterBuilder.unauthorized")}
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
            {t("stories.empty")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {userCharacters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={t("modal.confirmDeletion")}
        message={t("characterBuilder.deleteImageConfirm")}
        confirmText={t("action.delete")}
        confirmButtonClass="btn-error"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
