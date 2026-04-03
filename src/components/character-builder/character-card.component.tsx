import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import type { charactersHuman } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { useLanguage } from "@/hooks/useLanguage";

export interface CharacterCardProps {
  character: InferSelectModel<typeof charactersHuman>;
  onDelete: (id: string) => void;
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const navigate = useNavigate();
  const { t, langPrefix } = useLanguage();

  return (
    <div
      key={character.id}
      className="card bg-base-200 border-base-300 group relative border transition-shadow hover:shadow-md"
    >
      <div
        className="card-body cursor-pointer gap-3 p-6"
        onClick={() =>
          navigate({
            to: `${langPrefix}/character-builder/${character.id}` as any,
          })
        }
      >
        <div className="flex items-center justify-between gap-2">
          <p className="card-title hover:text-primary text-lg font-medium transition-colors">
            {character.name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {character.imageUrl && (
            <div className="bg-base-300 border-base-300 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
              <img
                src={character.imageUrl}
                alt={character.name || ""}
                className="size-full object-contain"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {character.compositePropId && (
                <span className="badge badge-success badge-sm shrink-0 font-medium tracking-wider uppercase">
                  {t("characterBuilder.published")}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(character.id);
                }}
                className="text-error/60 hover:text-error text-xs transition-colors"
                aria-label={t("characterBuilder.deleteCharacter")}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
