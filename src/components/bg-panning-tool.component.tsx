import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Speed = 0 | 1 | 2 | 3;
type Direction = "left" | "right" | null;

interface BgPanningToolProps {
  leftProgress: number;
  rightProgress: number;
  isDirector: boolean;
  activeDirection?: Direction;
}

export function BgPanningTool({
  leftProgress,
  rightProgress,
  isDirector,
  activeDirection,
}: BgPanningToolProps) {
  const [speed, setSpeed] = useState<Speed>(0);
  const [direction, setDirection] = useState<Direction>(null);

  const resolvedDirection = isDirector ? direction : (activeDirection ?? null);

  const handleClick = useCallback(
    (btn: "left" | "right") => {
      if (direction === btn) {
        const next = ((speed + 1) % 4) as Speed;
        setSpeed(next);
        if (next === 0) setDirection(null);
      } else if (direction !== null) {
        const next = (speed - 1) as Speed;
        setSpeed(next);
        if (next === 0) setDirection(null);
      } else {
        setDirection(btn);
        setSpeed(1);
      }
    },
    [direction, speed],
  );

  return (
    <div className="flex flex-col gap-1">
      {isDirector && (
        <div className="border-base-300 bg-base-200 flex items-center overflow-hidden rounded-xl border shadow-lg">
          <button
            type="button"
            onClick={() => handleClick("left")}
            className={cn(
              "btn btn-sm btn-ghost border-base-300 gap-1 rounded-none border-r",
              direction === "left" && "text-primary",
            )}
          >
            {direction === "left" && speed > 0 ? (
              <>
                <ChevronsLeft className="size-4 animate-pulse" />
                {`${speed}x`}
              </>
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setSpeed(0);
              setDirection(null);
            }}
            className={cn(
              "hover:text-base-content flex min-w-13 items-center justify-center gap-1 px-3 py-1.5 text-center text-xs font-semibold tabular-nums transition-colors",
              direction && "cursor-pointer",
              direction ? "text-primary" : "text-base-content/60",
            )}
          >
            {direction === "left" ? (
              <div className="animate-wiggle">... animating left</div>
            ) : direction === "right" ? (
              <div className="animate-wiggle">animating right ...</div>
            ) : (
              <>
                background <MoveHorizontal className="size-3" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleClick("right")}
            className={cn(
              "btn btn-sm btn-ghost border-base-300 gap-1 rounded-none border-l",
              direction === "right" && "text-primary",
            )}
          >
            {direction === "right" && speed > 0 ? (
              <>
                {`${speed}x`}
                <ChevronsRight className="size-4 animate-pulse" />
              </>
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>
      )}

      {!isDirector && (
        <div className="flex w-28 items-center justify-center gap-1 text-xs">
          background <MoveHorizontal className="size-2" />{" "}
        </div>
      )}

      <progress
        className={cn(
          "progress progress-primary w-full transition-all",
          resolvedDirection === "left" && "scale-x-[-1]",
        )}
        value={
          resolvedDirection === "left"
            ? leftProgress
            : resolvedDirection === "right"
              ? rightProgress
              : 0
        }
        max={100}
      />
    </div>
  );
}
