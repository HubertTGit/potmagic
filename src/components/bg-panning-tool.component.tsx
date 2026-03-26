import { useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  Repeat,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import type { Room } from "livekit-client";
import { cn } from "@/lib/cn";
import { bgPanningAtom, bgProgressAtom } from "@/lib/bg-panning.atoms";
import type { BgDirection, BgSpeed } from "@/lib/livekit-messages";
import { useLanguage } from "@/hooks/useLanguage";

interface BgPanningToolProps {
  isDirector: boolean;
  room?: Room | null;
  backgroundRepeat?: boolean;
}

const encoder = new TextEncoder();

export function BgPanningTool({
  isDirector,
  room,
  backgroundRepeat = false,
}: BgPanningToolProps) {
  const { t } = useLanguage();
  const [{ direction, speed }, setBgPanning] = useAtom(bgPanningAtom);
  const { leftProgress, rightProgress } = useAtomValue(bgProgressAtom);

  const publishAnimate = useCallback(
    (nextDirection: BgDirection, nextSpeed: BgSpeed) => {
      if (!room) return;
      room.localParticipant.publishData(
        encoder.encode(
          JSON.stringify({
            type: "bg:animate",
            direction: nextDirection,
            speed: nextSpeed,
          }),
        ),
        { reliable: true },
      );
    },
    [room],
  );

  const handleClick = useCallback(
    (btn: "left" | "right") => {
      let nextDirection: BgDirection;
      let nextSpeed: BgSpeed;

      if (direction === btn) {
        const next = ((speed + 1) % 4) as BgSpeed;
        nextSpeed = next;
        nextDirection = next === 0 ? null : btn;
      } else if (direction !== null) {
        const next = (speed - 1) as BgSpeed;
        nextSpeed = next;
        nextDirection = next === 0 ? null : direction;
      } else {
        nextDirection = btn;
        nextSpeed = 1;
      }

      setBgPanning({ direction: nextDirection, speed: nextSpeed });
      publishAnimate(nextDirection, nextSpeed);
    },
    [direction, speed, setBgPanning, publishAnimate],
  );

  const handleStop = useCallback(() => {
    setBgPanning({ direction: null, speed: 0 });
    publishAnimate(null, 0);
  }, [setBgPanning, publishAnimate]);

  return (
    <div className="flex flex-col gap-1">
      {isDirector && (
        <div className="border-base-300 bg-base-200 flex items-center overflow-hidden rounded-xl border shadow-lg">
          <button
            type="button"
            onClick={() => handleClick("right")}
            disabled={rightProgress >= 100}
            className={cn(
              "btn btn-sm btn-ghost border-base-300 gap-1 rounded-none border-r",
              direction === "right" && "text-primary",
            )}
          >
            {direction === "right" && speed > 0 ? (
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
            onClick={handleStop}
            className={cn(
              "hover:text-base-content flex min-w-13 items-center justify-center gap-1 px-3 py-1.5 text-center text-xs font-semibold tabular-nums transition-colors",
              direction && "cursor-pointer",
              direction ? "text-primary" : "text-base-content/60",
            )}
          >
            {direction === "left" ? (
              <div className="animate-wiggle">{t("bg.animatingLeft")}</div>
            ) : direction === "right" ? (
              <div className="animate-wiggle">{t("bg.animatingRight")}</div>
            ) : (
              <>
                {t("bg.background")}{" "}
                {backgroundRepeat ? (
                  <Repeat className="size-4" />
                ) : (
                  <MoveHorizontal className="size-4" />
                )}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleClick("left")}
            disabled={leftProgress >= 100}
            className={cn(
              "btn btn-sm btn-ghost border-base-300 gap-1 rounded-none border-l",
              direction === "left" && "text-primary",
            )}
          >
            {direction === "left" && speed > 0 ? (
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

      {/* Intentional: show the indicator only when actively animating.
          The always-visible static label from the original is replaced by
          atom-driven direction state, so showing it only when direction is
          set is the correct new behaviour for non-directors. */}
      {!isDirector && direction && (
        <div className="flex w-28 items-center justify-center gap-1 text-xs">
          {t("bg.background")}{" "}
          {backgroundRepeat ? (
            <Repeat className="size-4" />
          ) : (
            <MoveHorizontal className="size-4" />
          )}
        </div>
      )}

      <progress
        className={cn(
          "progress progress-primary min-w-1.5xl w-full transition-all",
          direction === "left" && "scale-x-[-1]",
        )}
        value={
          direction === "left"
            ? leftProgress
            : direction === "right"
              ? rightProgress
              : 0
        }
        max={100}
      />
    </div>
  );
}
