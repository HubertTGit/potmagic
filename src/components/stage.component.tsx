import React, { useEffect, useRef, useState } from "react";
import { Application } from "pixi.js";
import type { Room } from "livekit-client";
import { PixiCharacter } from "@/components/draggable-character.component";
import { PixiBackground } from "@/components/draggable-background.component";
import { authClient } from "@/lib/auth-client";
import type { PropType } from "@/db/schema";

export interface StageCast {
  sceneCastId: string;
  castId: string;
  userId: string;
  path: string | null;
  type: PropType | null;
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
  },
  ref,
) {
  const { data: session } = authClient.useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const propsRef = useRef<Map<string, PixiCharacter | PixiBackground>>(
    new Map(),
  );
  const appReadyRef = useRef(false);

  const [allLoaded, setAllLoaded] = useState(false);

  // Expose the container div via forwardRef
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(containerRef.current);
    } else {
      (ref as { current: HTMLDivElement | null }).current =
        containerRef.current;
    }
  });

  // Initialize PixiJS app once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const app = new Application();
    appRef.current = app;
    const props = propsRef.current;
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
      });

    return () => {
      unmounted = true;
      appReadyRef.current = false;
      for (const prop of props.values()) {
        prop.destroy();
      }
      props.clear();
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
      if (!appReadyRef.current) {
        return requestAnimationFrame(sync);
      }

      const existing = propsRef.current;
      const nextIds = new Set(casts.map((c) => c.sceneCastId));

      // Remove characters no longer in scene
      for (const [id, prop] of existing) {
        if (!nextIds.has(id)) {
          prop.saveCurrentPosition();
          prop.destroy();
          app.stage.removeChild(prop.container);
          existing.delete(id);
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

        const canDrag =
          session?.user?.id === cast.userId ||
          session?.user?.role === "director";

        const PropClass =
          cast.type === "background" ? PixiBackground : PixiCharacter;
        const prop = new PropClass({
          sceneCastId: cast.sceneCastId,
          castId: cast.castId,
          src: cast.path,
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
          onReady: () => {
            remaining -= 1;
            if (remaining === 0) setAllLoaded(true);
          },
        });

        app.stage.addChild(prop.container);
        existing.set(cast.sceneCastId, prop);
      }
    };

    const rafId = sync();
    if (typeof rafId === "number") {
      return () => cancelAnimationFrame(rafId);
    }
  }, [casts, room, session, stageWidth, stageHeight]);

  // Update speaking glow without recreating characters
  useEffect(() => {
    const props = propsRef.current;
    for (const [, prop] of props) {
      const cast = casts.find((c) => c.sceneCastId === prop.container.label);
      if (cast) prop.updateSpeaking(speakingIds.has(cast.userId));
    }
  }, [speakingIds, casts]);

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
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
});
