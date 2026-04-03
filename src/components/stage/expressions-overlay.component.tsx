import { X } from "lucide-react";

interface ExpressionsOverlayProps {
  onClose: () => void;
  sceneCastId: string;
}

export function ExpressionsOverlay({ onClose, sceneCastId }: ExpressionsOverlayProps) {
  return (
    <div className="bg-base-100 border-base-300 pointer-events-auto absolute top-full left-1/2 z-50 mt-4 w-64 -translate-x-1/2 rounded-2xl border p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xs font-bold uppercase tracking-widest text-base-content/60">
          Expressions
        </h3>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-circle btn-xs"
        >
          <X className="size-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Expressions controls will go here */}
        <div className="col-span-2 text-center py-8 border border-dashed border-base-300 rounded-xl">
          <p className="text-[10px] text-base-content/30 italic">No controls yet for {sceneCastId}</p>
        </div>
      </div>

      {/* Arrow pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-base-300" />
      <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 border-x-[7px] border-b-[7px] border-x-transparent border-b-base-100" />
    </div>
  );
}
