import React, { useEffect, useRef, useState } from "react";
import { Application } from "pixi.js";
import { RoomEvent } from "livekit-client";
import type { Room } from "livekit-client";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { PixiCharacter } from "@/components/draggable-character.component";
import { PixiBackground } from "@/components/draggable-background.component";
import { PixiRiveAnimation } from "@/components/draggable-rive.component";
import { authClient } from "@/lib/auth-client";
import type { PropType } from "@/db/schema";
import { bgPanningAtom, bgProgressAtom } from "@/lib/bg-panning.atoms";
import { characterExpressionsAtom } from "@/lib/character-expressions.atoms";
import type { LiveKitMessage } from "@/lib/livekit-messages";
import { Maximize, Minimize } from "lucide-react";
import { CompositeHumanCharacter } from "@/components/character-builder/composite-human-character.component";
import { getCharacterByParts } from "@/lib/character-builder.fns";
import { getAnimalByProp } from "@/lib/character-animal-builder.fns";
import { useQueries } from "@tanstack/react-query";
import { useStagePresence } from "@/components/stage/stage.context";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export interface StageCast {
  sceneCastId: string;
  castId: string;
  userId: string;
  path: string | null;
  imageUrl: string | null;
  type: PropType | null;
  propName: string | null;
  posX: number | null;
  posY: number | null;
  rotation: number | null;
  scaleX: number | null;
}

interface StageComponentProps {
  casts: StageCast[];
  room?: Room | null;
  speakingIds?: Set<string>;
  stageWidth?: number;
  stageHeight?: number;
  backgroundRepeat?: boolean;
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

export const StageComponent = React.forwardRef<
  HTMLDivElement,
  StageComponentProps
>(function StageComponent(
  {
    casts,
    room,
    speakingIds = new Set(),
    stageWidth = STAGE_WIDTH,
    stageHeight = STAGE_HEIGHT,
    backgroundRepeat = false,
  },
  ref,
) {
  const { isDirector: isDirectorPresence } = useStagePresence();
  const { data: session } = authClient.useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const propsRef = useRef<
    Map<
      string,
      | PixiCharacter
      | PixiBackground
      | PixiRiveAnimation
      | CompositeHumanCharacter
    >
  >(new Map());
  // castId → prop lookup for O(1) dispatch of incoming LiveKit data messages
  const castIdMapRef = useRef<
    Map<
      string,
      | PixiCharacter
      | PixiBackground
      | PixiRiveAnimation
      | CompositeHumanCharacter
    >
  >(new Map());
  const appReadyRef = useRef(false);
  const prevCastIdsRef = useRef<string>("");

  const [allLoaded, setAllLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activeRiveProp, setActiveRiveProp] =
    useState<PixiRiveAnimation | null>(null);

  const bgPanning = useAtomValue(bgPanningAtom);
  const setBgPanning = useSetAtom(bgPanningAtom);
  const setBgProgress = useSetAtom(bgProgressAtom);

  const [expressions, setExpressions] = useAtom(characterExpressionsAtom);

  // Fetch character details for any composite props
  const compositeCasts = casts.filter(
    (c) =>
      (c.type === "composite-human" || c.type === "composite-animal") && c.path,
  );
  const characterQueries = useQueries({
    queries: compositeCasts.map((c) => ({
      queryKey: ["character-prop", c.path],
      queryFn: () =>
        c.type === "composite-human"
          ? getCharacterByParts({ data: { propId: c.path! } })
          : getAnimalByProp({ data: { propId: c.path! } }),
      staleTime: Infinity,
    })),
  });

  const allCharactersLoaded = characterQueries.every((q) => q.isSuccess);
  const charactersMap = new Map(
    characterQueries
      .filter((q) => q.isSuccess)
      .map((q) => [q.data?.compositePropId, q.data]),
  );

  // Sync div ref
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(containerRef.current);
    } else {
      (ref as { current: HTMLDivElement | null }).current =
        containerRef.current;
    }
  });

  // Sync expressions from Jotai atom to PIXI characters
  useEffect(() => {
    for (const [sceneCastId, charExps] of Object.entries(
      expressions as Record<string, Record<string, boolean>>,
    )) {
      const prop = propsRef.current.get(sceneCastId);
      if (!(prop instanceof CompositeHumanCharacter)) continue;

      for (const [type, value] of Object.entries(charExps)) {
        // Internal state field naming convention: isLaughing, isSmiling, isBlinking, etc.
        // We use a safe mapping to check current state and apply only if different
        const stateKey = `is${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        const currentVal = (prop as any)[stateKey];

        if (currentVal !== value) {
          // If the state is different, it means the atom changed (likely from local UI)
          // We apply the change and allow it to broadcast if this is the controller
          prop.setExpression(type, value, false);
        }
      }
    }
  }, [expressions]);

  // Initialize PixiJS app once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const app = new Application();
    appRef.current = app;
    const props = propsRef.current;
    const castIdMap = castIdMapRef.current;
    let unmounted = false;
    let initDone = false;

    app
      .init({
        width: stageWidth,
        height: stageHeight,
        backgroundAlpha: 0,
        antialias: true,
        preference: "webgl",
      })
      .then(() => {
        initDone = true;
        if (unmounted) {
          // Component unmounted before init finished — safe to destroy now
          app.destroy(true);
          return;
        }
        app.stage.sortableChildren = true;
        app.stage.eventMode = "static";
        app.stage.hitArea = app.screen;
        container.appendChild(app.canvas);
        appReadyRef.current = true;
        handleResize(); // Initial scale
      });

    const handleResize = () => {
      if (!app) return;
      const parent = container.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const isFull = !!document.fullscreenElement;

      const width = isFull ? window.innerWidth : rect.width;
      const height = isFull ? window.innerHeight : rect.height;

      app.renderer.resize(width, height);

      const scale = Math.min(width / stageWidth, height / stageHeight);
      app.stage.scale.set(scale);
      app.stage.x = (width - stageWidth * scale) / 2;
      app.stage.y = (height - stageHeight * scale) / 2;
    };

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      handleResize();
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      unmounted = true;
      appReadyRef.current = false;
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      for (const prop of props.values()) {
        prop.destroy();
      }
      props.clear();
      castIdMap.clear();
      appRef.current = null;
      // If init already finished, destroy immediately; otherwise the .then() above handles it
      if (initDone) app.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync casts onto the PixiJS stage
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    // Retry on RAF until the PixiJS canvas is appended
    const sync = (): number | void => {
      if (!appReadyRef.current || !allCharactersLoaded) {
        return requestAnimationFrame(sync);
      }

      const existing = propsRef.current;
      const nextIds = new Set(casts.map((c) => c.sceneCastId));

      // Remove characters no longer in scene OR with stale canDrag state
      for (const [id, prop] of existing) {
        const cast = casts.find((c) => c.sceneCastId === id);
        const canDrag = session?.user?.id === cast?.userId || isDirectorPresence;

        if (!nextIds.has(id) || prop.canDrag !== canDrag) {
          prop.saveCurrentPosition();
          prop.destroy();
          app.stage.removeChild(prop.container);
          existing.delete(id);
          // Remove from castId lookup
          for (const [cid, p] of castIdMapRef.current) {
            if (p === prop) {
              castIdMapRef.current.delete(cid);
              break;
            }
          }
        }
      }

      // Find casts that need a new PixiCharacter
      const newCasts = casts.filter(
        (c) => c.path && c.type && !existing.has(c.sceneCastId),
      );

      if (newCasts.length === 0) {
        setAllLoaded(true);
        return;
      }

      let remaining = newCasts.length;
      setAllLoaded(false);

      for (let i = 0; i < casts.length; i++) {
        const cast = casts[i];
        if (!cast.path || !cast.type) continue;
        if (existing.has(cast.sceneCastId)) continue;

        const canDrag = session?.user?.id === cast.userId || isDirectorPresence;

        const isComposite =
          cast.type === "composite-human" || cast.type === "composite-animal";

        const PropClass =
          cast.type === "background"
            ? PixiBackground
            : cast.type === "rive"
              ? PixiRiveAnimation
              : isComposite
                ? CompositeHumanCharacter
                : PixiCharacter;

        const charData = isComposite ? charactersMap.get(cast.path!) : null;

        const prop = new (PropClass as any)({
          sceneCastId: cast.sceneCastId,
          castId: cast.castId,
          src: cast.path,
          imageUrl: cast.imageUrl,
          parts: charData?.parts, // Only for CompositeHumanCharacter
          userId: cast.userId,
          type: cast.type,
          initialX: cast.posX ?? 100 + i * 200,
          initialY: cast.posY ?? 100,
          initialRotation: cast.rotation ?? 0,
          initialScaleX: cast.scaleX ?? 1,
          room,
          canDrag,
          stageWidth,
          stageHeight,
          app,
          ikLeftDirection: (charData as any)?.ikLeftDirection,
          ikRightDirection: (charData as any)?.ikRightDirection,
          onReady: () => {
            remaining -= 1;
            if (remaining === 0) setAllLoaded(true);
          },
          ...(cast.type === "rive" && {
            onSelect: (selected: boolean) => {
              if (selected) {
                setActiveRiveProp(prop as PixiRiveAnimation);
              } else {
                setActiveRiveProp((current) =>
                  current === prop ? null : current,
                );
              }
            },
          }),
          ...(cast.type === "background" && {
            backgroundRepeat,
            onPositionChange: (
              x: number,
              bounds: { minX: number; maxX: number },
            ) => {
              const range = bounds.maxX - bounds.minX;
              if (range <= 0) return;
              const rightProgress = Math.round(
                ((x - bounds.minX) / range) * 100,
              );
              setBgProgress({
                leftProgress: 100 - rightProgress,
                rightProgress,
              });
            },
            onAnimationComplete: () => {
              setBgPanning({ direction: null, speed: 0 });
              if (room && canDrag) {
                room.localParticipant.publishData(
                  encoder.encode(
                    JSON.stringify({
                      type: "bg:animate",
                      direction: null,
                      speed: 0,
                    }),
                  ),
                  { reliable: true },
                );
              }
            },
          }),
        });

        app.stage.addChild(prop.container);
        existing.set(cast.sceneCastId, prop);
        castIdMapRef.current.set(cast.castId, prop);

        // Enable Turn Mode for interactive characters on stage
        if (prop instanceof CompositeHumanCharacter && canDrag) {
          prop.setTurnMode(true);
        }

        // Apply initial facial expression state if available from global atom
        if (prop instanceof CompositeHumanCharacter) {
          const charExps = expressions[cast.sceneCastId];
          if (charExps) {
            for (const [type, value] of Object.entries(charExps)) {
              prop.setExpression(type, value, true);
            }
          }
        }
      }
    };

    const rafId = sync();
    if (typeof rafId === "number") {
      return () => cancelAnimationFrame(rafId);
    }
  }, [casts, room, session, stageWidth, stageHeight, allCharactersLoaded, isDirectorPresence, expressions]);

  // Single centralized LiveKit DataReceived handler — parse once, dispatch by castId
  useEffect(() => {
    if (!room) return;
    const onDataReceived = (payload: Uint8Array) => {
      let msg: LiveKitMessage;
      try {
        msg = JSON.parse(decoder.decode(payload)) as LiveKitMessage;
      } catch {
        return;
      }
      if (msg.type === "prop:move") {
        castIdMapRef.current.get(msg.castId)?.applyRemoteMove(msg);
      } else if (msg.type === "bg:animate") {
        setBgPanning({ direction: msg.direction, speed: msg.speed });
      } else if (msg.type === "prop:trigger") {
        const prop = castIdMapRef.current.get(msg.castId);
        if (prop instanceof PixiRiveAnimation) {
          prop.applyRemoteTrigger(msg.triggerName);
        }
      } else if (msg.type === "prop:expression") {
        const prop = castIdMapRef.current.get(msg.castId);
        if (prop instanceof CompositeHumanCharacter) {
          const sceneCastId = prop.container.label;
          // Apply to PIXI directly (with fromRemote=true to suppress echo)
          prop.setExpression(msg.expression, msg.value, true);

          // Also sync to global atom so UI is updated
          setExpressions((prev: Record<string, Record<string, boolean>>) => ({
            ...prev,
            [sceneCastId]: {
              ...(prev[sceneCastId] || {}),
              [msg.expression]: msg.value,
            },
          }));
        }
      }
    };
    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room?.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room, setBgPanning]);

  // Update speaking glow without recreating characters
  useEffect(() => {
    const props = propsRef.current;
    const castUserMap = new Map(casts.map((c) => [c.sceneCastId, c.userId]));
    for (const [, prop] of props) {
      const userId = castUserMap.get(prop.container.label);
      if (userId) {
        const isSpeaking = speakingIds.has(userId);
        if (prop instanceof CompositeHumanCharacter) {
          prop.setSpeaking(isSpeaking);
        } else {
          (prop as any).updateSpeaking(isSpeaking);
        }
      }
    }
  }, [speakingIds, casts]);

  // Eye tracking for CompositeHumanCharacters
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    const onMove = (e: any) => {
      // Find all composite characters and update their pupils and Turn Mode hover state
      for (const prop of propsRef.current.values()) {
        if (prop instanceof CompositeHumanCharacter && prop.canDrag) {
          prop.updatePupils(e.global.x, e.global.y);
          prop.handleGlobalHover({ x: e.global.x, y: e.global.y });
        }
      }
    };

    app.stage.on("globalpointermove", onMove);
    return () => {
      app?.stage?.off("globalpointermove", onMove);
    };
  }, [allLoaded]);

  // Drive PixiBackground setAnimation when bgPanningAtom changes
  useEffect(() => {
    for (const prop of propsRef.current.values()) {
      if (prop instanceof PixiBackground) {
        prop.setAnimation(bgPanning.direction, bgPanning.speed);
        break; // one background per scene
      }
    }
  }, [bgPanning]);

  // Reset atoms when scene (cast set) changes
  useEffect(() => {
    const castKey = casts
      .map((c) => c.sceneCastId)
      .sort()
      .join(",");
    if (castKey !== prevCastIdsRef.current) {
      prevCastIdsRef.current = castKey;
      setBgPanning({ direction: null, speed: 0 });
      setBgProgress({ leftProgress: 0, rightProgress: 0 });
    }
  }, [casts, setBgPanning, setBgProgress]);

  // Reset atoms on unmount
  useEffect(() => {
    return () => {
      setBgPanning({ direction: null, speed: 0 });
      setBgProgress({ leftProgress: 0, rightProgress: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist positions on unmount
  useEffect(() => {
    const props = propsRef.current;
    return () => {
      for (const prop of props.values()) {
        prop.saveCurrentPosition();
      }
    };
  }, []);

  return (
    <div className="relative h-180 w-7xl overflow-hidden">
      {!allLoaded && (
        <div className="bg-base-200 absolute inset-0 z-10 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      )}
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center bg-black"
      />
      {activeRiveProp && activeRiveProp.triggerValues.length > 0 && (
        <div className="bg-base-300/80 border-base-300 pointer-events-auto absolute bottom-0 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-2 rounded-xl border p-3 shadow-xl backdrop-blur-md">
          {activeRiveProp.triggerValues.slice(0, 6).map((trigger, idx) => {
            const keys = ["Q", "W", "E", "A", "S", "D"];
            return (
              <button
                key={trigger.name}
                type="button"
                onClick={() => activeRiveProp.handleTrigger(idx)}
                className="btn btn-xs btn-outline font-display border-base-content/20 hover:border-accent hover:bg-accent/10 hover:text-accent flex items-center gap-1.5 tracking-wider uppercase"
              >
                <span className="bg-base-content/10 text-base-content/60 rounded px-1 text-[10px] font-bold">
                  {keys[idx]}
                </span>
                {trigger.name}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }}
        className="btn btn-circle btn-ghost btn-sm hover:bg-neutral/20 absolute right-4 bottom-4 z-20"
      >
        {isFullscreen ? (
          <Minimize className="h-5 w-5 text-white shadow-sm" />
        ) : (
          <Maximize className="h-5 w-5 text-white shadow-sm" />
        )}
      </button>
    </div>
  );
});
