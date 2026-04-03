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
import { cn } from "@/lib/cn";
import { useLanguage } from "@/hooks/useLanguage";

interface ExpressionsOverlayProps {
  onClose: () => void;
  sceneCastId: string;
}

export function ExpressionsOverlay({
  onClose,
  sceneCastId,
}: ExpressionsOverlayProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-base-100 border-base-300 pointer-events-auto absolute top-full left-1/2 z-50 mt-4 w-fit -translate-x-1/2 rounded-2xl border p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="font-display text-base-content/40 text-[9px] font-bold tracking-widest uppercase">
          {t("characterBuilder.expressions")}
        </h3>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-circle btn-xs min-h-0 h-5 w-5"
        >
          <X className="size-2.5 opacity-40" />
        </button>
      </div>

      <div className="bg-base-200/50 border-base-300 grid grid-cols-3 gap-1 rounded-2xl border p-1 shadow-inner">
        {/* Row 1: Mouth */}
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.laughing")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <Laugh className="size-4" />
          </button>
        </div>
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.smiling")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <Smile className="size-4" />
          </button>
        </div>
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.sad")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <Frown className="size-4" />
          </button>
        </div>

        {/* Row 2: Eyes */}
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.alert")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <Eye className="size-4" />
          </button>
        </div>
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.blink")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <EyeClosed className="size-4" />
          </button>
        </div>
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.squint")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <EyeClosed className="size-4 rotate-180" />
          </button>
        </div>

        {/* Row 3: Brows */}
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.raisedBrows")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <Meh className="size-4" />
          </button>
        </div>
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.happyBrows")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <Smile className="size-4" />
          </button>
        </div>
        <div className="tooltip tooltip-top" data-tip={t("characterBuilder.angryBrows")}>
          <button className="btn btn-ghost btn-circle btn-xs h-9 w-9">
            <Angry className="size-4" />
          </button>
        </div>
      </div>

      {/* Arrow pointer */}
      <div className="border-b-base-300 absolute -top-2 left-1/2 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent" />
      <div className="border-b-base-100 absolute -top-[7px] left-1/2 -translate-x-1/2 border-x-[7px] border-b-[7px] border-x-transparent" />
    </div>
  );
}
