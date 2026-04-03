import { useEffect, useState } from "react";
import {
  X,
  Laugh,
  Smile,
  Frown,
  Eye,
  EyeClosed,
  Meh,
  Angry,
} from "lucide-react";
import { useAtom } from "jotai";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/hooks/useLanguage";
import { characterExpressionsAtom } from "@/lib/character-expressions.atoms";

interface ExpressionsOverlayProps {
  onClose: () => void;
  sceneCastId: string;
}

const EXPRESSIONS = [
  { id: "laughing", icon: Laugh, key: "characterBuilder.laughing" as const },
  { id: "smiling", icon: Smile, key: "characterBuilder.smiling" as const },
  { id: "sad", icon: Frown, key: "characterBuilder.sad" as const },
  { id: "alert", icon: Eye, key: "characterBuilder.alert" as const },
  { id: "blink", icon: EyeClosed, key: "characterBuilder.blink" as const },
  {
    id: "squint",
    icon: EyeClosed,
    key: "characterBuilder.squint" as const,
    className: "rotate-180",
  },
  { id: "raisedBrows", icon: Meh, key: "characterBuilder.raisedBrows" as const },
  { id: "happyBrows", icon: Smile, key: "characterBuilder.happyBrows" as const },
  { id: "angryBrows", icon: Angry, key: "characterBuilder.angryBrows" as const },
] as const;

export function ExpressionsOverlay({
  onClose,
  sceneCastId,
}: ExpressionsOverlayProps) {
  const { t } = useLanguage();
  const [expressions, setExpressions] = useAtom(characterExpressionsAtom);

  const characterExps = expressions[sceneCastId] || {};

  const handleToggle = (id: string) => {
    const newValue = !characterExps[id];
    setExpressions((prev) => ({
      ...prev,
      [sceneCastId]: {
        ...(prev[sceneCastId] || {}),
        [id]: newValue,
      },
    }));
  };

  return (
    <div className="bg-base-100 border-base-300 pointer-events-auto absolute top-full left-1/2 z-50 mt-4 w-fit -translate-x-1/2 rounded-2xl border p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="font-display text-base-content/40 text-[9px] font-bold tracking-widest uppercase">
          {t("characterBuilder.expressions")}
        </h3>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-circle btn-xs h-5 w-5 min-h-0"
        >
          <X className="size-2.5 opacity-40" />
        </button>
      </div>

      <div className="bg-base-200/50 border-base-300 grid grid-cols-3 gap-1 rounded-2xl border p-1 shadow-inner">
        {EXPRESSIONS.map((exp) => (
          <div
            key={exp.id}
            className="tooltip tooltip-top"
            data-tip={t(exp.key)}
          >
            <button
              onClick={() => handleToggle(exp.id)}
              className={cn(
                "btn btn-ghost btn-circle btn-xs h-9 w-9 transition-all duration-200",
                characterExps[exp.id] &&
                  "btn-primary bg-primary/20 text-primary shadow-sm",
              )}
            >
              <exp.icon
                className={cn(
                  "size-4",
                  "className" in exp ? exp.className : "",
                )}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Arrow pointer */}
      <div className="border-b-base-300 absolute -top-2 left-1/2 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent" />
      <div className="border-b-base-100 absolute -top-[7px] left-1/2 -translate-x-1/2 border-x-[7px] border-b-[7px] border-x-transparent" />
    </div>
  );
}
