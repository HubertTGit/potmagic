import { Rive } from "@rive-app/webgl2";
import { useEffect, useRef } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// import pkg from "@rive-app/webgl2";
// import type { Rive as RiveType } from "@rive-app/webgl2";
// const { Rive } = pkg as any;

export function RiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const riveRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let app: any;

    async function initPixi() {
      if (!canvasRef.current) return;

      // Dynamic import prevents 'navigator is not defined' SSR errors
      const { Application, Assets, Sprite } = await import("pixi.js");

      app = new Application();
      await app.init({
        canvas: canvasRef.current,
        backgroundAlpha: 0,
        resizeTo: canvasRef.current.parentElement || window,
      });

      const texture = await Assets.load("/teaser1.png");
      const sprite = new Sprite(texture);

      sprite.anchor.set(0.5);
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;

      app.stage.addChild(sprite);
    }

    initPixi();

    return () => {
      if (app) {
        app.destroy(true, { children: true, texture: true });
      }
    };
  }, []);

  useEffect(() => {
    let riveInstance: Rive | null = null;

    async function initRive() {
      if (!riveRef.current) return;

      const { Rive } = await import("@rive-app/webgl2");

      riveInstance = new Rive({
        src: "/fox.riv",
        canvas: riveRef.current,
        autoplay: true,
      });
    }

    initRive();

    return () => {
      if (riveInstance) {
        riveInstance.cleanup();
      }
    };
  }, []);

  // Using className or h-full / w-full logic so the element flexes with its parent correctly
  return (
    <>
      <canvas ref={canvasRef} className="h-1/4 w-1/4" />
      <canvas ref={riveRef} className="h-1/4 w-1/4"></canvas>
    </>
  );
}
